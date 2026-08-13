"use client";
// src/components/HeroSearch.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [type, setType] = useState<"sale" | "rent">("sale");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("property_type", type);
    if (q.trim()) params.set("search", q.trim());
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-xl">
      {/* Buy / Rent toggle */}
      <div className="flex gap-1 mb-3">
        {(["sale", "rent"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              type === t
                ? "bg-white text-brand-800"
                : "bg-white/15 text-white hover:bg-white/25"
            }`}
          >
            {t === "sale" ? "Buy" : "Rent"}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="flex bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-lg">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="City, locality, project name…"
          className="flex-1 px-5 py-4 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 text-sm focus:outline-none"
        />
        <button
          type="submit"
          className="px-6 py-4 bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors flex items-center gap-2 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search
        </button>
      </div>

      <p className="text-blue-300 text-xs mt-3">
        Try: "Kolkata", "Godrej Blue", "3 BHK Bangalore"
      </p>
    </form>
  );
}
