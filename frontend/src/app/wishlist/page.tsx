// src/app/wishlist/page.tsx
/**
 * Wishlist / Shortlist page — SERVER COMPONENT.
 * Mirrors the "Shortlisted properties" page found on housing.com / 99acres.
 * Uses the same cookie-authenticated serverFetch pattern as the agent dashboard.
 */

import Link from "next/link";
import { serverFetch } from "@/lib/api";
import type { PaginatedResponse, PropertyCard as PropertyCardType } from "@/types";
import { PropertyCard } from "@/components/property/PropertyCard";

export const metadata = { title: "Your Shortlisted Properties" };

export default async function WishlistPage() {
  const data = await serverFetch<PaginatedResponse<PropertyCardType>>(
    "/properties/saved/",
    { next: { revalidate: 0 } }
  ).catch(() => ({ count: 0, next: null, previous: null, results: [] }));

  const properties = data.results;

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-2">
          Your shortlist
        </p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Saved properties</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Properties you&apos;ve saved with the heart icon. Compare them side by side before you decide.
        </p>
      </div>

      {properties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-4xl mb-4">🤍</p>
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Nothing saved yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
            Tap the heart icon on any listing to shortlist it here.
          </p>
          <Link href="/properties" className="btn-primary">
            Browse properties
          </Link>
        </div>
      )}
    </div>
  );
}
