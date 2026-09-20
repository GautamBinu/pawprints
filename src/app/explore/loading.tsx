import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PetitionGridSkeleton } from "@/components/PetitionCard/PetitionGridSkeleton";

export default function ExploreLoading() {
  return (
    <div
      className="flex w-full flex-col bg-background px-4 py-10 text-foreground sm:px-8 lg:px-20"
      aria-busy="true"
    >
      <Skeleton className="h-10 w-56" />
      <Skeleton className="mt-2 h-5 w-80 max-w-full" />
      <div className="mt-8 flex w-full flex-col gap-4">
        <Skeleton className="h-11 w-full max-w-2xl rounded-md" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-28 rounded-full" />
          ))}
        </div>
        <PetitionGridSkeleton count={9} className="mt-4" />
      </div>
    </div>
  );
}
