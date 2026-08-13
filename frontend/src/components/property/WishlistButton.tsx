"use client";
// src/components/property/WishlistButton.tsx
/**
 * WishlistButton — CLIENT COMPONENT
 *
 * The heart-icon "shortlist" toggle familiar from housing.com / 99acres.
 * Optimistically flips state on click, then reconciles with the API.
 * Unauthenticated users are redirected to login instead of hitting the API.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { toggleSaveProperty } from "@/lib/api-client";

interface WishlistButtonProps {
  slug: string;
  initialSaved: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function WishlistButton({
  slug,
  initialSaved,
  size = "md",
  className = "",
}: WishlistButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  const dims = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconDims = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push("/login?next=/properties");
      return;
    }

    const next = !saved;
    setSaved(next); // optimistic

    startTransition(async () => {
      try {
        const result = await toggleSaveProperty(slug);
        setSaved(result);
      } catch {
        setSaved(!next); // revert on failure
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from shortlist" : "Add to shortlist"}
      title={saved ? "Remove from shortlist" : "Save to shortlist"}
      className={`inline-flex items-center justify-center ${dims} rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-70 ${className}`}
    >
      <svg
        className={`${iconDims} transition-colors ${
          saved ? "fill-rose-500 stroke-rose-500" : "fill-none stroke-slate-500"
        }`}
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21s-6.716-4.35-9.428-8.485C.4 9.201 1.03 5.5 4.318 4.06 6.94 2.91 9.77 3.94 12 6.36c2.23-2.42 5.06-3.45 7.682-2.3 3.288 1.44 3.918 5.14 1.746 8.455C18.716 16.65 12 21 12 21z"
        />
      </svg>
    </button>
  );
}
