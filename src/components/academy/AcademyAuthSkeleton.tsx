import { Skeleton } from "@/components/ui/skeleton";

/** Shown while session loads on gated Academy / settings pages — never a blank screen. */
export function AcademyAuthSkeleton() {
  return (
    <div
      className="mx-auto max-w-7xl px-6 py-8 pb-32"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-9 w-64 max-w-full" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
      <Skeleton className="mt-6 h-40 w-full rounded-2xl" />
    </div>
  );
}
