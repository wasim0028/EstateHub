// src/app/api/auth/register/route.ts
/**
 * POST /api/auth/register — Account creation
 *
 * AuthProvider.register() posts here. Without this handler the request fell
 * through to the Next.js 404 page, which returns HTML — hence the client-side
 * "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" error.
 *
 * Mirrors the login handler in ../route.ts: proxies to Django, then stores the
 * returned JWTs as httpOnly cookies so the tokens never reach browser JS.
 */

import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const djangoRes = await fetch(`${DJANGO_API}/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Django returns field-level validation errors as JSON, e.g.
    // { "email": ["user with this email already exists."] }
    const data = await djangoRes.json().catch(() => ({
      detail: "Registration service returned an unreadable response.",
    }));

    if (!djangoRes.ok) {
      return NextResponse.json(data, { status: djangoRes.status });
    }

    const { tokens, user } = data as {
      tokens?: { access: string; refresh: string };
      user: object;
    };

    const response = NextResponse.json({ user }, { status: 201 });

    // Django issues tokens on register, so the new user is logged straight in.
    if (tokens?.access && tokens?.refresh) {
      response.cookies.set(COOKIE_ACCESS, tokens.access, {
        ...cookieBase,
        maxAge: 60 * 60, // 1 hour — matches ACCESS_TOKEN_LIFETIME
      });

      response.cookies.set(COOKIE_REFRESH, tokens.refresh, {
        ...cookieBase,
        maxAge: 60 * 60 * 24 * 7, // 7 days — matches REFRESH_TOKEN_LIFETIME
      });
    }

    return response;
  } catch (err) {
    console.error("[Auth Register] Error:", err);
    return NextResponse.json(
      { detail: "Registration service unavailable." },
      { status: 503 }
    );
  }
}
