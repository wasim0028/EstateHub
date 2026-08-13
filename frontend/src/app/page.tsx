// src/app/page.tsx
import Link from "next/link";
import Image from "next/image";
import { fetchFeaturedProperties, fetchLocalities } from "@/lib/api";
import { PropertyCard } from "@/components/property/PropertyCard";
import { HeroSearch } from "@/components/HeroSearch";

export default async function HomePage() {
  const [featured, localities] = await Promise.all([
    fetchFeaturedProperties().catch(() => []),
    fetchLocalities().catch(() => []),
  ]);

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-hero-gradient text-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-brand-400 blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-indigo-600 blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              2,400+ verified listings across India
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-5">
              Find your perfect
              <span className="block text-brand-300">home in India</span>
            </h1>

            <p className="text-lg text-blue-200 mb-10 leading-relaxed">
              Browse luxury apartments, villas, and commercial properties.
              Search by location, price, and lifestyle — zero brokerage.
            </p>

            {/* Search bar — Client Component */}
            <HeroSearch />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-6 mt-16 max-w-lg">
            {[
              { value: "2,400+", label: "Active listings" },
              { value: "120+", label: "Verified agents" },
              { value: "₹0", label: "Brokerage fee" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-blue-300 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROPERTY TYPE TABS ────────────────────────────────── */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap gap-3 justify-center mb-4">
            {[
              { label: "🏠 Houses", href: "/properties?category=house" },
              { label: "🏢 Apartments", href: "/properties?category=apartment" },
              { label: "🏙️ Condos", href: "/properties?category=condo" },
              { label: "🏘️ Townhouses", href: "/properties?category=townhouse" },
              { label: "🏗️ Under Construction", href: "/properties?possession_status=under_construction" },
              { label: "🔑 Ready to Move", href: "/properties?possession_status=ready_to_move" },
              { label: "💰 For Rent", href: "/properties?property_type=rent" },
            ].map((t) => (
              <Link
                key={t.label}
                href={t.href}
                className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50 transition-all"
              >
                {t.label}
              </Link>
            ))}
          </div>

          {/* BHK quick filters */}
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest self-center mr-1">
              Quick pick:
            </span>
            {[1, 2, 3, 4].map((bhk) => (
              <Link
                key={bhk}
                href={`/properties?bhk=${bhk}`}
                className="px-4 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50 transition-all"
              >
                {bhk} BHK
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PROPERTIES ───────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-900 py-16">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-2">
                Featured listings
              </p>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Latest properties
              </h2>
            </div>
            <Link href="/properties" className="btn-secondary text-sm hidden sm:flex">
              View all →
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <p className="text-4xl mb-4">🏠</p>
              <p className="text-lg font-medium">No listings yet</p>
              <p className="text-sm mt-1">Properties added by agents will appear here.</p>
            </div>
          )}

          <div className="mt-10 text-center sm:hidden">
            <Link href="/properties" className="btn-primary">View all properties</Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="bg-white dark:bg-slate-900 py-16">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-2">Simple process</p>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">How it works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { step: "01", icon: "🔍", title: "Search & filter", desc: "Browse verified listings by location, budget, BHK, and amenities." },
              { step: "02", icon: "📞", title: "Connect directly", desc: "Enquire directly with the verified agent — no middlemen, zero brokerage." },
              { step: "03", icon: "🏠", title: "Move in", desc: "Schedule a site visit, complete paperwork, and get the keys." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950 text-2xl mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-brand-400 tracking-widest mb-2">{item.step}</div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CITIES ───────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-900 py-16">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8 text-center">Browse by city</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { city: "Kolkata", emoji: "🌆" },
              { city: "Mumbai", emoji: "🏙️" },
              { city: "Bangalore", emoji: "🌿" },
              { city: "Delhi", emoji: "🏛️" },
              { city: "Hyderabad", emoji: "💎" },
              { city: "Pune", emoji: "🏡" },
            ].map(({ city, emoji }) => (
              <Link
                key={city}
                href={`/properties?city=${city}`}
                className="flex flex-col items-center gap-2 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-300 hover:shadow-card-hover transition-all text-center"
              >
                <span className="text-3xl">{emoji}</span>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{city}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── LOCALITY INSIGHTS ─────────────────────────────────── */}
      {localities.length > 0 && (
        <section className="bg-white dark:bg-slate-900 py-16">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-2">
                  Locality insights
                </p>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Explore by locality</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {localities.slice(0, 6).map((loc) => (
                <Link
                  key={loc.id}
                  href={`/properties?locality=${encodeURIComponent(loc.name)}&city=${encodeURIComponent(loc.city)}`}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-card-hover transition-all h-40"
                >
                  {loc.image_url ? (
                    <Image
                      src={loc.image_url}
                      alt={loc.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full bg-slate-100 dark:bg-slate-800" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <p className="font-semibold">{loc.name}</p>
                    <p className="text-xs text-white/80">{loc.city}</p>
                    {loc.avg_price_per_sqft && (
                      <p className="text-xs text-white/90 mt-1">
                        ~₹{Number(loc.avg_price_per_sqft).toLocaleString("en-IN")}/sqft avg
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── AGENT CTA ─────────────────────────────────────────── */}
      <section className="bg-brand-900 text-white py-16">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Are you a property agent?</h2>
          <p className="text-brand-300 mb-8 max-w-xl mx-auto">
            List your properties for free. Reach thousands of verified buyers and renters.
            Full dashboard — add photos, pricing, floor plans, and more.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register?role=agent" className="btn-primary bg-white dark:bg-slate-900 text-brand-800 hover:bg-brand-50">
              List a property →
            </Link>
            <Link href="/login" className="btn-secondary border-white/30 text-white hover:bg-white/10 dark:hover:bg-slate-800/10">
              Agent sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
