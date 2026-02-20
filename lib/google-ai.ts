import { GoogleGenAI } from "@google/genai";

// Server-only - never import from client components
const apiKey = process.env.GOOGLE_API_KEY;

// API key is optional in dev, required at runtime in production
// Don't throw at module level - it breaks build. Routes check for `ai` being null.

export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const MODELS = {
  GEMINI_PRO: "gemini-2.5-pro",
  GEMINI_FLASH: "gemini-2.5-flash",
  VEO: "veo-3.1-generate-preview",
  VEO_FAST: "veo-3.1-fast-generate-preview",
  IMAGEN: "imagen-4.0-generate-001",
  IMAGEN_FAST: "imagen-4.0-fast-generate-001",
} as const;

// Cost estimates per operation (USD)
export const COST_ESTIMATES = {
  gemini_pro_per_1m_input: 1.25,
  gemini_pro_per_1m_output: 10.0,
  gemini_flash_per_1m_input: 0.075,
  gemini_flash_per_1m_output: 0.6,
  veo_standard_per_second: 0.4,
  veo_fast_per_second: 0.15,
  imagen_standard_per_image: 0.04,
  imagen_fast_per_image: 0.02,
} as const;
