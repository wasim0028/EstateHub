// src/app/agent/layout.tsx
/**
 * Agent Dashboard Layout
 * Server Component — checks auth via cookie. Redirects unauthenticated users.
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";

async function getAgentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("re_access_token")?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${process.env.DJANGO_API_URL}/api/auth/me/`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAgentUser();

  if (!user) redirect("/login?from=/agent/dashboard");
  if (user.role !== "agent" && user.role !== "admin") redirect("/");

  const navItems = [
    { href: "/agent/dashboard", label: "Overview", icon: "📊" },
    { href: "/agent/listings", label: "My Listings", icon: "🏠" },
    { href: "/agent/listings/new", label: "Add Listing", icon: "➕" },
    { href: "/agent/inquiries", label: "Inquiries", icon: "💬" },
    { href: "/agent/bookings", label: "Site visits", icon: "📅" },
    { href: "/agent/profile", label: "Profile", icon: "👤" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
            {user.first_name?.[0]}
            {user.last_name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
              {user.full_name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/properties"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            ← Back to Site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 lg:px-8">
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Agent Dashboard</h1>
        </header>
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
