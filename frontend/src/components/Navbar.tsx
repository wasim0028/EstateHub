"use client";
// src/components/Navbar.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

export function Navbar() {
  const { user, logout, isLoading } = useAuth();

  // The main nav is hidden below md, so without this menu a phone had no
  // navigation at all beyond the logo.
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close the menu on navigation, otherwise it stays open over the new page
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 dark:bg-slate-950/95 dark:border-slate-800">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-indigo-600 text-xl">🏡</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-lg tracking-tight">
            EstateHub
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/properties">Browse</NavLink>
          <NavLink href="/properties?property_type=sale">Buy</NavLink>
          <NavLink href="/properties?property_type=rent">Rent</NavLink>
          <NavLink href="/contact">Contact</NavLink>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="md:hidden w-9 h-9 inline-flex items-center justify-center rounded-lg
                       text-slate-600 hover:bg-slate-100 dark:text-slate-300
                       dark:hover:bg-slate-800 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {isLoading ? (
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
          ) : user ? (
            <>
              <Link
                href="/wishlist"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1"
                title="Shortlisted properties"
              >
                <HeartIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Shortlist</span>
              </Link>
              {user.role === "agent" && (
                <Link
                  href="/agent/dashboard"
                  className="hidden lg:inline text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Dashboard
                </Link>
              )}
              {/* Avatar dropdown — signed-in user's details and account links */}
              <UserMenu user={user} onLogout={logout} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold rounded-lg bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile navigation — mirrors the md+ nav links */}
      {menuOpen && (
        <nav className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="max-w-screen-xl mx-auto px-4 py-2 flex flex-col">
            <MobileLink href="/">Home</MobileLink>
            <MobileLink href="/properties">Browse</MobileLink>
            <MobileLink href="/properties?property_type=sale">Buy</MobileLink>
            <MobileLink href="/properties?property_type=rent">Rent</MobileLink>
            <MobileLink href="/contact">Contact</MobileLink>

            {user && (
              <>
                <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
                <MobileLink href="/profile">My profile</MobileLink>
                <MobileLink href="/wishlist">Shortlist</MobileLink>
                {(user.role === "agent" || user.role === "admin") && (
                  <MobileLink href="/agent/dashboard">Dashboard</MobileLink>
                )}
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

function MobileLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-2 py-3 rounded-lg text-base font-medium text-slate-700
                 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800
                 transition-colors"
    >
      {children}
    </Link>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
    >
      {children}
    </Link>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s-6.716-4.35-9.428-8.485C.4 9.201 1.03 5.5 4.318 4.06 6.94 2.91 9.77 3.94 12 6.36c2.23-2.42 5.06-3.45 7.682-2.3 3.288 1.44 3.918 5.14 1.746 8.455C18.716 16.65 12 21 12 21z"
      />
    </svg>
  );
}
