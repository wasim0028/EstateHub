"use client";
// src/app/register/page.tsx
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/components/AuthProvider";

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  phone: string;
  password: string;
  password_confirm: string;
  role: "buyer" | "agent";
}

function RegisterForm() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get("role") as "buyer" | "agent") ?? "buyer";

  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { role: defaultRole },
  });

  const password = watch("password");
  const role = watch("role");

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      await registerUser(data);
      router.push(data.role === "agent" ? "/agent/dashboard" : "/properties");
    } catch (err: any) {
      setServerError(err.message ?? "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
            <span>🏡</span> EstateHub
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-6 mb-1">Create an account</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Free forever · No credit card required</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="form-label">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {(["buyer", "agent"] as const).map((r) => (
                  <label key={r} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    role === r
                      ? "border-brand-500 bg-brand-50 text-brand-900 dark:bg-brand-950 dark:text-brand-100"
                      : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600 dark:text-slate-200"
                  }`}>
                    <input {...register("role")} type="radio" value={r} className="sr-only" />
                    <span className="text-lg">{r === "buyer" ? "🏠" : "🏢"}</span>
                    <span className="text-sm font-medium capitalize">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">First name</label>
                <input {...register("first_name", { required: "Required" })} placeholder="Rahul" className="form-input" />
                {errors.first_name && <p className="form-error">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="form-label">Last name</label>
                <input {...register("last_name", { required: "Required" })} placeholder="Sharma" className="form-input" />
                {errors.last_name && <p className="form-error">{errors.last_name.message}</p>}
              </div>
            </div>

            <div>
              <label className="form-label">Email</label>
              <input {...register("email", { required: "Required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" } })} type="email" placeholder="you@example.com" className="form-input" />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="form-label">Username</label>
              <input {...register("username", { required: "Required", minLength: { value: 3, message: "At least 3 characters" } })} placeholder="rahulsharma" className="form-input" />
              {errors.username && <p className="form-error">{errors.username.message}</p>}
            </div>

            <div>
              <label className="form-label">Phone (optional)</label>
              <input {...register("phone")} type="tel" placeholder="+91 98300 00000" className="form-input" />
            </div>

            <div>
              <label className="form-label">Password</label>
              <input {...register("password", { required: "Required", minLength: { value: 8, message: "At least 8 characters" } })} type="password" placeholder="Min. 8 characters" className="form-input" />
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <div>
              <label className="form-label">Confirm password</label>
              <input {...register("password_confirm", { required: "Required", validate: (v) => v === password || "Passwords do not match" })} type="password" placeholder="Re-enter password" className="form-input" />
              {errors.password_confirm && <p className="form-error">{errors.password_confirm.message}</p>}
            </div>

            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
              {isSubmitting ? "Creating account…" : "Create account →"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-600 font-medium hover:text-brand-700">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
