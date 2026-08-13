"use client";
// src/components/ContactForm.tsx

import { useState } from "react";
import { submitContactMessage } from "@/lib/api-client";

export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      await submitContactMessage(form);
      setStatus("sent");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      setStatus("error");
      setError("Couldn't send your message right now. Please try again in a moment.");
    }
  };

  if (status === "sent") {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-emerald-800">
        <p className="font-semibold mb-1">✓ Message sent</p>
        <p className="text-sm">
          Thanks for reaching out — our team will get back to you within 1 business day.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-sm underline mt-3"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="form-input"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="form-input"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className="form-input"
            placeholder="+91 98XXX XXXXX"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
          <input
            value={form.subject}
            onChange={(e) => set("subject", e.target.value)}
            className="form-input"
            placeholder="What's this about?"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message *</label>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          className="form-input resize-none"
          placeholder="How can we help?"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-primary w-full sm:w-auto disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
