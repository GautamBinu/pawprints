import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PetitionGridSkeleton } from "@/components/PetitionCard/PetitionGridSkeleton";

/**
 * The home page's loading state. The page already had a <Suspense> in it,
 * but its `await getPetitions()` ran *above* the boundary, so the boundary
 * never suspended anything — the route still blocked on the fetch. A
 * loading file wraps the whole segment, which is what actually makes the
 * navigation instant.
 */
export default function HomeLoading() {
  return (
    <div className="container mx-auto px-6 py-24" aria-busy="true">
      <div className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="w-full space-y-3 md:w-auto">
          <Skeleton className="h-10 w-72 max-w-full" />
          <Skeleton className="h-6 w-96 max-w-full" />
        </div>
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-11 w-40 rounded-md" />
          <Skeleton className="h-11 w-32 rounded-md" />
        </div>
      </div>
      <Skeleton className="mb-8 h-11 w-full max-w-xl rounded-md" />
      <PetitionGridSkeleton count={6} />
    </div>
  );
}
