// src/app/properties/page.tsx
/**
 * Property Listing Page — Next.js SERVER COMPONENT
 *
 * This page is intentionally a React Server Component for maximum SEO benefit:
 * - Properties are fetched directly on the server at request time / via ISR.
 * - Full HTML with content is sent to the browser and to search engine crawlers.
 * - Interactive controls (filters, pagination) are isolated into Client Components.
 * - The page supports URL search params so filtered views are also indexable.
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { fetchProperties } from "@/lib/api";
import type { PropertyFilters } from "@/types";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyFilter } from "@/components/property/PropertyFilter";
import { Pagination } from "@/components/property/Pagination";
import { PropertyCardSkeleton } from "@/components/property/PropertyCardSkeleton";
import { SearchHeader } from "@/components/property/SearchHeader";

// ─────────────────────────────────────────────
// METADATA (dynamic based on filters)
// ─────────────────────────────────────────────

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const city = params.city;
  const type = params.property_type;

  const titleParts = ["Properties"];
  if (type) titleParts.unshift(type === "sale" ? "Homes for Sale" : "Rentals");
  if (city) titleParts.push(`in ${city}`);

  return {
    title: titleParts.join(" "),
    description: `Browse ${type ?? "all"} properties${city ? ` in ${city}` : ""}. Filter by price, bedrooms, and property type on EstateHub.`,
    robots: { index: true, follow: true },
  };
}

// ─────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Parse URL search params into typed filter object
  const filters: PropertyFilters = {
    search: params.search ?? "",
    city: params.city ?? "",
    state: params.state ?? "",
    locality: params.locality ?? "",
    property_type: (params.property_type as PropertyFilters["property_type"]) ?? "",
    category: (params.category as PropertyFilters["category"]) ?? "",
    status: (params.status as PropertyFilters["status"]) ?? "active",
    bhk: params.bhk ? Number(params.bhk) : "",
    beds_min: params.beds_min ? Number(params.beds_min) : "",
    price_min: params.price_min ? Number(params.price_min) : "",
    price_max: params.price_max ? Number(params.price_max) : "",
    possession_status: (params.possession_status as PropertyFilters["possession_status"]) ?? "",
    furnishing: (params.furnishing as PropertyFilters["furnishing"]) ?? "",
    ordering: params.ordering ?? "-created_at",
    page: params.page ? Number(params.page) : 1,
  };

  // Server-side data fetch — this runs on the server, not in the browser
  const propertiesData = await fetchProperties(filters, {
    revalidate: 60,      // ISR: revalidate every 60 seconds
    tags: ["properties"],
  });

  const { results: properties, count, next, previous } = propertiesData;
  const totalPages = Math.ceil(count / 12);
  const currentPage = filters.page as number;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* ── Page Header ───────────────────────────── */}
      <SearchHeader count={count} filters={filters} />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Sidebar Filters (Client Component) ── */}
          <aside className="w-full lg:w-72 shrink-0">
            {/*
              PropertyFilter is a Client Component — it manages local filter
              state and updates the URL with router.push() on change.
              Current filters are passed as initial values from the server.
            */}
            <PropertyFilter initialFilters={filters} />
          </aside>

          {/* ── Property Grid ─────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing{" "}
                <span className="font-medium text-slate-800 dark:text-slate-200">{count}</span>{" "}
                {count === 1 ? "property" : "properties"}
              </p>
              {/* SortSelect is a thin Client Component — just a <select> */}
              <Suspense fallback={<div className="h-9 w-40 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />}>
                <SortSelect currentOrdering={filters.ordering ?? "-created_at"} />
              </Suspense>
            </div>

            {/* Property cards — pure server rendering, no JS needed */}
            {properties.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      hasNext={!!next}
                      hasPrev={!!previous}
                    />
                  </div>
                )}
              </>
            ) : (
              <EmptyState filters={filters} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS (Server)
// ─────────────────────────────────────────────

function EmptyState({ filters }: { filters: PropertyFilters }) {
  const hasFilters = Object.values(filters).some(
    (v) => v !== "" && v !== undefined && v !== "active" && v !== "-created_at" && v !== 1
  );

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-6xl mb-4">🏠</div>
      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
        No properties found
      </h3>
      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
        {hasFilters
          ? "Try adjusting your filters or broadening your search area."
          : "No listings are available right now. Check back soon."}
      </p>
      {hasFilters && (
        <Link
          href="/properties"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          Clear all filters
        </Link>
      )}
    </div>
  );
}

// SortSelect is a Client Component — extracted to keep this file a pure RSC
import { SortSelect } from "@/components/property/SortSelect";
