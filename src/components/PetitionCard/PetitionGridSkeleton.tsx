import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Placeholder for a PetitionGrid while its petitions load. Same column
 * breakpoints and card proportions as the real thing, so the page does not
 * reflow when the cards arrive.
 */
export function PetitionGridSkeleton({
  count = 6,
  columns = 3,
  className,
}: {
  count?: number;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  }[columns];

  return (
    <div className={cn("w-full", className)} aria-busy="true">
      <div className={`grid ${gridCols} gap-6 auto-rows-fr`}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="relative flex flex-col overflow-hidden rounded-xl border bg-card"
          >
            <div className="px-6 pt-6 pb-2">
              <div className="mb-3 flex items-center justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            <div className="flex-grow px-6 py-2">
              <Skeleton className="mb-2 h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
            <div className="px-6 pt-4 pb-8">
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <div className="absolute bottom-0 left-0 h-2 w-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default PetitionGridSkeleton;
