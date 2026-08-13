"use client";
// src/app/reset-password/page.tsx
/**
 * Choose a new password using the uid + token from the emailed link.
 *
 * useSearchParams() requires a <Suspense> boundary in the App Router, so the
 * form lives in an inner component (the same pattern as /login and /register).
 */

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api-client";

interface FormData {
  new_password: string;
  new_password_confirm: string;
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const linkIsUsable = Boolean(uid && token);

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      await api.post("/auth/password-reset/confirm/", {
        uid,
        token,
        new_password: data.new_password,
        new_password_confirm: data.new_password_confirm,
      });
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      const data = err?.response?.data;
      setServerError(
        data?.detail ??
          (data ? Object.values(data).flat().join(" ") : "") ??
          "Couldn't reset your password. Please request a new link."
      );
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          {!linkIsUsable ? (
            <>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Link not valid
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                This page needs to be opened from the reset link in your email.
              </p>
              <Link
                href="/forgot-password"
                className="btn-primary w-full justify-center"
              >
                Request a new link
              </Link>
            </>
          ) : done ? (
            <>
              <div className="text-4xl mb-4">✅</div>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Password updated
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                Taking you to the sign-in page…
              </p>
              <Link href="/login" className="btn-primary w-full justify-center">
                Sign in now
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Choose a new password
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                Pick something at least 8 characters long.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="form-label" htmlFor="new_password">
                    New password
                  </label>
                  <input
                    id="new_password"
                    type="password"
                    autoComplete="new-password"
                    className="form-input"
                    {...register("new_password", {
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Must be at least 8 characters",
                      },
                    })}
                  />
                  {errors.new_password && (
                    <p className="text-xs text-rose-600 mt-1">
                      {errors.new_password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label" htmlFor="new_password_confirm">
                    Confirm password
                  </label>
                  <input
                    id="new_password_confirm"
                    type="password"
                    autoComplete="new-password"
                    className="form-input"
                    {...register("new_password_confirm", {
                      required: "Please confirm your password",
                      validate: (v) =>
                        v === watch("new_password") ||
                        "The two passwords do not match",
                    })}
                  />
                  {errors.new_password_confirm && (
                    <p className="text-xs text-rose-600 mt-1">
                      {errors.new_password_confirm.message}
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
                  {isSubmitting ? "Updating…" : "Update password"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
