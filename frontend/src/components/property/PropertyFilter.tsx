"use client";
// src/components/property/PropertyFilter.tsx
/**
 * Property Filter — CLIENT COMPONENT
 *
 * Manages all interactive filter state locally, then reflects the selected
 * filters into the URL via Next.js router so:
 *  1. The Server Component re-fetches with updated params.
 *  2. The filtered URL is shareable and crawlable.
 *  3. The browser back button restores previous filter state.
 *
 * Marked "use client" — this is the strict boundary between RSC and the
 * interactive filter UI that requires useState / event handlers.
 */

import { useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import type { PropertyFilters } from "@/types";

interface PropertyFilterProps {
  initialFilters: PropertyFilters;
}

const PROPERTY_TYPES = [
  { value: "", label: "Any" },
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
] as const;

const CATEGORIES = [
  { value: "", label: "All Types" },
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
] as const;

const BHK_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "1 BHK" },
  { value: "2", label: "2 BHK" },
  { value: "3", label: "3 BHK" },
  { value: "4", label: "4+ BHK" },
] as const;

const POSSESSION_OPTIONS = [
  { value: "", label: "Any" },
  { value: "ready_to_move", label: "Ready to Move" },
  { value: "under_construction", label: "Under Construction" },
  { value: "new_launch", label: "New Launch" },
] as const;

const FURNISHING_OPTIONS = [
  { value: "", label: "Any" },
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi_furnished", label: "Semi-Furnished" },
  { value: "fully_furnished", label: "Fully Furnished" },
] as const;

const PRICE_PRESETS_SALE = [
  { label: "Under ₹50 L", min: "", max: "5000000" },
  { label: "₹50 L – ₹1 Cr", min: "5000000", max: "10000000" },
  { label: "₹1 Cr – ₹2 Cr", min: "10000000", max: "20000000" },
  { label: "₹2 Cr+", min: "20000000", max: "" },
];

const PRICE_PRESETS_RENT = [
  { label: "Under ₹20K/mo", min: "", max: "20000" },
  { label: "₹20K – ₹40K", min: "20000", max: "40000" },
  { label: "₹40K – ₹75K", min: "40000", max: "75000" },
  { label: "₹75K+/mo", min: "75000", max: "" },
];

export function PropertyFilter({ initialFilters }: PropertyFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, control, watch, reset, setValue } =
    useForm<PropertyFilters>({
      defaultValues: initialFilters,
    });

  const propertyType = watch("property_type");
  const pricePresets =
    propertyType === "rent" ? PRICE_PRESETS_RENT : PRICE_PRESETS_SALE;

  // Build a new URLSearchParams from form values and push to router
  const applyFilters = useCallback(
    (data: PropertyFilters) => {
      const params = new URLSearchParams(searchParams.toString());

      // Reset to page 1 whenever filters change
      params.delete("page");

      const entries: [string, string][] = [
        ["search", data.search ?? ""],
        ["city", data.city ?? ""],
        ["state", data.state ?? ""],
        ["locality", data.locality ?? ""],
        ["property_type", data.property_type ?? ""],
        ["category", data.category ?? ""],
        ["bhk", data.bhk ? String(data.bhk) : ""],
        ["price_min", data.price_min ? String(data.price_min) : ""],
        ["price_max", data.price_max ? String(data.price_max) : ""],
        ["possession_status", data.possession_status ?? ""],
        ["furnishing", data.furnishing ?? ""],
      ];

      for (const [key, value] of entries) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  const handleReset = () => {
    reset({
      search: "",
      city: "",
      state: "",
      locality: "",
      property_type: "",
      category: "",
      bhk: "",
      price_min: "",
      price_max: "",
      possession_status: "",
      furnishing: "",
    });
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  const applyPricePreset = (min: string, max: string) => {
    setValue("price_min", min ? Number(min) : "");
    setValue("price_max", max ? Number(max) : "");
    handleSubmit(applyFilters)();
  };

  return (
    <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-wide uppercase">
          Filters
        </h2>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          Reset all
        </button>
      </div>

      <form onSubmit={handleSubmit(applyFilters)} className="divide-y divide-slate-100 dark:divide-slate-800">
        {/* ── Keyword Search ───────────────────── */}
        <FilterSection title="Search">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              {...register("search")}
              type="text"
              placeholder="Keyword, address, city…"
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
        </FilterSection>

        {/* ── Location ─────────────────────────── */}
        <FilterSection title="Location">
          <div className="space-y-2">
            <input
              {...register("locality")}
              type="text"
              placeholder="Locality (e.g. Salt Lake, Whitefield)"
              className={inputCls}
            />
            <input
              {...register("city")}
              type="text"
              placeholder="City"
              className={inputCls}
            />
            <input
              {...register("state")}
              type="text"
              placeholder="State"
              className={inputCls}
            />
          </div>
        </FilterSection>

        {/* ── Listing Type ─────────────────────── */}
        <FilterSection title="Listing Type">
          <Controller
            name="property_type"
            control={control}
            render={({ field }) => (
              <div className="flex gap-2">
                {PROPERTY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      field.onChange(t.value);
                      handleSubmit(applyFilters)();
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                      field.value === t.value
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          />
        </FilterSection>

        {/* ── Property Category ────────────────── */}
        <FilterSection title="Property Type">
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  handleSubmit(applyFilters)();
                }}
                className={selectCls}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
          />
        </FilterSection>

        {/* ── Price Range ──────────────────────── */}
        <FilterSection title="Price Range">
          {/* Quick presets */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {pricePresets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPricePreset(p.min, p.max)}
                className="py-1.5 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-700 transition-colors text-center"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Manual input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs">
                ₹
              </span>
              <input
                {...register("price_min", { valueAsNumber: true })}
                type="number"
                placeholder="Min"
                min={0}
                className={`${inputCls} pl-6`}
              />
            </div>
            <span className="text-slate-300 text-sm">—</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs">
                ₹
              </span>
              <input
                {...register("price_max", { valueAsNumber: true })}
                type="number"
                placeholder="Max"
                min={0}
                className={`${inputCls} pl-6`}
              />
            </div>
          </div>
        </FilterSection>

        {/* ── BHK ──────────────────────────────── */}
        <FilterSection title="BHK Configuration">
          <Controller
            name="bhk"
            control={control}
            render={({ field }) => (
              <div className="flex gap-1.5 flex-wrap">
                {BHK_OPTIONS.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => {
                      field.onChange(b.value === "" ? "" : Number(b.value));
                      handleSubmit(applyFilters)();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      String(field.value ?? "") === b.value
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            )}
          />
        </FilterSection>

        {/* ── Possession Status ─────────────────── */}
        <FilterSection title="Possession Status">
          <Controller
            name="possession_status"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  handleSubmit(applyFilters)();
                }}
                className={selectCls}
              >
                {POSSESSION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
          />
        </FilterSection>

        {/* ── Furnishing ────────────────────────── */}
        <FilterSection title="Furnishing">
          <Controller
            name="furnishing"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  handleSubmit(applyFilters)();
                }}
                className={selectCls}
              >
                {FURNISHING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
          />
        </FilterSection>

        {/* ── Apply Button ─────────────────────── */}
        <div className="px-5 py-4">
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <SpinnerIcon className="h-4 w-4 animate-spin" />
                Applying…
              </span>
            ) : (
              "Apply Filters"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4 space-y-3">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
        {title}
      </p>
      {children}
    </div>
  );
}

// Shared class strings
const inputCls =
  "w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition";

const selectCls =
  "w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none cursor-pointer";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
