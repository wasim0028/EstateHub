// src/lib/api.ts
/**
 * SERVER-ONLY data-fetching layer for the Django REST backend.
 *
 * This file imports `next/headers`, so it must only ever be imported from
 * Server Components, Route Handlers, or other server-only code. Client
 * Components ("use client") must import the Axios instance and any
 * client-side helpers (wishlist, bookings, contact form) from
 * "@/lib/api-client" instead — importing this file from a Client Component
 * will break the Next.js build.
 */

import { cookies } from "next/headers";
import { PropertyFilters, PaginatedResponse, PropertyCard, Property, Locality } from "@/types";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

const COOKIE_ACCESS = "re_access_token";
const COOKIE_REFRESH = "re_refresh_token";

// ─────────────────────────────────────────────
// SERVER-SIDE FETCH HELPER (for Server Components / Route Handlers)
// ─────────────────────────────────────────────

/**
 * Fetch wrapper for Next.js Server Components.
 * Automatically attaches the access token stored in httpOnly cookies.
 * Leverage Next.js extended fetch options for ISR / on-demand revalidation.
 */
export async function serverFetch<T>(
  path: string,
  options: RequestInit & { next?: NextFetchRequestConfig } = {}
): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_ACCESS)?.value;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// TYPED API FUNCTIONS (Server Components)
// ─────────────────────────────────────────────

function buildQueryString(filters: PropertyFilters): string {
  const params = new URLSearchParams();
  const filterMap: Record<string, keyof PropertyFilters> = {
    search: "search",
    city: "city",
    state: "state",
    locality: "locality",
    property_type: "property_type",
    category: "category",
    status: "status",
    bhk: "bhk",
    beds_min: "beds_min",
    price_min: "price_min",
    price_max: "price_max",
    possession_status: "possession_status",
    furnishing: "furnishing",
    transaction_type: "transaction_type",
    ordering: "ordering",
    page: "page",
  };

  for (const [param, key] of Object.entries(filterMap)) {
    const val = filters[key];
    if (val !== undefined && val !== "" && val !== null) {
      params.set(param, String(val));
    }
  }

  return params.toString();
}

export async function fetchProperties(
  filters: PropertyFilters = {},
  cacheOptions: NextFetchRequestConfig = { revalidate: 60 }
): Promise<PaginatedResponse<PropertyCard>> {
  const qs = buildQueryString(filters);
  return serverFetch<PaginatedResponse<PropertyCard>>(
    `/properties/${qs ? `?${qs}` : ""}`,
    { next: cacheOptions }
  );
}

export async function fetchPropertyBySlug(
  slug: string,
  cacheOptions: NextFetchRequestConfig = { revalidate: 300 }
): Promise<Property> {
  return serverFetch<Property>(`/properties/${slug}/`, { next: cacheOptions });
}

export async function fetchFeaturedProperties(): Promise<PropertyCard[]> {
  const data = await serverFetch<PaginatedResponse<PropertyCard>>(
    "/properties/?is_featured=true&status=active&ordering=-created_at",
    { next: { revalidate: 120 } }
  );
  if (data.results.length > 0) return data.results.slice(0, 6);
  // Fall back to latest active listings if nothing is flagged as featured yet
  const fallback = await serverFetch<PaginatedResponse<PropertyCard>>(
    "/properties/?status=active&ordering=-created_at",
    { next: { revalidate: 120 } }
  );
  return fallback.results.slice(0, 6);
}

// ─────────────────────────────────────────────
// LOCALITY API (Server Components)
// ─────────────────────────────────────────────

export async function fetchLocalities(
  city?: string,
  cacheOptions: NextFetchRequestConfig = { revalidate: 3600 }
): Promise<Locality[]> {
  const qs = city ? `?city=${encodeURIComponent(city)}` : "";
  const data = await serverFetch<PaginatedResponse<Locality> | Locality[]>(
    `/localities/${qs}`,
    { next: cacheOptions }
  );
  return Array.isArray(data) ? data : data.results;
}
