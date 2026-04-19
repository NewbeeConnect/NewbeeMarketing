import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegStatic from "ffmpeg-static";

/**
 * Concatenates MP4 clips using FFmpeg's concat demuxer. Clips must share codec,
 * framerate, resolution, and pixel format — Veo output is uniform so this
 * works without re-encoding. Returns the final MP4 as a Buffer.
 *
 * Runtime: Node.js only. Not edge-compatible (spawns a child process).
 */
export async function stitchVideos(videoBuffers: Buffer[]): Promise<Buffer> {
  if (videoBuffers.length === 0) {
    throw new Error("stitchVideos: no input buffers");
  }

  const ffmpegPath = ffmpegStatic;
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static binary not found");
  }

  const workDir = mkdtempSync(join(tmpdir(), "stitch-"));

  try {
    const inputPaths = videoBuffers.map((buf, i) => {
      const p = join(workDir, `input_${i}.mp4`);
      writeFileSync(p, buf);
      return p;
    });

    const listFile = join(workDir, "concat.txt");
    writeFileSync(
      listFile,
      inputPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n")
    );

    const outputPath = join(workDir, "output.mp4");

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ffmpegPath, [
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", listFile,
        "-c", "copy",
        "-movflags", "+faststart",
        outputPath,
      ]);

      let stderr = "";
      proc.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      proc.on("error", reject);
      proc.on("close", (code) => {
        if (code !== 0) {
          return reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`));
        }
        // Concat-demuxer tends to emit these lines as warnings rather than
        // errors when clips don't match exactly (codec/fps/resolution mismatch).
        // Fail loudly so the caller reports a clear message instead of shipping
        // a silently-broken mp4.
        const warnings = [
          "Non-monotonous DTS",
          "Non-monotonic DTS",
          "DTS out of order",
          "Timestamps are unset",
          "Could not find codec parameters",
        ];
        const triggered = warnings.find((w) => stderr.includes(w));
        if (triggered) {
          return reject(
            new Error(
              `ffmpeg concat warning treated as error: "${triggered}". Clips likely have mismatched codec/fps/resolution. stderr tail: ${stderr.slice(-500)}`
            )
          );
        }
        resolve();
      });
    });

    const output = readFileSync(outputPath);

    // Sanity: concatenated file should be at least ~80% of the sum of inputs.
    // Anything smaller means ffmpeg truncated silently.
    const expectedMin = Math.floor(
      videoBuffers.reduce((s, b) => s + b.byteLength, 0) * 0.8
    );
    if (output.byteLength < expectedMin) {
      throw new Error(
        `ffmpeg output is suspiciously small (${output.byteLength} bytes vs ${expectedMin} min) — concat likely failed partway`
      );
    }

    return output;
  } finally {
    try {
      rmSync(workDir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  }
}
