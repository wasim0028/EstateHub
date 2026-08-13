// src/middleware.ts
/**
 * Next.js Middleware — Route Protection
 *
 * Runs at the edge before any page renders.
 * Protects /agent/* routes and keeps signed-in users off the auth pages.
 *
 * IMPORTANT: this checks the JWT's `exp` claim, not just whether the cookie
 * exists. Presence alone is not enough — an expired or leftover access token
 * cookie would otherwise make middleware believe the user is signed in while
 * AuthProvider (which actually calls /auth/me/) correctly shows them as signed
 * out. That mismatch silently bounced users off /login and /register, making
 * the "Sign in" and "Get started" buttons look broken.
 *
 * The signature is NOT verified here — that's Django's job on every API call.
 * This is only a lightweight guard to avoid pointless page renders.
 */

import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/agent"];
const AUTH_PAGES = ["/login", "/register"];

const COOKIE_ACCESS = "re_access_token";
const COOKIE_REFRESH = "re_refresh_token";

/**
 * Decodes a JWT payload and reports whether it is still valid in time.
 * Returns false for malformed tokens, so anything unreadable is treated
 * as "not signed in" rather than silently trusted.
 */
function isTokenLive(token: string | undefined): boolean {
  if (!token) return false;

  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return false;

    // base64url -> base64, then decode (atob exists in the edge runtime)
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    const payload = JSON.parse(atob(padded)) as { exp?: number };
    if (typeof payload.exp !== "number") return false;

    // 10s of leeway for clock skew between the browser and the server
    return payload.exp * 1000 > Date.now() + 10_000;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get(COOKIE_ACCESS)?.value;
  const refreshToken = request.cookies.get(COOKIE_REFRESH)?.value;

  const hasLiveAccess = isTokenLive(accessToken);
  // A live refresh token still counts as signed in: the client can silently
  // mint a new access token via /api/auth/refresh.
  const hasLiveRefresh = isTokenLive(refreshToken);
  const isSignedIn = hasLiveAccess || hasLiveRefresh;

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));

  // Send unauthenticated users to login, remembering where they were headed
  if (isProtectedRoute && !isSignedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);

    const response = NextResponse.redirect(loginUrl);
    // Clear dead cookies so this doesn't repeat on every navigation
    if (accessToken && !hasLiveAccess) response.cookies.delete(COOKIE_ACCESS);
    if (refreshToken && !hasLiveRefresh) response.cookies.delete(COOKIE_REFRESH);
    return response;
  }

  // NOTE: we deliberately do NOT redirect "signed in" users away from
  // /login and /register here.
  //
  // Middleware can only inspect cookies; it cannot know whether the session
  // actually works (the backend may be down, the token may be revoked, or
  // Django may reject it). When middleware's guess disagreed with reality,
  // the navbar showed "Sign in" while middleware bounced every click back to
  // "/" — making the buttons look completely dead with no error anywhere.
  //
  // The login page itself knows the true auth state via AuthProvider, so it
  // handles that redirect client-side instead. Middleware now only guards
  // protected routes, where a wrong guess is harmless (Django still enforces
  // real authorization on every API call).

  // Visiting an auth page with dead cookies: bin them so the browser stops
  // looking half-signed-in.
  if (isAuthPage && (accessToken || refreshToken) && !isSignedIn) {
    const response = NextResponse.next();
    response.cookies.delete(COOKIE_ACCESS);
    response.cookies.delete(COOKIE_REFRESH);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals.
    // icon.svg is excluded so the app icon isn't run through auth logic.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|images|icons).*)",
  ],
};
