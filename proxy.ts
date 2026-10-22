import { type NextRequest, NextResponse } from "next/server";

// download.newbeeapp.com (and legacy marketing.newbeeapp.com) is printed on
// Instagram story footers and store material, so its bare root (/) must keep
// rewriting to the device-aware /download redirect.
// On newbeeapp.com, www.newbeeapp.com, and preview hosts, / serves the website.
export function proxy(request: NextRequest) {
  const host = (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.hostname
  )
    .toLowerCase()
    .split(":")[0];

  if (host.startsWith("download.") || host.startsWith("marketing.")) {
    return NextResponse.rewrite(new URL("/download", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
