import sharp from "sharp";
import { PHONE_TEMPLATES } from "@/lib/constants";

type PhoneTemplate = (typeof PHONE_TEMPLATES)[number];

/**
 * Build an SVG phone frame with a transparent screen area.
 * When composited over the screenshot, the screenshot shows through the screen cutout.
 */
function buildPhoneFrameSvg(template: PhoneTemplate): string {
  const { frameWidth, frameHeight, frameRadius, screen, dynamicIsland } = template;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${frameWidth}" height="${frameHeight}" viewBox="0 0 ${frameWidth} ${frameHeight}">
  <defs>
    <!-- Screen cutout mask: white = visible, black = hidden -->
    <mask id="screen-cutout">
      <rect width="${frameWidth}" height="${frameHeight}" fill="white"/>
      <rect x="${screen.x}" y="${screen.y}" width="${screen.width}" height="${screen.height}" rx="${screen.radius}" fill="black"/>
    </mask>
    <!-- Subtle metallic gradient for frame -->
    <linearGradient id="frame-gradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a2a2e"/>
      <stop offset="50%" stop-color="#1a1a1e"/>
      <stop offset="100%" stop-color="#222226"/>
    </linearGradient>
  </defs>
  <!-- Phone body with screen cutout -->
  <rect width="${frameWidth}" height="${frameHeight}" rx="${frameRadius}" fill="url(#frame-gradient)" mask="url(#screen-cutout)"/>
  <!-- Thin metallic edge -->
  <rect width="${frameWidth}" height="${frameHeight}" rx="${frameRadius}" fill="none" stroke="#444" stroke-width="1.5"/>
  <!-- Dynamic Island -->
  <rect x="${dynamicIsland.x}" y="${dynamicIsland.y}" width="${dynamicIsland.width}" height="${dynamicIsland.height}" rx="${dynamicIsland.radius}" fill="#0a0a0a"/>
</svg>`;
}

/**
 * Round the corners of an image buffer using an SVG mask.
 */
async function roundCorners(
  imageBuffer: Buffer,
  width: number,
  height: number,
  radius: number
): Promise<Buffer> {
  const mask = Buffer.from(
    `<svg width="${width}" height="${height}">
      <rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>`
  );

  return sharp(imageBuffer)
    .resize(width, height, { fit: "cover", position: "centre" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

export interface CompositePhoneMockupParams {
  /** Screenshot image as Buffer */
  screenshotBuffer: Buffer;
  /** Template ID from PHONE_TEMPLATES */
  templateId: string;
  /** Canvas width (matches target aspect ratio, e.g. 1080 for 9:16) */
  canvasWidth: number;
  /** Canvas height (e.g. 1920 for 9:16) */
  canvasHeight: number;
  /** Background color (hex), default #0f0f13 */
  backgroundColor?: string;
}

export interface CompositeResult {
  /** Final composited image as PNG buffer */
  buffer: Buffer;
  /** Width of output */
  width: number;
  /** Height of output */
  height: number;
}

/**
 * Composite a screenshot into a phone frame and place on a canvas.
 *
 * Pipeline:
 * 1. Resize screenshot to fit phone screen area
 * 2. Round screenshot corners to match screen radius
 * 3. Generate phone frame SVG (with transparent screen cutout)
 * 4. Create canvas at target resolution
 * 5. Composite: canvas → screenshot → phone frame
 * 6. Return PNG buffer
 */
export async function compositePhoneMockup(
  params: CompositePhoneMockupParams
): Promise<CompositeResult> {
  const {
    screenshotBuffer,
    templateId,
    canvasWidth,
    canvasHeight,
    backgroundColor = "#0f0f13",
  } = params;

  // Find template
  const template = PHONE_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error(`Unknown phone template: ${templateId}`);
  }

  // Calculate phone scale to fit ~65% of canvas width (portrait) or ~70% height (landscape)
  const isPortrait = template.orientation === "portrait";
  const targetPhoneWidth = isPortrait
    ? Math.round(canvasWidth * 0.62)
    : Math.round(canvasWidth * 0.85);
  const scale = targetPhoneWidth / template.frameWidth;
  const scaledFrameWidth = Math.round(template.frameWidth * scale);
  const scaledFrameHeight = Math.round(template.frameHeight * scale);

  // Scale screen rect
  const scaledScreen = {
    x: Math.round(template.screen.x * scale),
    y: Math.round(template.screen.y * scale),
    width: Math.round(template.screen.width * scale),
    height: Math.round(template.screen.height * scale),
    radius: Math.round(template.screen.radius * scale),
  };

  // 1. Resize screenshot to fit screen area
  const resizedScreenshot = await sharp(screenshotBuffer)
    .resize(scaledScreen.width, scaledScreen.height, {
      fit: "cover",
      position: "centre",
    })
    .png()
    .toBuffer();

  // 2. Round screenshot corners
  const roundedScreenshot = await roundCorners(
    resizedScreenshot,
    scaledScreen.width,
    scaledScreen.height,
    scaledScreen.radius
  );

  // 3. Generate phone frame SVG at original size, then resize
  const frameSvg = buildPhoneFrameSvg(template);
  const frameBuffer = await sharp(Buffer.from(frameSvg))
    .resize(scaledFrameWidth, scaledFrameHeight)
    .png()
    .toBuffer();

  // 4. Calculate phone position on canvas (centered)
  const phoneX = Math.round((canvasWidth - scaledFrameWidth) / 2);
  const phoneY = Math.round((canvasHeight - scaledFrameHeight) / 2);

  // 5. Create canvas and composite everything
  const composited = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: hexToRgba(backgroundColor),
    },
  })
    .composite([
      // Screenshot positioned at screen area within the phone position
      {
        input: roundedScreenshot,
        left: phoneX + scaledScreen.x,
        top: phoneY + scaledScreen.y,
      },
      // Phone frame overlay (screen area is transparent, frame body is opaque)
      {
        input: frameBuffer,
        left: phoneX,
        top: phoneY,
      },
    ])
    .png({ quality: 90 })
    .toBuffer();

  return {
    buffer: composited,
    width: canvasWidth,
    height: canvasHeight,
  };
}

/**
 * Get canvas dimensions for a given aspect ratio.
 */
export function getCanvasDimensions(aspectRatio: string): {
  width: number;
  height: number;
} {
  switch (aspectRatio) {
    case "9:16":
      return { width: 1080, height: 1920 };
    case "16:9":
      return { width: 1920, height: 1080 };
    case "1:1":
      return { width: 1080, height: 1080 };
    default:
      return { width: 1080, height: 1920 };
  }
}

function hexToRgba(hex: string): { r: number; g: number; b: number; alpha: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
    alpha: 1,
  };
}
