import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PAGES = ["/", "/login", "/register", "/about"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/healthz") ||
    pathname.startsWith("/ws") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("asagity_access_token")?.value;
  const isLoggedIn = !!accessToken;

  // Dev mode bypass - check localStorage via cookie
  const devMode = request.cookies.get("asgt_dev_mode_forever")?.value;
  if (devMode === "true") {
    return NextResponse.next();
  }

  // Not logged in and trying to access a protected page
  if (!isLoggedIn && !PUBLIC_PAGES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Logged in and trying to access login/register/welcome pages (but not home)
  if (isLoggedIn && PUBLIC_PAGES.includes(pathname) && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sounds|fonts|images|icons).*)",
  ],
};
