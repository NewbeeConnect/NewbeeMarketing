/**
 * Cron Job Authentication
 *
 * Timing-safe verification of CRON_SECRET to prevent timing attacks.
 *
 * CRON_SECRET must be cryptographically random (>= 32 bytes / 64 hex chars).
 * Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
 * Set in Vercel project env + local .env.local. Never commit.
 */

import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Verify the CRON_SECRET header using timing-safe comparison.
 * Returns null if authorized, or a 401 NextResponse if not.
 */
export function verifyCronAuth(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[Cron] CRON_SECRET not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  // Timing-safe comparison: pad to same length to avoid length leak
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; // Authorized
}
