"use client";
// src/app/profile/page.tsx
/**
 * My profile — view and edit the signed-in user's details.
 *
 * Backs onto GET/PUT /api/auth/me/, which already existed but had no UI.
 * `role` and `created_at` are read-only on the server, so they're displayed
 * but not editable here — a buyer must not be able to promote themselves to
 * agent by editing their own profile.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { api, setAccessToken } from "@/lib/api-client";
import { useAuth } from "@/components/AuthProvider";
import type { User } from "@/types";

interface FormData {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
}

const ROLE_LABEL: Record<string, string> = {
  buyer: "Buyer",
  agent: "Agent",
  admin: "Administrator",
};

export default function ProfilePage() {
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>();

  // Send anonymous visitors to sign in
  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?from=/profile");
  }, [isLoading, user, router]);

  // Populate the form once the user arrives
  useEffect(() => {
    if (!user) return;
    reset({
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      username: user.username ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
    });
  }, [user, reset]);

  const onSubmit = async (data: FormData) => {
    setServerError("");
    setSaved(false);
    try {
      await api.put<User>("/auth/me/", data);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      const payload = err?.response?.data;
      setServerError(
        payload?.detail ??
          (payload
            ? Object.entries(payload)
                .map(([k, v]) => `${k}: ${[v].flat().join(" ")}`)
                .join("  •  ")
            : "Couldn't save your changes. Please try again.")
      );
    }
  };

  if (isLoading || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-6" />
        <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const initials =
    `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
    user.email[0].toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">
        Your account
      </p>
      <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8">
        My profile
      </h1>

      {/* Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-lg">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
              {user.full_name || user.username}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {ROLE_LABEL[user.role] ?? user.role}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Member since{" "}
                {new Date(user.created_at).toLocaleDateString("en-IN", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Editable details */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-5">
          Edit details
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label" htmlFor="first_name">
                First name
              </label>
              <input
                id="first_name"
                className="form-input"
                {...register("first_name", { required: "First name is required" })}
              />
              {errors.first_name && (
                <p className="text-xs text-rose-600 mt-1">
                  {errors.first_name.message}
                </p>
              )}
            </div>
            <div>
              <label className="form-label" htmlFor="last_name">
                Last name
              </label>
              <input
                id="last_name"
                className="form-input"
                {...register("last_name", { required: "Last name is required" })}
              />
              {errors.last_name && (
                <p className="text-xs text-rose-600 mt-1">
                  {errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="form-input"
              {...register("username", { required: "Username is required" })}
            />
            {errors.username && (
              <p className="text-xs text-rose-600 mt-1">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              })}
            />
            {errors.email && (
              <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              You sign in with this address.
            </p>
          </div>

          <div>
            <label className="form-label" htmlFor="phone">
              Phone
            </label>
            <input
              id="phone"
              className="form-input"
              placeholder="+91 98765 43210"
              {...register("phone")}
            />
          </div>

          {serverError && (
            <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-lg px-3 py-2">
              {serverError}
            </div>
          )}

          {saved && (
            <div className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg px-3 py-2">
              Profile updated.
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || !isDirty}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => setShowPasswordForm((v) => !v)}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              {showPasswordForm ? "Cancel password change" : "Change password"}
            </button>
          </div>
        </div>
      </div>

      {showPasswordForm && <ChangePasswordCard />}
    </div>
  );
}


interface PasswordFormData {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

/**
 * In-app password change. Unlike the emailed reset flow, this requires the
 * current password, so someone at an unlocked laptop can't take the account
 * over silently.
 *
 * The backend returns a fresh token pair (changing a password invalidates the
 * old ones), which we store so the current tab stays signed in.
 */
function ChangePasswordCard() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>();

  const onSubmit = async (data: PasswordFormData) => {
    setError("");
    setDone(false);
    try {
      const { data: res } = await api.post<{ access: string }>(
        "/auth/change-password/",
        data
      );
      if (res?.access) setAccessToken(res.access);
      reset();
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch (err: any) {
      const payload = err?.response?.data;
      setError(
        payload?.detail ??
          (payload
            ? Object.values(payload).flat().join("  •  ")
            : "Couldn't change your password. Please try again.")
      );
    }
  };

  return (
    <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
      <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Change password
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
        Enter your current password, then choose a new one of at least 8
        characters.
      </p>

      <div className="space-y-4">
        <div>
          <label className="form-label" htmlFor="current_password">
            Current password
          </label>
          <input
            id="current_password"
            type="password"
            autoComplete="current-password"
            className="form-input"
            {...register("current_password", {
              required: "Enter your current password",
            })}
          />
          {errors.current_password && (
            <p className="text-xs text-rose-600 mt-1">
              {errors.current_password.message}
            </p>
          )}
        </div>

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
              required: "Choose a new password",
              minLength: { value: 8, message: "Must be at least 8 characters" },
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
            Confirm new password
          </label>
          <input
            id="new_password_confirm"
            type="password"
            autoComplete="new-password"
            className="form-input"
            {...register("new_password_confirm", {
              required: "Confirm your new password",
              validate: (v) =>
                v === watch("new_password") || "The two passwords do not match",
            })}
          />
          {errors.new_password_confirm && (
            <p className="text-xs text-rose-600 mt-1">
              {errors.new_password_confirm.message}
            </p>
          )}
        </div>

        {error && (
          <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {done && (
          <div className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg px-3 py-2">
            Password changed. Use the new one next time you sign in.
          </div>
        )}

        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Updating…" : "Update password"}
        </button>
      </div>
    </div>
  );
}
