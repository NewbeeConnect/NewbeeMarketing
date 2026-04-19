/**
 * Logo composite helper.
 *
 * Problem: Nano Banana 2 (Gemini 3 Pro Image) — like every AI image model
 * today — cannot preserve custom brand text inside a logo across a fresh
 * render. Even with strict "do not redraw" instructions it treats the logo
 * region as generative canvas and garbles the letters.
 *
 * Fix: after Nano Banana returns, we paste the user-provided logo onto the
 * output PNG pixel-for-pixel via sharp. The logo survives Veo animation
 * only if we also overlay it on the final video frame — see
 * `lib/video/composite.ts` (separate follow-up) for that half.
 *
 * Defaults:
 *   - Placement: bottom-right
 *   - Size: 18% of output width (classic marketing-overlay ratio)
 *   - Padding: 5% of output width from edges
 *   - Slight drop-shadow-ish darkening under the logo to keep contrast on
 *     bright backgrounds — skipped if the logo has its own alpha-backed
 *     rectangle
 *
 * These defaults can be overridden per asset in a future iteration; for
 * now a sensible single preset is enough.
 */

import sharp from "sharp";

export type LogoPlacement = "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center";

export interface CompositeLogoInput {
  /** Full-resolution PNG that Nano Banana returned (base64). */
  generatedBase64: string;
  /** User-supplied logo image (base64), whatever dimensions/format. */
  logoBase64: string;
  /** Logo mime type, for sharp input detection. */
  logoMimeType: string;
  placement?: LogoPlacement;
  /** 0.05–0.4; 0.18 is a good marketing default. */
  widthFraction?: number;
}

/**
 * Returns a Buffer containing the composited PNG at the same resolution
 * as `generatedBase64`. Caller uploads it to Supabase storage.
 */
export async function compositeLogoOntoImage(
  input: CompositeLogoInput
): Promise<Buffer> {
  const placement = input.placement ?? "bottom-right";
  const widthFraction = clamp(input.widthFraction ?? 0.18, 0.05, 0.4);

  const generatedBuf = Buffer.from(input.generatedBase64, "base64");
  const logoBuf = Buffer.from(input.logoBase64, "base64");

  const baseMeta = await sharp(generatedBuf).metadata();
  const baseW = baseMeta.width ?? 1024;
  const baseH = baseMeta.height ?? 1024;

  const targetLogoW = Math.round(baseW * widthFraction);

  // Resize the logo to target width, preserving aspect. Convert to PNG so
  // we can safely composite over any base format; force sharp to keep
  // alpha from the source (most brand logos are PNG with transparency).
  const resizedLogo = await sharp(logoBuf, {
    // Accept JPEGs, WebP, etc. — sharp auto-detects.
    failOn: "none",
  })
    .resize({
      width: targetLogoW,
      withoutEnlargement: false, // allow upscale if the uploaded logo is tiny
      fit: "inside",
    })
    .png()
    .toBuffer({ resolveWithObject: true });

  const logoW = resizedLogo.info.width;
  const logoH = resizedLogo.info.height;

  const pad = Math.round(baseW * 0.05);
  const { left, top } = positionFor(placement, baseW, baseH, logoW, logoH, pad);

  const composited = await sharp(generatedBuf)
    .composite([
      {
        input: resizedLogo.data,
        left,
        top,
      },
    ])
    // Keep the underlying model format (Nano Banana ships PNG); always
    // re-encode PNG for consistency.
    .png({ compressionLevel: 6 })
    .toBuffer();

  return composited;
}

function positionFor(
  placement: LogoPlacement,
  baseW: number,
  baseH: number,
  logoW: number,
  logoH: number,
  pad: number
): { left: number; top: number } {
  switch (placement) {
    case "top-left":
      return { left: pad, top: pad };
    case "top-right":
      return { left: baseW - logoW - pad, top: pad };
    case "bottom-left":
      return { left: pad, top: baseH - logoH - pad };
    case "center":
      return {
        left: Math.round((baseW - logoW) / 2),
        top: Math.round((baseH - logoH) / 2),
      };
    case "bottom-right":
    default:
      return {
        left: baseW - logoW - pad,
        top: baseH - logoH - pad,
      };
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
