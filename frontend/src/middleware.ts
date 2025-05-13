import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get("user");
  const isAuthPage = request.nextUrl.pathname === "/login";

  // Add debug logs (these will show in server logs)
  console.log(`Middleware running for path: ${request.nextUrl.pathname}`);
  console.log(`User cookie exists: ${!!userCookie}`);
  console.log(`Is auth page: ${isAuthPage}`);

  if (!userCookie && !isAuthPage) {
    console.log("Redirecting to login because no user cookie found");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (userCookie && isAuthPage) {
    console.log("Redirecting to dashboard because user is already logged in");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
