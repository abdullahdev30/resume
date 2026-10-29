import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const { pathname } = request.nextUrl;

  const isProtectedAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/persona") ||
    pathname.startsWith("/resumes");

  if (isProtectedAppRoute && !accessToken) {
    const authUrl = new URL(
      refreshToken ? "/auth/session" : "/auth/login",
      request.url,
    );
    authUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(authUrl);
  }

  if (
    pathname.startsWith("/editor") &&
    request.nextUrl.searchParams.has("resumeId") &&
    !accessToken
  ) {
    const loginUrl = new URL(
      refreshToken ? "/auth/session" : "/auth/login",
      request.url,
    );
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/persona/:path*",
    "/resumes/:path*",
    "/templates/:path*",
    "/editor/:path*",
    "/auth/:path*",
  ],
};
