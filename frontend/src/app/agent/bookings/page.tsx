// src/app/agent/bookings/page.tsx
/**
 * Site visits booked on this agent's listings.
 *
 * The data existed but was admin-only — an agent had no way to see who had
 * paid to visit their own properties, so buyers would turn up expecting a
 * viewing the agent knew nothing about.
 */
import { serverFetch } from "@/lib/api";

export const metadata = { title: "Site visits" };

interface AgentBooking {
  id: number;
  property_title: string;
  property_slug: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  amount: string;
  status: "created" | "paid" | "failed" | "cancelled";
  preferred_date: string | null;
  notes: string;
  razorpay_payment_id: string;
  created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  created: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  failed: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const STATUS_LABEL: Record<string, string> = {
  paid: "Paid",
  created: "Awaiting payment",
  failed: "Failed",
  cancelled: "Cancelled",
};

function formatDate(value: string | null) {
  if (!value) return "Not specified";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AgentBookingsPage() {
  const bookings = await serverFetch<AgentBooking[]>(
    "/bookings/for_my_listings/",
    { next: { revalidate: 0 } }
  ).catch(() => [] as AgentBooking[]);

  const paid = bookings.filter((b) => b.status === "paid");
  const collected = paid.reduce((sum, b) => sum + Number(b.amount), 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Site visits ({bookings.length})
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="badge bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
            {paid.length} paid
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            ₹{collected.toLocaleString("en-IN")} collected
          </span>
        </div>
      </div>

      {bookings.length > 0 ? (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-sm shrink-0">
                    {b.buyer_name?.charAt(0) || b.buyer_email.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {b.buyer_name || b.buyer_email}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {b.buyer_email}
                      {b.buyer_phone ? ` · ${b.buyer_phone}` : ""}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 truncate">
                      {b.property_title}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`badge ${STATUS_STYLE[b.status] ?? ""}`}>
                    {STATUS_LABEL[b.status] ?? b.status}
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-2">
                    ₹{Number(b.amount).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-slate-400 dark:text-slate-500">
                    Preferred visit date
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {formatDate(b.preferred_date)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 dark:text-slate-500">Booked on</p>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {formatDate(b.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 dark:text-slate-500">Payment ID</p>
                  <p className="text-slate-700 dark:text-slate-300 font-mono text-[11px] truncate">
                    {b.razorpay_payment_id || "—"}
                  </p>
                </div>
              </div>

              {b.notes && (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                  {b.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-16 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-medium text-slate-700 dark:text-slate-200">
            No site visits booked yet
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            When a buyer pays the token amount to visit one of your properties,
            they&apos;ll appear here with their contact details.
          </p>
        </div>
      )}
    </div>
  );
}
