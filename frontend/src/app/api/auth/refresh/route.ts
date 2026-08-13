// src/app/api/auth/refresh/route.ts
/**
 * GET|POST /api/auth/refresh
 * Called by the Axios client-side interceptor on 401 responses.
 * The interceptor issues a POST, so both verbs are exported and share
 * the same handler — exporting GET alone returns 405 and breaks refresh.
 * Reads the httpOnly refresh cookie, exchanges it with Django,
 * sets a new access token cookie, and returns the new access token
 * to the in-memory store on the client side.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DJANGO_API } from "@/lib/django";

const COOKIE_ACCESS = "re_access_token";
const COOKIE_REFRESH = "re_refresh_token";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const cookieBase = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "strict" as const,
  path: "/",
};

export async function GET() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(COOKIE_REFRESH)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { detail: "No refresh token found." },
      { status: 401 }
    );
  }

  try {
    const djangoRes = await fetch(`${DJANGO_API}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const data = await djangoRes.json();

    if (!djangoRes.ok) {
      // Refresh token has expired or been blacklisted — clear cookies
      const errResponse = NextResponse.json(data, { status: 401 });
      errResponse.cookies.set(COOKIE_ACCESS, "", { ...cookieBase, maxAge: 0 });
      errResponse.cookies.set(COOKIE_REFRESH, "", { ...cookieBase, maxAge: 0 });
      return errResponse;
    }

    const response = NextResponse.json(
      { access: data.access },   // Return new access token to client memory
      { status: 200 }
    );

    response.cookies.set(COOKIE_ACCESS, data.access, {
      ...cookieBase,
      maxAge: 60 * 60,
    });

    // Update refresh cookie if Django rotated it
    if (data.refresh) {
      response.cookies.set(COOKIE_REFRESH, data.refresh, {
        ...cookieBase,
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (err) {
    console.error("[Auth Refresh] Error:", err);
    return NextResponse.json(
      { detail: "Token refresh service unavailable." },
      { status: 503 }
    );
  }
}

// The client-side Axios interceptor calls this endpoint with POST.
// Alias it to the same handler so both verbs work.
export const POST = GET;
