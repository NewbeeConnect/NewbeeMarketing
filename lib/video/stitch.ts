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
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`));
      });
    });

    return readFileSync(outputPath);
  } finally {
    try {
      rmSync(workDir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  }
}
