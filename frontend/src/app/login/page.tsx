"use client";
// src/app/login/page.tsx
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/components/AuthProvider";

interface FormData {
  email: string;
  password: string;
}

function LoginForm() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";
  const sessionExpired = searchParams.get("session") === "expired";

  // Middleware no longer bounces signed-in users off this page, because it
  // can only see cookies and not whether the session actually works. We do it
  // here instead, where AuthProvider has confirmed the session against Django.
  useEffect(() => {
    if (!isLoading && user) router.replace(from);
  }, [isLoading, user, from, router]);

  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      await login(data.email, data.password);
      router.push(from);
    } catch (err: any) {
      setServerError(err.message ?? "Invalid email or password.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
            <span>🏡</span> EstateHub
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-6 mb-1">Welcome back</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Sign in to your account</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card p-8">
          {sessionExpired && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700 mb-5">
              Your session has expired. Please sign in again.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="form-label">Email address</label>
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
                })}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="form-input"
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="form-label mb-0">Password</label>
                <Link href="/forgot-password" className="text-xs text-brand-600 hover:text-brand-700">
                  Forgot password?
                </Link>
              </div>
              <input
                {...register("password", { required: "Password is required", minLength: { value: 6, message: "Password too short" } })}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="form-input"
              />
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-brand-600 font-medium hover:text-brand-700">
            Create one →
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
