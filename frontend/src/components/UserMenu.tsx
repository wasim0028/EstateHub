"use client";
// src/components/UserMenu.tsx
/**
 * UserMenu — CLIENT COMPONENT
 *
 * The avatar in the navbar used to be a plain <div> with initials — not
 * clickable, and the signed-in user's details were nowhere in the UI. This
 * turns it into a dropdown showing who's signed in (name, email, role) plus
 * the account links.
 *
 * Closes on outside click, on Escape, and on navigation.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import type { User } from "@/types";

const ROLE_LABEL: Record<string, string> = {
  buyer: "Buyer",
  agent: "Agent",
  admin: "Administrator",
};

export function UserMenu({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const initials =
    `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
    user.email[0].toUpperCase();

  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.username;

  // Close when the route changes
  useEffect(() => setOpen(false), [pathname]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const isAgent = user.role === "agent" || user.role === "admin";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950
                   flex items-center justify-center text-indigo-700
                   dark:text-indigo-300 font-semibold text-xs
                   ring-offset-2 ring-offset-white dark:ring-offset-slate-950
                   hover:ring-2 hover:ring-indigo-400 transition-all"
      >
        {initials}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200
                     dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl
                     overflow-hidden z-50"
        >
          {/* Who's signed in */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 shrink-0 rounded-full bg-indigo-100
                           dark:bg-indigo-950 flex items-center justify-center
                           text-indigo-700 dark:text-indigo-300 font-semibold text-sm"
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span
                className="text-[10px] font-semibold uppercase tracking-wide
                           px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700
                           dark:bg-indigo-950 dark:text-indigo-300"
              >
                {ROLE_LABEL[user.role] ?? user.role}
              </span>
              {user.phone && (
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.phone}
                </span>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="py-1">
            <MenuLink href="/profile" Icon={UserIcon}>
              My profile
            </MenuLink>
            <MenuLink href="/wishlist" Icon={Heart}>
              Shortlist
            </MenuLink>
            {isAgent && (
              <MenuLink href="/agent/dashboard" Icon={LayoutDashboard}>
                Agent dashboard
              </MenuLink>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 py-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                         font-medium text-rose-600 dark:text-rose-400
                         hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  Icon,
  children,
}: {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium
                 text-slate-700 dark:text-slate-200 hover:bg-slate-50
                 dark:hover:bg-slate-800 transition-colors"
    >
      <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
      {children}
    </Link>
  );
}
