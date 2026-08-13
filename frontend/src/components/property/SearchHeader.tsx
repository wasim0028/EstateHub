// src/components/property/SearchHeader.tsx
import type { PropertyFilters } from "@/types";

interface SearchHeaderProps {
  count: number;
  filters: PropertyFilters;
}

export function SearchHeader({ count, filters }: SearchHeaderProps) {
  const parts: string[] = [];
  if (filters.property_type === "rent") parts.push("Rentals");
  else if (filters.property_type === "sale") parts.push("Homes for Sale");
  else parts.push("Properties");
  if (filters.city) parts.push(`in ${filters.city}`);
  if (filters.state && !filters.city) parts.push(`in ${filters.state}`);

  return (
    <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-2">{parts.join(" ")}</h1>
        <p className="text-indigo-200 text-sm">
          {count.toLocaleString()} {count === 1 ? "listing" : "listings"} found
          {filters.search ? ` for "${filters.search}"` : ""}
        </p>
      </div>
    </div>
  );
}
