// src/app/agent/listings/page.tsx
import { serverFetch } from "@/lib/api";
import type { PaginatedResponse, PropertyCard } from "@/types";
import Link from "next/link";

export const metadata = { title: "My Listings" };

export default async function AgentListingsPage() {
  const data = await serverFetch<PaginatedResponse<PropertyCard>>(
    "/properties/my_listings/",
    { next: { revalidate: 0 } }
  ).catch(() => ({ results: [] as PropertyCard[], count: 0 }));

  const STATUS_STYLE: Record<string, string> = {
    active:    "bg-green-100 text-green-700",
    pending:   "bg-amber-100 text-amber-700",
    sold:      "bg-red-100 text-red-700",
    rented:    "bg-violet-100 text-violet-700",
    off_market:"bg-slate-100 text-slate-600",
  };

  const fmtPrice = (v: number) => {
    if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(2)} Cr`;
    if (v >= 100_000) return `₹${Math.round(v / 100_000)} L`;
    return `₹${v.toLocaleString("en-IN")}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          My listings ({data.count})
        </h2>
        <Link href="/agent/listings/new" className="btn-primary text-sm">
          + Add property
        </Link>
      </div>

      {data.results.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <tr>
                {["Property", "Price", "Specs", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.results.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{p.title}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{p.city}, {p.state}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-brand-700">{fmtPrice(p.price)}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{p.property_type}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                    {p.beds}bd · {p.baths}ba · {p.area_sqft?.toLocaleString()} sqft
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge capitalize ${STATUS_STYLE[p.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {p.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Link href={`/properties/${p.slug}`} target="_blank" className="text-xs text-brand-600 hover:underline">View</Link>
                      <span className="text-slate-300">·</span>
                      <Link href={`/agent/listings/${p.slug}/edit`} className="text-xs text-slate-600 dark:text-slate-300 hover:underline">Edit</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center">
          <p className="text-4xl mb-4">🏠</p>
          <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">No listings yet</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">Add your first property and it will appear on the website immediately.</p>
          <Link href="/agent/listings/new" className="btn-primary">Add your first property</Link>
        </div>
      )}
    </div>
  );
}
