"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { PetitionStatusChip } from "@/lib/petition-status";
import { readPetitionPreview, type PetitionPreview } from "@/lib/petition-preview";

/**
 * Instant shell for the review page. Same reasoning as the public one: the
 * body has to wait for Safe Browsing, the title does not. Mirrors
 * PetitionDetail's layout — header, then timeline left and sidebar right.
 */
export default function ReviewPetitionLoading() {
  const params = useParams<{ id: string }>();
  const [preview, setPreview] = useState<PetitionPreview | null>(null);

  useEffect(() => {
    const id = Number(params?.id);
    if (Number.isInteger(id)) setPreview(readPetitionPreview(id));
  }, [params?.id]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8" aria-busy="true">
      <Link
        href="/review"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to petitions
      </Link>

      <header className="mt-3">
        {preview ? (
          <h1 className="text-2xl font-bold break-words sm:text-3xl">
            {preview.title}{" "}
            <span className="font-normal text-muted-foreground">
              #{preview.id}
            </span>
          </h1>
        ) : (
          <div className="space-y-2">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-9 w-1/3" />
          </div>
        )}
        <div className="mt-3">
          {preview ? (
            <PetitionStatusChip status={preview.status} />
          ) : (
            <Skeleton className="h-8 w-32 rounded-full" />
          )}
        </div>
      </header>

      <Separator className="my-5" />

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          <ol className="relative space-y-4 pl-10">
            {/* Opening card */}
            <li className="relative">
              <span className="absolute -left-10 top-0 h-7 w-7 rounded-full border bg-background" />
              <div className="overflow-hidden rounded-lg border">
                <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
                  {preview ? (
                    <span className="text-sm">
                      <span className="font-semibold">{preview.author}</span>{" "}
                      <span className="text-muted-foreground">opened this</span>
                    </span>
                  ) : (
                    <Skeleton className="h-4 w-48" />
                  )}
                  <Skeleton className="h-3 w-36" />
                </div>
                <div className="space-y-3 px-4 py-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </li>
            {/* Action box */}
            <li className="relative">
              <span className="absolute -left-10 top-0 h-7 w-7 rounded-full border bg-background" />
              <div className="overflow-hidden rounded-lg border">
                <div className="flex items-start gap-3 px-4 py-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-56" />
                    <Skeleton className="h-4 w-80 max-w-full" />
                  </div>
                </div>
                <div className="divide-y border-t">
                  <div className="px-4 py-3"><Skeleton className="h-10 w-full" /></div>
                  <div className="px-4 py-3"><Skeleton className="h-10 w-full" /></div>
                </div>
                <div className="flex gap-2 border-t bg-muted/40 px-4 py-3">
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-9 w-40" />
                </div>
              </div>
            </li>
          </ol>
        </div>

        <aside className="w-full lg:w-72 lg:shrink-0">
          {["Assignees", "Category", "Tier", "Signatures", "Author", "Dates"].map(
            (title, index) => (
              <div key={title} className="border-b py-3 first:pt-2 last:border-0">
                <p className="text-xs font-semibold text-muted-foreground">{title}</p>
                <div className="mt-1.5">
                  {title === "Signatures" && preview ? (
                    <span className="text-sm tabular-nums">
                      {preview.signatures} of {preview.targetSignatures}
                    </span>
                  ) : title === "Author" && preview ? (
                    <span className="text-sm">{preview.author}</span>
                  ) : (
                    <Skeleton className={`h-4 ${index % 2 ? "w-32" : "w-44"}`} />
                  )}
                </div>
              </div>
            ),
          )}
        </aside>
      </div>
    </div>
  );
}
