"use client";
// src/components/AuthProvider.tsx
/**
 * Auth Context — CLIENT COMPONENT
 *
 * Provides user state, login, logout, and register actions to the client-side
 * component tree. Wraps the Next.js /api/auth route handler.
 *
 * The actual JWT tokens never touch this context — they stay in httpOnly cookies.
 * We only store the user profile object in memory/state here.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { api, setAccessToken } from "@/lib/api-client";
import type { User, AuthTokens } from "@/types";

// ─────────────────────────────────────────────
// CONTEXT TYPE
// ─────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  role?: "buyer" | "agent";
  phone?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On mount: attempt to restore session from httpOnly cookie
  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      // Django authenticates via the `Authorization: Bearer` header only — it
      // does NOT read our httpOnly cookies. So before asking who we are, we
      // must exchange the refresh cookie for an access token and put it in the
      // in-memory store that the Axios client attaches to every request.
      //
      // Without this, /auth/me/ is called with no token on every page load,
      // always 401s, and the user appears signed out even with valid cookies.
      const res = await fetch("/api/auth/refresh", { method: "POST" });

      if (!res.ok) {
        // No valid refresh cookie — genuinely signed out.
        setAccessToken(null);
        setUser(null);
        return;
      }

      const { access } = (await res.json()) as { access: string };
      setAccessToken(access);

      // X-Skip-Auth-Redirect marks this as a silent "am I logged in?" probe so
      // a 401 resolves to "no user" instead of forcing a redirect to /login.
      const { data } = await api.get<User>("/auth/me/", {
        headers: { "X-Skip-Auth-Redirect": "1" },
      });
      setUser(data);
    } catch {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      // POST to our Next.js route handler (not Django directly)
      // The route handler sets the httpOnly cookies and returns user data
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail ?? "Login failed. Please check your credentials.");
      }

      setUser(data.user);

      // The login route set httpOnly cookies, but the Axios client needs the
      // access token in memory for its Authorization header. Exchange the
      // fresh refresh cookie for one now, otherwise the very next client-side
      // API call (wishlist, booking, inquiry) goes out unauthenticated.
      try {
        const tokenRes = await fetch("/api/auth/refresh", { method: "POST" });
        if (tokenRes.ok) {
          const { access } = (await tokenRes.json()) as { access: string };
          setAccessToken(access);
        }
      } catch {
        // Non-fatal: the interceptor will retry a refresh on the first 401.
      }

      router.refresh(); // Invalidate Server Component cache
    },
    [router]
  );

  const register = useCallback(
    async (formData: RegisterData) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        const firstError = Object.values(data)[0];
        const message = Array.isArray(firstError)
          ? firstError[0]
          : String(firstError ?? "Registration failed.");
        throw new Error(message);
      }

      setUser(data.user);

      // Same as login: put the access token in memory for the Axios client.
      try {
        const tokenRes = await fetch("/api/auth/refresh", { method: "POST" });
        if (tokenRes.ok) {
          const { access } = (await tokenRes.json()) as { access: string };
          setAccessToken(access);
        }
      } catch {
        // Non-fatal.
      }

      router.refresh();
    },
    [router]
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setAccessToken(null);
    setUser(null);
    router.push("/");
    router.refresh();
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
