// src/lib/api-client.ts
/**
 * CLIENT-SAFE API layer — no `next/headers`, no server-only imports.
 * Import this from any "use client" component. Server Components should
 * import from "@/lib/api" instead (serverFetch + the fetch* helpers).
 */

import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { PaginatedResponse, PropertyCard } from "@/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// In-memory token store — avoids XSS exposure vs localStorage
let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken() {
  return _accessToken;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send httpOnly cookies on cross-origin requests
  headers: { "Content-Type": "application/json" },
});

// Attach the in-memory access token to every outgoing request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// Auto-refresh on 401 — tries once, then signs the user out
let _isRefreshing = false;
let _refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const skipRedirect =
      originalRequest?.headers?.["X-Skip-Auth-Redirect"] === "1";

    if (error.response?.status === 401 && skipRedirect) {
      // Silent auth probe (e.g. "am I logged in?") — never seen by an
      // anonymous visitor as a forced redirect, just resolve to "no user".
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (_isRefreshing) {
        // Queue concurrent requests until the refresh resolves
        return new Promise((resolve) => {
          _refreshQueue.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      _isRefreshing = true;

      try {
        // The Next.js route handler refreshes the cookie server-side
        const { data } = await axios.post<{ access: string }>(
          "/api/auth/refresh"
        );
        setAccessToken(data.access);
        _refreshQueue.forEach((cb) => cb(data.access));
        _refreshQueue = [];
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch {
        // Refresh failed — clear tokens and redirect to login
        setAccessToken(null);
        _refreshQueue = [];
        if (typeof window !== "undefined") {
          window.location.href = "/login?session=expired";
        }
        return Promise.reject(error);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────
// WISHLIST / SAVED PROPERTIES API (Client Components)
// ─────────────────────────────────────────────

/** Toggles the wishlist state for a property. Returns the new saved state. */
export async function toggleSaveProperty(slug: string): Promise<boolean> {
  const { data } = await api.post<{ saved: boolean }>(
    `/properties/${slug}/toggle_save/`
  );
  return data.saved;
}

/** Fetches the current user's saved/wishlisted properties (client-side). */
export async function fetchSavedProperties(): Promise<PropertyCard[]> {
  const { data } = await api.get<PaginatedResponse<PropertyCard>>(
    "/properties/saved/"
  );
  return data.results;
}

// ─────────────────────────────────────────────
// SITE VISIT BOOKING (RAZORPAY UPI TOKEN PAYMENT)
// ─────────────────────────────────────────────
// Every function here requires the user to be logged in — the backend
// enforces this too (IsAuthenticated), so payment is only ever reachable
// at login time, never for anonymous visitors.

export interface CreateBookingOrderResponse {
  booking_id: number;
  order_id: string;
  amount: number; // in paise
  currency: string;
  key_id: string;
  property_title: string;
  prefill: { name: string; email: string; contact: string };
}

export async function createBookingOrder(
  propertyId: number,
  opts: { preferred_date?: string; notes?: string } = {}
): Promise<CreateBookingOrderResponse> {
  const { data } = await api.post<CreateBookingOrderResponse>(
    "/bookings/create_order/",
    { property_id: propertyId, ...opts }
  );
  return data;
}

export interface VerifyBookingPaymentPayload {
  booking_id: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function verifyBookingPayment(
  payload: VerifyBookingPaymentPayload
): Promise<{ verified: boolean; detail?: string }> {
  const { data } = await api.post("/bookings/verify_payment/", payload);
  return data;
}

// ─────────────────────────────────────────────
// CONTACT FORM (PUBLIC)
// ─────────────────────────────────────────────

export interface ContactMessagePayload {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export async function submitContactMessage(
  payload: ContactMessagePayload
): Promise<void> {
  await api.post("/contact-messages/", payload);
}
