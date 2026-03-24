/**
 * GET /download
 *
 * Smart download link — redirects to the correct store based on device:
 *   - iOS/iPad  → App Store
 *   - Android   → Google Play Store
 *   - Desktop   → app.newbeeapp.com
 */

import { NextResponse } from "next/server";

const APP_STORE_URL = "https://apps.apple.com/app/newbee/id6474511885";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.beeyondapps.newbee";
const WEB_APP_URL = "https://app.newbeeapp.com";

export function GET(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  const lower = ua.toLowerCase();

  if (/iphone|ipad|ipod/.test(lower)) {
    return NextResponse.redirect(APP_STORE_URL, 302);
  }

  if (/android/.test(lower)) {
    return NextResponse.redirect(PLAY_STORE_URL, 302);
  }

  return NextResponse.redirect(WEB_APP_URL, 302);
}
