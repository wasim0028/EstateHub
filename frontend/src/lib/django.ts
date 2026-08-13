// src/lib/django.ts
/**
 * Single source of truth for the Django API base URL used by Route Handlers.
 *
 * Historically `.env.local.example` set DJANGO_API_URL without the `/api`
 * suffix while the route handlers appended paths as if it were included,
 * producing requests to http://localhost:8000/auth/... — a Django 404 that
 * returns an HTML page, which then blew up as
 * "Unexpected token '<'" / "unreadable response" on the client.
 *
 * This normalizes both forms, so DJANGO_API_URL may be set to either
 * "http://localhost:8000" or "http://localhost:8000/api" and still work.
 */

function normalizeDjangoApiBase(raw: string): string {
  // Drop any trailing slashes so we don't produce "//auth/login/"
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export const DJANGO_API = normalizeDjangoApiBase(
  process.env.DJANGO_API_URL ?? "http://localhost:8000"
);
