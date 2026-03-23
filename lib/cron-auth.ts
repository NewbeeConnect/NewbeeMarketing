/**
 * Cron Job Authentication
 *
 * Timing-safe verification of CRON_SECRET to prevent timing attacks.
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
