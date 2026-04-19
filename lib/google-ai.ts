import { GoogleGenAI } from "@google/genai";

// Server-only — never import from client components
const apiKey = process.env.GOOGLE_API_KEY;

// API key is optional in dev, required at runtime in production.
// Don't throw at module level — it breaks build. Routes check for `ai` being null.
export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Environment toggle: "preview" (default, cheaper/testing) or "production" (higher quotas)
const isProduction = process.env.VEO_ENVIRONMENT === "production";
export const VEO_ENVIRONMENT: "preview" | "production" =
  isProduction ? "production" : "preview";

/**
 * Model IDs we use across the app. Fixed to the most capable options per
 * medium — no user-facing tier toggle.
 *
 * - GEMINI_PRO: latest reasoning + multimodal (sees reference images). Used
 *   for any prompt processing that benefits from quality over speed.
 * - IMAGE: Nano Banana 2 (announced Nov 2025, labeled in AI Studio as
 *   "Nano Banana 2"). Best-in-class text rendering, character consistency,
 *   and composition.
 * - VEO: Veo 3.1 Standard — highest-quality video. Veo 3.1 fast exists but
 *   the spec is always-best-model.
 */
export const MODELS = {
  GEMINI_PRO: "gemini-3-pro-preview",
  IMAGE: "gemini-3-pro-image-preview",
  VEO: isProduction ? "veo-3.1-generate-001" : "veo-3.1-generate-preview",
} as const;

/**
 * Cost per unit for each API service (USD). Used by budget-guard and
 * mkt_usage_logs estimate_cost_usd. Revisit when Google adjusts pricing.
 */
export const COST_ESTIMATES = {
  // Gemini 3 Pro (text + vision input, text output). Approximate — confirm
  // current pricing in the Google AI pricing page.
  gemini_pro_per_1m_input: 1.25,
  gemini_pro_per_1m_output: 10.0,
  // Nano Banana 2 — per-image flat (image output). Verify with billing docs.
  nano_banana_per_image: 0.04,
  // Veo 3.1 Standard — per-second of generated video.
  veo_per_second: 0.4,
} as const;
