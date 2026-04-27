import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/favicon.ico") {
    return NextResponse.redirect(new URL("/igon.png", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/favicon.ico"],
};
