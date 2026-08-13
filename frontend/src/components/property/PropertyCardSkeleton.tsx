// src/components/property/PropertyCardSkeleton.tsx
export function PropertyCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
      <div className="h-52 bg-slate-200 dark:bg-slate-700" />
      <div className="p-4 space-y-3">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        <div className="flex gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}
