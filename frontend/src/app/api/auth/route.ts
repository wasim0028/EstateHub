// src/app/api/auth/route.ts
/**
 * Next.js Route Handler — JWT Auth Bridge
 *
 * Acts as a secure proxy between the browser and Django's auth API.
 * The browser NEVER holds the JWT tokens directly — they are stored as
 * httpOnly, Secure, SameSite=Strict cookies managed entirely server-side.
 *
 * Routes handled:
 *   POST /api/auth         → Login: exchange credentials for JWT, set cookies
 *   DELETE /api/auth       → Logout: clear cookies, blacklist refresh token
 *   GET  /api/auth/refresh → Refresh: rotate access token using refresh cookie
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { DJANGO_API } from "@/lib/django";


const COOKIE_ACCESS = "re_access_token";
const COOKIE_REFRESH = "re_refresh_token";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Cookie settings — httpOnly prevents JS access (XSS protection)
const cookieBase = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "strict" as const,
  path: "/",
};

// ─────────────────────────────────────────────
// POST /api/auth  — Login
// ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const djangoRes = await fetch(`${DJANGO_API}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await djangoRes.json().catch(() => ({
      detail: "Authentication service returned an unreadable response.",
    }));

    if (!djangoRes.ok) {
      return NextResponse.json(data, { status: djangoRes.status });
    }

    // Django's endpoints are inconsistent about token placement:
    //   /auth/login/    -> { access, refresh, user }        (flat, from SimpleJWT)
    //   /auth/register/ -> { user, tokens: { access, ... } } (nested)
    // Accept both so login doesn't blow up on `tokens.access` being undefined.
    const payload = data as {
      access?: string;
      refresh?: string;
      tokens?: { access: string; refresh: string };
      user: object;
    };

    const access = payload.tokens?.access ?? payload.access;
    const refresh = payload.tokens?.refresh ?? payload.refresh;
    const user = payload.user;

    if (!access || !refresh) {
      console.error("[Auth POST] No tokens in Django response:", Object.keys(payload));
      return NextResponse.json(
        { detail: "Login succeeded but no tokens were returned." },
        { status: 502 }
      );
    }

    const response = NextResponse.json(
      { user },       // Only return user data to the client, NOT tokens
      { status: 200 }
    );

    // Set JWT as httpOnly cookies — inaccessible to JavaScript
    response.cookies.set(COOKIE_ACCESS, access, {
      ...cookieBase,
      maxAge: 60 * 60,               // 1 hour — matches Django ACCESS_TOKEN_LIFETIME
    });

    response.cookies.set(COOKIE_REFRESH, refresh, {
      ...cookieBase,
      maxAge: 60 * 60 * 24 * 7,     // 7 days — matches REFRESH_TOKEN_LIFETIME
    });

    return response;
  } catch (err) {
    console.error("[Auth POST] Error:", err);
    return NextResponse.json(
      { detail: "Authentication service unavailable." },
      { status: 503 }
    );
  }
}

// ─────────────────────────────────────────────
// DELETE /api/auth  — Logout
// ─────────────────────────────────────────────

export async function DELETE() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(COOKIE_REFRESH)?.value;
  const accessToken = cookieStore.get(COOKIE_ACCESS)?.value;

  // Ask Django to blacklist the refresh token (best-effort)
  if (refreshToken) {
    try {
      await fetch(`${DJANGO_API}/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    } catch {
      // Non-fatal: cookies will be cleared regardless
      console.warn("[Auth DELETE] Failed to blacklist token on Django side.");
    }
  }

  const response = NextResponse.json(
    { detail: "Logged out successfully." },
    { status: 200 }
  );

  // Clear both cookies
  response.cookies.set(COOKIE_ACCESS, "", { ...cookieBase, maxAge: 0 });
  response.cookies.set(COOKIE_REFRESH, "", { ...cookieBase, maxAge: 0 });

  return response;
}

// ─────────────────────────────────────────────
// GET /api/auth/refresh  — Rotate Access Token
// ─────────────────────────────────────────────
// Note: This is handled in a separate route file:
// src/app/api/auth/refresh/route.ts
