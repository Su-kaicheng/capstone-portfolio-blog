import { SpinnerIcon } from "./Icons.jsx";

/** Centered loading indicator used while an API request is in flight. */
export default function Loader({ label = "Loading…", className = "" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-3 py-16 text-sm text-slate-400 ${className}`}
    >
      <SpinnerIcon className="h-5 w-5 text-accent-400" />
      <span>{label}</span>
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-white/5 ${className}`} />;
}

/** Placeholder cards matching the project/blog card layout. */
export function CardGridSkeleton({ count = 3, gridClassName = "sm:grid-cols-2 lg:grid-cols-3" }) {
  return (
    <div className={`grid gap-6 ${gridClassName}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="surface overflow-hidden">
          <Skeleton className="aspect-[16/9] rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Placeholder rows used by the admin lists. */
export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="divide-y divide-white/5" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center justify-between gap-4 px-4 py-5">
          <div className="w-full max-w-md space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}
