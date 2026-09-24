import { type NextRequest, NextResponse } from "next/server";

// Every host's root goes to the device-aware redirect. download.newbeeapp.com is
// printed on story footers and store material, so its root must keep working.
export function proxy(request: NextRequest) {
  return NextResponse.rewrite(new URL("/download", request.url));
}

export const config = {
  matcher: "/",
};
