import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get("user");
  const isAuthPage = request.nextUrl.pathname === "/login";

  if (!userCookie && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (userCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
