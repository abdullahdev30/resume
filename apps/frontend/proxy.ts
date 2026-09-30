import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/auth");
  const isProtectedAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/resumes") ||
    pathname.startsWith("/templates") ||
    pathname.startsWith("/editor");

  if (isProtectedAppRoute && !accessToken) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (isAuthRoute && accessToken && pathname !== "/auth/change-password") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/resumes/:path*",
    "/templates/:path*",
    "/editor/:path*",
    "/auth/:path*",
  ],
};
