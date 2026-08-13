"use client";
// src/app/forgot-password/page.tsx
/**
 * Request a password reset link.
 *
 * The login page has always linked here, but the page didn't exist — the link
 * 404'd. The API deliberately returns the same response whether or not the
 * address is registered, so this page shows a generic confirmation rather than
 * revealing which emails have accounts.
 */

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api-client";

interface FormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      await api.post("/auth/password-reset/", { email: data.email });
      setSent(true);
    } catch (err: any) {
      setServerError(
        err?.response?.data?.detail ??
          "Couldn't send the reset link. Please try again."
      );
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          {sent ? (
            <>
              <div className="text-4xl mb-4">📬</div>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Check your email
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                If <span className="font-medium">{getValues("email")}</span> is
                registered, we&apos;ve sent a link to reset your password. The
                link can only be used once.
              </p>
              <Link href="/login" className="btn-primary w-full justify-center">
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Forgot your password?
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                Enter the email you signed up with and we&apos;ll send you a
                link to choose a new one.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="form-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="form-input"
                    placeholder="you@example.com"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email address",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-600 mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {serverError && (
                  <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-lg px-3 py-2">
                    {serverError}
                  </div>
                )}

                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="btn-primary w-full justify-center"
                >
                  {isSubmitting ? "Sending…" : "Send reset link"}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Remembered it?{" "}
          <Link
            href="/login"
            className="text-brand-600 font-medium hover:text-brand-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
