"use client";
// src/components/property/SortSelect.tsx
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const SORT_OPTIONS = [
  { value: "-created_at", label: "Newest First" },
  { value: "created_at", label: "Oldest First" },
  { value: "price", label: "Price: Low to High" },
  { value: "-price", label: "Price: High to Low" },
  { value: "-beds", label: "Most Bedrooms" },
  { value: "area_sqft", label: "Smallest Area" },
  { value: "-area_sqft", label: "Largest Area" },
];

export function SortSelect({ currentOrdering }: { currentOrdering: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("ordering", e.target.value);
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <select
      value={currentOrdering}
      onChange={handleChange}
      className="text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
