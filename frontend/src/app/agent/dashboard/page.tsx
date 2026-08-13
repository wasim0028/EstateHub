// src/app/agent/dashboard/page.tsx
import { serverFetch } from "@/lib/api";
import type { PaginatedResponse, PropertyCard, Inquiry } from "@/types";
import Link from "next/link";

export const metadata = { title: "Agent Dashboard" };

export default async function AgentDashboardPage() {
  const [listingsData, inquiriesData] = await Promise.all([
    serverFetch<PaginatedResponse<PropertyCard>>("/properties/my_listings/", {
      next: { revalidate: 0 },
    }).catch(() => ({ results: [], count: 0 })),
    serverFetch<PaginatedResponse<Inquiry>>("/inquiries/?status=new", {
      next: { revalidate: 0 },
    }).catch(() => ({ results: [], count: 0 })),
  ]);

  const stats = [
    {
      label: "Active Listings",
      value: listingsData.count,
      icon: "🏠",
      href: "/agent/listings",
      color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    },
    {
      label: "New Inquiries",
      value: inquiriesData.count,
      icon: "💬",
      href: "/agent/inquiries",
      color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-sm transition-shadow"
          >
            <div className={`inline-flex p-3 rounded-xl ${stat.color} mb-3`}>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent listings */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Recent Listings
          </h2>
          <Link
            href="/agent/listings/new"
            className="text-sm text-indigo-600 font-medium hover:text-indigo-800"
          >
            + Add new
          </Link>
        </div>

        {listingsData.results.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {listingsData.results.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                href={`/agent/listings/${p.slug}/edit`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden relative">
                  {p.primary_image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.primary_image}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {p.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {p.city}, {p.state}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {p.formatted_price}
                  </p>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-sm mb-4">No listings yet.</p>
            <Link
              href="/agent/listings/new"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Create your first listing
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
