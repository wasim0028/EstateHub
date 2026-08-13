// src/components/property/Pagination.tsx
"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: true });
    });
  };

  // Show at most 5 page numbers around the current page
  const getPageNumbers = () => {
    const delta = 2;
    const pages: (number | "...")[] = [];
    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);

    if (left > 1) {
      pages.push(1);
      if (left > 2) pages.push("...");
    }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) {
      if (right < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <nav
      className="flex items-center justify-center gap-1"
      aria-label="Pagination"
    >
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={!hasPrev || isPending}
        className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ← Prev
      </button>

      {getPageNumbers().map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-slate-400 dark:text-slate-500">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => goToPage(page as number)}
            disabled={isPending}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
              currentPage === page
                ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                : "border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={!hasNext || isPending}
        className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next →
      </button>
    </nav>
  );
}
