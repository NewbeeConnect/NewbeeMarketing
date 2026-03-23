/**
 * A/B Testing Engine
 *
 * Thompson Sampling for multi-armed bandit budget allocation.
 * Statistical significance testing via two-proportion z-test.
 */

import type { VariantStats, SignificanceResult, ThompsonAllocation } from "./types";

/**
 * Thompson Sampling: compute allocation percentages for each variant.
 * Uses Beta distribution sampling — each variant gets Beta(successes+1, failures+1).
 */
export function thompsonSampling(variants: VariantStats[], numSamples = 10000): ThompsonAllocation {
  if (variants.length === 0) return { allocations: {} };

  const winCounts: Record<string, number> = {};
  for (const v of variants) winCounts[v.variantLabel] = 0;

  for (let i = 0; i < numSamples; i++) {
    let bestSample = -1;
    let bestLabel = "";

    for (const v of variants) {
      // Sample from Beta(successes + 1, failures + 1)
      const sample = betaSample(v.successes + 1, v.failures + 1);
      if (sample > bestSample) {
        bestSample = sample;
        bestLabel = v.variantLabel;
      }
    }

    if (bestLabel) winCounts[bestLabel]++;
  }

  // Convert win counts to allocation percentages
  const allocations: Record<string, number> = {};
  for (const [label, count] of Object.entries(winCounts)) {
    allocations[label] = count / numSamples;
  }

  return { allocations };
}

/**
 * Two-proportion z-test for statistical significance.
 * Tests if two variants have significantly different success rates.
 */
export function checkStatisticalSignificance(
  variantA: VariantStats,
  variantB: VariantStats,
  confidenceLevel = 0.95
): SignificanceResult {
  const n1 = variantA.impressions;
  const n2 = variantB.impressions;

  if (n1 < 30 || n2 < 30) {
    return { significant: false, winner: null, pValue: 1, confidenceLevel };
  }

  const p1 = variantA.rate;
  const p2 = variantB.rate;

  // Pooled proportion
  const pPool = (variantA.successes + variantB.successes) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));

  if (se === 0) {
    return { significant: false, winner: null, pValue: 1, confidenceLevel };
  }

  const zScore = (p1 - p2) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  const alpha = 1 - confidenceLevel;
  const significant = pValue < alpha;

  let winner: string | null = null;
  if (significant) {
    winner = p1 > p2 ? variantA.variantLabel : variantB.variantLabel;
  }

  return { significant, winner, pValue, confidenceLevel };
}

/**
 * Check significance across all variant pairs and find the overall winner.
 */
export function findWinner(
  variants: VariantStats[],
  confidenceLevel = 0.95
): { winner: string | null; pValue: number; significant: boolean } {
  if (variants.length < 2) {
    return { winner: null, pValue: 1, significant: false };
  }

  // Sort by rate descending
  const sorted = [...variants].sort((a, b) => b.rate - a.rate);
  const best = sorted[0];
  const secondBest = sorted[1];

  const result = checkStatisticalSignificance(best, secondBest, confidenceLevel);
  return {
    winner: result.winner,
    pValue: result.pValue,
    significant: result.significant,
  };
}

// ─── Math helpers ───────────────────────────────────────────────────────────

/** Sample from Beta distribution using Jöhnk's algorithm */
function betaSample(alpha: number, beta: number): number {
  const gammaA = gammaSample(alpha);
  const gammaB = gammaSample(beta);
  return gammaA / (gammaA + gammaB);
}

/** Sample from Gamma distribution (Marsaglia and Tsang's method) */
function gammaSample(shape: number): number {
  if (shape < 1) {
    return gammaSample(shape + 1) * Math.pow(Math.random(), 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x: number;
    let v: number;
    do {
      x = normalSample();
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

/** Box-Muller transform for standard normal sample */
function normalSample(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Approximation of standard normal CDF */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}
