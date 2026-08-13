// src/app/properties/[slug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchPropertyBySlug } from "@/lib/api";
import { InquiryForm } from "@/components/property/InquiryForm";
import { BookVisitButton } from "@/components/property/BookVisitButton";
import { ImageGallery } from "@/components/property/ImageGallery";
import { EMICalculator } from "@/components/property/EMICalculator";
import { WishlistButton } from "@/components/property/WishlistButton";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ── SEO metadata ──────────────────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await fetchPropertyBySlug(slug);
    return {
      title: `${p.title} — ${p.city}, ${p.state}`,
      description: p.meta_description || p.description.slice(0, 155),
      openGraph: {
        title: p.title,
        description: p.meta_description || p.description.slice(0, 155),
        images: p.primary_image ? [{ url: p.primary_image }] : [],
      },
    };
  } catch {
    return { title: "Property not found" };
  }
}

const STATUS_BADGE: Record<string, string> = {
  active:    "bg-green-100 text-green-700",
  pending:   "bg-amber-100 text-amber-700",
  sold:      "bg-red-100 text-red-700",
  rented:    "bg-violet-100 text-violet-700",
  off_market:"bg-slate-100 text-slate-600",
};

// ── Page ─────────────────────────────────────────────────────────────────
export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let property;
  try {
    property = await fetchPropertyBySlug(slug);
  } catch {
    notFound();
  }

  const {
    title, description, property_type, category, status, price, formatted_price,
    price_per_sqft, address, locality, city, state, zip_code, bhk, bhk_label,
    beds, baths, area_sqft, carpet_area_sqft, year_built, garage_spaces, floors,
    possession_status, furnishing, transaction_type, is_verified, is_featured,
    views_count, is_saved, slug: propertySlug, features, images, agent,
    latitude, longitude,
  } = property;

  const POSSESSION_LABEL: Record<string, string> = {
    ready_to_move: "Ready to Move",
    under_construction: "Under Construction",
    new_launch: "New Launch",
  };
  const FURNISHING_LABEL: Record<string, string> = {
    unfurnished: "Unfurnished",
    semi_furnished: "Semi-Furnished",
    fully_furnished: "Fully Furnished",
  };
  const TRANSACTION_LABEL: Record<string, string> = {
    new_booking: "New Booking",
    resale: "Resale",
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* ── Breadcrumb ─────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-brand-600">Home</Link>
          <span>/</span>
          <Link href="/properties" className="hover:text-brand-600">Properties</Link>
          <span>/</span>
          <Link href={`/properties?city=${city}`} className="hover:text-brand-600">{city}</Link>
          {locality && (
            <>
              <span>/</span>
              <Link href={`/properties?locality=${encodeURIComponent(locality)}`} className="hover:text-brand-600">{locality}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200 font-medium">{title}</span>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── LEFT — Main content ─────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Tags + title */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`badge ${property_type === "sale" ? "bg-brand-100 text-brand-700" : "bg-violet-100 text-violet-700"}`}>
                  {property_type === "sale" ? "For Sale" : "For Rent"}
                </span>
                <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">{category}</span>
                <span className={`badge ${STATUS_BADGE[status] ?? "bg-slate-100 text-slate-600"} capitalize`}>
                  {status.replace("_", " ")}
                </span>
                {is_verified && (
                  <span className="badge bg-teal-100 text-teal-700">✓ Verified</span>
                )}
                {is_featured && (
                  <span className="badge bg-amber-100 text-amber-800">★ Featured</span>
                )}
                <span className="ml-auto">
                  <WishlistButton slug={propertySlug} initialSaved={is_saved} />
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {bhk_label ? `${bhk_label} ` : ""}{title}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1.5">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {address}{locality ? `, ${locality}` : ""}, {city}, {state} — {zip_code}
              </p>
              {views_count > 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">👁️ {views_count.toLocaleString()} people viewed this property</p>
              )}
            </div>

            {/* Gallery — Client Component for lightbox interactivity */}
            <ImageGallery images={images} title={title} />

            {/* Price + key stats */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-baseline gap-3 flex-wrap mb-5">
                <span className="text-3xl font-bold text-brand-700">{formatted_price}</span>
                {price_per_sqft && (
                  <span className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    ₹{Number(price_per_sqft).toLocaleString("en-IN")}/sqft
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  ...(bhk ? [{ icon: "🏠", label: "Configuration", value: bhk_label }] : []),
                  { icon: "🛏️", label: "Bedrooms", value: beds },
                  { icon: "🚿", label: "Bathrooms", value: baths },
                  { icon: "📐", label: "Super Area", value: `${area_sqft?.toLocaleString()} sqft` },
                  ...(carpet_area_sqft ? [{ icon: "📏", label: "Carpet Area", value: `${carpet_area_sqft.toLocaleString()} sqft` }] : []),
                  { icon: "🏢", label: "Floors", value: floors || "—" },
                  ...(year_built ? [{ icon: "📅", label: "Year built", value: year_built }] : []),
                  ...(garage_spaces ? [{ icon: "🚗", label: "Parking", value: `${garage_spaces} spot${garage_spaces > 1 ? "s" : ""}` }] : []),
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-center">
                    <div className="text-xl mb-1">{s.icon}</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{s.value}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Possession / furnishing / transaction chips */}
              <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                  {POSSESSION_LABEL[possession_status]}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                  {FURNISHING_LABEL[furnishing]}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                  {TRANSACTION_LABEL[transaction_type]}
                </span>
              </div>
            </div>

            {/* About */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-semibold mb-3">About this property</h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">{description}</p>
            </div>

            {/* Amenities */}
            {features && features.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-semibold mb-4">Amenities & features</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {features.map((f: string) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2">
                      <span className="text-green-500 font-bold">✓</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-semibold mb-4">Location</h2>
              {latitude && longitude ? (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 mb-4">
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(longitude) - 0.01},${Number(latitude) - 0.01},${Number(longitude) + 0.01},${Number(latitude) + 0.01}&layer=mapnik&marker=${latitude},${longitude}`}
                    width="100%"
                    height="260"
                    style={{ border: "none" }}
                    title="Property location"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm mb-4">
                  Map preview — add lat/lng in the admin to enable
                </div>
              )}
              <p className="text-sm text-slate-600 dark:text-slate-300">
                📍 {address}, {city}, {state}, {zip_code}
              </p>
            </div>

            {/* EMI Calculator — Client Component */}
            <EMICalculator price={Number(price)} />
          </div>

          {/* ── RIGHT — Sticky sidebar ──────────────────── */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="sticky top-20 space-y-4">

              {/* Agent card */}
              {agent && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    {agent.avatar ? (
                      <Image src={agent.avatar} alt={agent.full_name} width={44} height={44} className="rounded-full" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                        {agent.full_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm">{agent.full_name}</p>
                      {agent.agent_profile?.company && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{agent.agent_profile.company}</p>
                      )}
                      <p className="text-xs text-green-600 font-medium">✓ Verified agent</p>
                    </div>
                  </div>
                  {agent.phone && (
                    <a href={`tel:${agent.phone}`} className="btn-secondary w-full mb-2 text-sm">
                      📞 Call agent
                    </a>
                  )}
                </div>
              )}

              {/* Book a site visit — Razorpay UPI token payment (login required) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <BookVisitButton propertyId={property.id} propertyTitle={title} />
              </div>

              {/* Inquiry form — Client Component */}
              <InquiryForm propertySlug={propertySlug} propertyTitle={title} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
