// src/components/Footer.tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 dark:text-slate-500 mt-auto">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              🏡 EstateHub
            </Link>
            <p className="text-sm leading-relaxed">
              Verified property listings across India. Zero brokerage, direct agent connect.
            </p>
          </div>

          {/* Browse */}
          <div>
            <p className="text-white text-sm font-semibold mb-3">Browse</p>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Buy properties", href: "/properties?property_type=sale" },
                { label: "Rent properties", href: "/properties?property_type=rent" },
                { label: "New launches", href: "/properties?ordering=-created_at" },
                { label: "All cities", href: "/properties" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Agents */}
          <div>
            <p className="text-white text-sm font-semibold mb-3">For agents</p>
            <ul className="space-y-2 text-sm">
              {[
                { label: "List a property", href: "/register?role=agent" },
                { label: "Agent dashboard", href: "/agent/dashboard" },
                { label: "Manage listings", href: "/agent/listings" },
                { label: "View inquiries", href: "/agent/inquiries" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-white text-sm font-semibold mb-3">Company</p>
            <ul className="space-y-2 text-sm">
              {[
                { label: "About us", href: "#" },
                { label: "Contact", href: "/contact" },
                { label: "Privacy policy", href: "#" },
                { label: "Terms of service", href: "#" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© {new Date().getFullYear()} EstateHub. All rights reserved.</p>
          <p>Built with Next.js · Django · PostgreSQL</p>
        </div>
      </div>
    </footer>
  );
}
