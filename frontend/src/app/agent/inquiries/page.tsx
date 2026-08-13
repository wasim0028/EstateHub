// src/app/agent/inquiries/page.tsx
import { serverFetch } from "@/lib/api";
import type { PaginatedResponse, Inquiry } from "@/types";

export const metadata = { title: "Inquiries" };

const INQ_STYLE: Record<string, string> = {
  new:       "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  read:      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  responded: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  closed:    "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
};

export default async function AgentInquiriesPage() {
  const data = await serverFetch<PaginatedResponse<Inquiry>>(
    "/inquiries/",
    { next: { revalidate: 0 } }
  ).catch(() => ({ results: [] as Inquiry[], count: 0 }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Inquiries ({data.count})
        </h2>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="badge bg-blue-100 text-blue-700">
            {data.results.filter((i) => i.status === "new").length} new
          </span>
        </div>
      </div>

      {data.results.length > 0 ? (
        <div className="space-y-3">
          {data.results.map((inq) => (
            <div key={inq.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                    {inq.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{inq.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {inq.email}
                      {inq.phone && ` · ${inq.phone}`}
                      {" · re: "}
                      <span className="font-medium text-slate-700 dark:text-slate-300">{inq.property_title}</span>
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{inq.message}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`badge capitalize ${INQ_STYLE[inq.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {inq.status}
                  </span>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(inq.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <a href={`mailto:${inq.email}?subject=Re: ${inq.property_title}`}
                  className="btn-primary text-xs px-4 py-2">Reply by email</a>
                {inq.phone && (
                  <a href={`tel:${inq.phone}`} className="btn-secondary text-xs px-4 py-2">Call</a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center">
          <p className="text-4xl mb-4">💬</p>
          <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">No inquiries yet</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            When visitors send enquiries from your property listings, they appear here.
          </p>
        </div>
      )}
    </div>
  );
}
