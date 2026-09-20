"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { CategoryBadge } from "@/lib/category-colors";
import { PetitionStatusChip } from "@/lib/petition-status";
import { readPetitionPreview, type PetitionPreview } from "@/lib/petition-preview";
import { PETITION_THRESHOLD } from "@/lib/constants";

/**
 * Shown the instant a petition link is clicked, while the server renders the
 * real page.
 *
 * Before this existed there was no Suspense boundary on the route at all, so
 * the browser held the previous page until the whole petition — Safe
 * Browsing checks included — had rendered. Now navigation is immediate, and
 * whatever the list already knew is painted with real text: title, category,
 * author, signatures. Only the body and the parts that need the server stay
 * as skeletons.
 *
 * Mirrors PetitionPageClient's outer layout so nothing jumps when the real
 * content replaces it.
 */
export default function PetitionLoading() {
  const params = useParams<{ id: string }>();
  const [preview, setPreview] = useState<PetitionPreview | null>(null);

  useEffect(() => {
    const id = Number(params?.id);
    if (Number.isInteger(id)) setPreview(readPetitionPreview(id));
  }, [params?.id]);

  const target = preview?.targetSignatures || PETITION_THRESHOLD;
  const ratio = preview ? Math.min((preview.signatures / target) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-background" aria-busy="true">
      <div className="mx-auto">
        <div className="flex flex-col lg:flex-row lg:justify-center lg:gap-4 min-h-screen">
          <div className="flex-1 p-6 lg:p-8 lg:pr-12 max-w-5xl">
            <div className="mb-4 flex items-center text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </div>

            <div className="mb-8 border-b pb-4">
              <div className="mb-4 flex flex-wrap gap-2">
                {preview?.category ? (
                  <CategoryBadge name={preview.category} className="text-base" />
                ) : (
                  <Skeleton className="h-6 w-28 rounded-full" />
                )}
              </div>
              {preview ? (
                <h1 className="mb-2 text-3xl font-bold text-foreground lg:text-4xl">
                  {preview.title}
                </h1>
              ) : (
                <div className="mb-2 space-y-2">
                  <Skeleton className="h-9 w-4/5" />
                  <Skeleton className="h-9 w-3/5" />
                </div>
              )}
              {preview ? (
                <p className="text-lg text-muted-foreground">
                  By {preview.author}
                </p>
              ) : (
                <Skeleton className="h-6 w-40" />
              )}
            </div>

            {/* Mobile sidebar slot */}
            <div className="mb-8 lg:hidden">
              <SidebarSkeleton preview={preview} ratio={ratio} target={target} />
            </div>

            {/* Body: never known ahead of time, always a skeleton. */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <div className="h-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </div>

          <div className="hidden shrink-0 lg:block">
            <SidebarSkeleton preview={preview} ratio={ratio} target={target} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarSkeleton({
  preview,
  ratio,
  target,
}: {
  preview: PetitionPreview | null;
  ratio: number;
  target: number;
}) {
  return (
    <div className="flex w-full flex-col gap-4 p-4 lg:sticky lg:top-4 lg:w-80">
      <div className="rounded-lg border p-4">
        {preview ? (
          <>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-semibold tabular-nums">
                {preview.signatures} signatures
              </span>
              <span className="text-muted-foreground tabular-nums">
                {target} goal
              </span>
            </div>
            <Progress value={ratio} className="h-2" />
          </>
        ) : (
          <>
            <div className="mb-2 flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </>
        )}

        <div className="mt-4">
          {preview ? (
            <PetitionStatusChip status={preview.status} />
          ) : (
            <Skeleton className="h-8 w-28 rounded-full" />
          )}
        </div>

        <div className="mt-6 space-y-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
