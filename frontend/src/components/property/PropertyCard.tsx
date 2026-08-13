// src/components/property/PropertyCard.tsx
/**
 * PropertyCard — SERVER COMPONENT (wraps a small client island for the
 * wishlist heart button). Styled after housing.com / 99acres listing cards:
 * BHK + locality up top, verified/featured ribbons, price-per-sqft, and
 * possession/furnishing chips.
 */

import Link from "next/link";
import Image from "next/image";
import type { PropertyCard as PropertyCardType } from "@/types";
import { WishlistButton } from "./WishlistButton";

interface PropertyCardProps {
  property: PropertyCardType;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-700" },
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
  sold: { label: "Sold", cls: "bg-red-100 text-red-700" },
  rented: { label: "Rented", cls: "bg-blue-100 text-blue-700" },
  off_market: { label: "Off Market", cls: "bg-slate-100 text-slate-600" },
};

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

export function PropertyCard({ property }: PropertyCardProps) {
  const badge = STATUS_BADGE[property.status] ?? STATUS_BADGE.active;

  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-52 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {property.primary_image ? (
          <Image
            src={property.primary_image}
            alt={property.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2
                       bg-gradient-to-br from-slate-100 to-slate-200
                       dark:from-slate-800 dark:to-slate-900"
          >
            <PlaceholderIcon className="h-10 w-10 text-slate-400 dark:text-slate-600" />
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
              No photo yet
            </span>
          </div>
        )}

        {/* Type badge */}
        <span
          className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-full ${
            property.property_type === "rent"
              ? "bg-violet-600 text-white"
              : "bg-indigo-600 text-white"
          }`}
        >
          {property.property_type === "rent" ? "For Rent" : "For Sale"}
        </span>

        {/* Featured ribbon */}
        {property.is_featured && (
          <span className="absolute top-3 right-12 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-400 text-amber-950 flex items-center gap-1">
            <StarIcon className="h-3 w-3" /> Featured
          </span>
        )}

        {/* Wishlist heart */}
        <WishlistButton
          slug={property.slug}
          initialSaved={property.is_saved}
          size="sm"
          className="absolute top-3 right-3"
        />

        {/* Status badge (only when non-active) */}
        {property.status !== "active" && (
          <span
            className={`absolute bottom-3 right-3 px-2.5 py-1 text-xs font-semibold rounded-full ${badge.cls}`}
          >
            {badge.label}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Price row */}
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{property.formatted_price}</p>
          {property.price_per_sqft ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
              ₹{Math.round(property.price_per_sqft).toLocaleString("en-IN")}/sqft
            </p>
          ) : null}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-tight mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {property.bhk_label ? `${property.bhk_label} ` : ""}
          {property.title}
        </h3>

        {/* Location */}
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
          <LocationIcon className="h-3.5 w-3.5 shrink-0" />
          {property.locality ? `${property.locality}, ` : ""}
          {property.city}, {property.state}
        </p>

        {/* Verified + possession/furnishing chips */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {property.is_verified && (
            <Chip cls="bg-teal-50 text-teal-700">
              <VerifiedIcon className="h-3 w-3" /> Verified
            </Chip>
          )}
          {property.possession_status && (
            <Chip cls="bg-slate-50 text-slate-600">
              {POSSESSION_LABEL[property.possession_status]}
            </Chip>
          )}
          {property.furnishing !== "unfurnished" && (
            <Chip cls="bg-slate-50 text-slate-600">
              {FURNISHING_LABEL[property.furnishing]}
            </Chip>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Stat icon={<BedIcon />} value={property.beds} label="bed" />
          <Stat icon={<BathIcon />} value={property.baths} label="bath" />
          <Stat
            icon={<AreaIcon />}
            value={property.area_sqft.toLocaleString()}
            label="sq ft"
          />
        </div>

        {/* Agent */}
        {property.agent_name && (
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 truncate">
            Listed by {property.agent_name}
          </p>
        )}
      </div>
    </Link>
  );
}

function Chip({ children, cls }: { children: React.ReactNode; cls: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${cls}`}>
      {children}
    </span>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-slate-400 dark:text-slate-500">{icon}</span>
      <strong className="font-semibold text-slate-700 dark:text-slate-300">{value}</strong>{" "}
      {label}
    </span>
  );
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function BathIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function AreaIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.447a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.538 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.783.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.062 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.958z" />
    </svg>
  );
}

function VerifiedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 1l2.39 1.94 3.08.14 1.03 2.9 2.5 1.83-.94 2.98.94 2.98-2.5 1.83-1.03 2.9-3.08.14L10 21l-2.39-1.94-3.08-.14-1.03-2.9-2.5-1.83.94-2.98-.94-2.98 2.5-1.83 1.03-2.9 3.08-.14L10 1zm3.7 6.7a1 1 0 00-1.4-1.4L9 9.59 7.7 8.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function PlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
