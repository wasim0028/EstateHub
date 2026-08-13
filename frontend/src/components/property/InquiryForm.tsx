"use client";
// src/components/property/InquiryForm.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api-client";
import { useAuth } from "@/components/AuthProvider";

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface InquiryFormProps {
  propertySlug: string;
  propertyTitle: string;
}

export function InquiryForm({ propertySlug, propertyTitle }: InquiryFormProps) {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      name: user?.full_name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      message: `Hi, I am interested in ${propertyTitle}. Please share more details.`,
    },
  });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      await api.post(`/properties/${propertySlug}/inquire/`, {
        ...data,
      });
      setSubmitted(true);
    } catch (err: any) {
      setServerError(
        err.response?.data?.detail ?? "Something went wrong. Please try again."
      );
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="font-semibold text-green-800 mb-1">Enquiry sent!</h3>
        <p className="text-sm text-green-700">
          The agent will get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <h3 className="font-semibold mb-4 text-slate-900 dark:text-slate-100">Send an enquiry</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <input
            {...register("name", { required: "Name is required" })}
            placeholder="Your name"
            className="form-input"
          />
          {errors.name && <p className="form-error">{errors.name.message}</p>}
        </div>

        <div>
          <input
            {...register("email", {
              required: "Email is required",
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
            })}
            type="email"
            placeholder="Email address"
            className="form-input"
          />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>

        <div>
          <input
            {...register("phone")}
            type="tel"
            placeholder="Phone number (optional)"
            className="form-input"
          />
        </div>

        <div>
          <textarea
            {...register("message", { required: "Please add a message" })}
            rows={4}
            placeholder="Your message…"
            className="form-input resize-none"
          />
          {errors.message && <p className="form-error">{errors.message.message}</p>}
        </div>

        {serverError && (
          <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full"
        >
          {isSubmitting ? "Sending…" : "Send enquiry"}
        </button>

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Zero brokerage · Your details are shared only with the agent
        </p>
      </form>
    </div>
  );
}
