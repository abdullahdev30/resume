import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  const isProtectedAppRoute =
    pathname.startsWith("/settings") ||
    pathname.startsWith("/resumes/create/ai");

  if (isProtectedAppRoute && !accessToken) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (pathname.startsWith("/editor") && !accessToken && !request.nextUrl.searchParams.has("guest")) {
    const guestUrl = request.nextUrl.clone();
    guestUrl.searchParams.set("guest", "1");
    return NextResponse.redirect(guestUrl);
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
