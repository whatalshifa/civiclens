import { NextResponse, type NextRequest } from "next/server";

import { cleanPin } from "@/lib/format";

/** Where the PIN form submits when JavaScript is off: /find?pin=413102 -> /pin/413102. */
export function GET(request: NextRequest) {
  const pin = cleanPin(request.nextUrl.searchParams.get("pin") ?? "");
  return NextResponse.redirect(new URL(pin ? `/pin/${pin}` : "/?pin=invalid", request.url), 303);
}
