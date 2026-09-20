"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Link as LinkIcon, PenToolIcon, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CategoryBadge } from "@/lib/category-colors";
import { PetitionStatusChip } from "@/lib/petition-status";
import { readPetitionPreview, type PetitionPreview } from "@/lib/petition-preview";
import { PETITION_THRESHOLD, PETITION_TIERS } from "@/lib/constants";
import { PetitionStatus } from "@/types/petition";

/**
 * Shown the instant a petition link is clicked, while the server renders the
 * real page.
 *
 * Every wrapper, class and spacing here is copied from PetitionPageClient —
 * the outer split, the `lg:w-80 lg:border-l` sidebar column, the `py-8` on
 * the body, the `h-6` copy-link button, the `font-mono uppercase` dl labels.
 * That is what stops the page shifting when the real content replaces it:
 * the skeleton is the page, minus the parts only the server knows.
 *
 * Whatever the list already knew (title, category, author, signatures, tier,
 * dates) is painted as real text. Only the body, the timeline entries and
 * the action button are placeholders.
 */
export default function PetitionLoading() {
  const params = useParams<{ id: string }>();
  const [preview, setPreview] = useState<PetitionPreview | null>(null);

  useEffect(() => {
    const id = Number(params?.id);
    if (Number.isInteger(id)) setPreview(readPetitionPreview(id));
  }, [params?.id]);

  const target = preview?.targetSignatures || PETITION_THRESHOLD;
  let progress = preview ? Math.min((preview.signatures / target) * 100, 100) : 0;
  if (preview && preview.signatures > 0 && progress < 5) progress = 5;
  const expired = preview ? new Date(preview.expires) < new Date() : false;
  const met = preview ? preview.signatures >= target : false;

  return (
    <div className="min-h-screen bg-background" aria-busy="true">
      <div className="mx-auto">
        <div className="flex flex-col lg:flex-row lg:justify-center lg:gap-4 min-h-screen">
          <div className="flex-1 p-6 lg:p-8 lg:pr-12 max-w-5xl">
            <Button
              variant="link"
              className="!px-0 mb-4 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              aria-hidden
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {expired && preview?.status === PetitionStatus.Published && (
              <Alert
                variant="destructive"
                className="w-full font-bold mb-6 px-0 rounded-none border-0 border-b"
              >
                <AlertDescription className="text-xs md:text-base">
                  This petition has expired and is no longer accepting
                  signatures.
                </AlertDescription>
              </Alert>
            )}

            <div className="mb-8 border-b pb-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {preview?.category ? (
                  <CategoryBadge name={preview.category} className="text-base" />
                ) : (
                  <Skeleton className="h-7 w-32 rounded-md" />
                )}
              </div>
              {preview ? (
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  {preview.title}
                </h1>
              ) : (
                <div className="mb-2 space-y-2">
                  <Skeleton className="h-9 w-4/5 lg:h-10" />
                  <Skeleton className="h-9 w-3/5 lg:h-10" />
                </div>
              )}
              {preview ? (
                <p className="text-muted-foreground text-lg">
                  By {preview.author}
                </p>
              ) : (
                <Skeleton className="h-7 w-40" />
              )}
            </div>

            <div className="lg:hidden mb-8">
              <div className="flex flex-col gap-4 w-full">
                <SidebarContent
                  preview={preview}
                  progress={progress}
                  target={target}
                  met={met}
                  mobile
                />
              </div>
            </div>

            {/* renderPetitionBody → renderDescription: the prose block sits
                inside `py-8`, so the placeholder lines start where text will. */}
            <div className="space-y-6">
              <section className="space-y-2">
                <div className="py-8 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <div className="h-3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-10/12" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
              </section>
            </div>
          </div>

          <div className="hidden lg:block shrink-0">
            <div className="lg:w-80 lg:border-l lg:bg-muted/10 h-full">
              <div className="flex flex-col gap-4 p-4 lg:sticky lg:top-4">
                <SidebarContent
                  preview={preview}
                  progress={progress}
                  target={target}
                  met={met}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mirrors PetitionSidebar's `content` block one element at a time. */
function SidebarContent({
  preview,
  progress,
  target,
  met,
  mobile = false,
}: {
  preview: PetitionPreview | null;
  progress: number;
  target: number;
  met: boolean;
  mobile?: boolean;
}) {
  const tier = preview
    ? PETITION_TIERS.find((entry) => entry.id === preview.tier)
    : null;
  const dateOpts: Intl.DateTimeFormatOptions = {
    weekday: mobile ? "short" : "long",
    year: "numeric",
    month: mobile ? "short" : "long",
    day: "numeric",
  };

  return (
    <div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
          <div className="flex items-center gap-1">
            {mobile && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs gap-2"
                disabled
              >
                <Share2 className="h-3 w-3" />
                Share
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs gap-2"
              disabled
            >
              <LinkIcon className="h-3 w-3" />
              Copy link
            </Button>
          </div>
        </div>
        {preview ? (
          <PetitionStatusChip status={preview.status} />
        ) : (
          <Skeleton className="h-8 w-28 rounded-md" />
        )}
      </div>

      {(!preview || preview.tier > 0) && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2 mt-4">
            Tier
          </h4>
          {tier ? (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {tier.name}
            </Badge>
          ) : (
            <Skeleton className="h-7 w-44 rounded-md" />
          )}
        </div>
      )}

      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2 mt-4">
          Signatures
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            {preview ? (
              <>
                <span className="font-bold">{preview.signatures}</span>
                <span className="text-muted-foreground">of {target} needed</span>
              </>
            ) : (
              <>
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-5 w-24" />
              </>
            )}
          </div>
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full ${met ? "bg-green-500" : "bg-orange-500"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {!mobile && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2 mt-4">
            Timeline
          </h4>
          <div className="space-y-1">
            <div className="flex w-full items-center justify-between py-1 text-sm">
              <div className="flex items-center gap-2">
                <PenToolIcon className="h-4 w-4 text-muted-foreground" />
                <span>Original Petition</span>
              </div>
              {preview ? (
                <span className="text-xs uppercase text-muted-foreground font-mono">
                  {new Date(preview.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              ) : (
                <Skeleton className="h-3.5 w-20" />
              )}
            </div>
          </div>
        </div>
      )}

      <Separator className={`mt-4 ${mobile ? "hidden" : ""}`} />

      <dl className={`text-sm mt-4 ${mobile ? "grid grid-cols-2 gap-4" : "space-y-4"}`}>
        <div>
          <dt className="text-xs font-mono uppercase text-muted-foreground mb-1">
            Author
          </dt>
          <dd className="font-medium">
            {preview ? preview.author : <Skeleton className="h-5 w-32" />}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-mono uppercase text-muted-foreground mb-1">
            Created
          </dt>
          <dd>
            {preview ? (
              new Date(preview.created_at).toLocaleDateString(undefined, dateOpts)
            ) : (
              <Skeleton className="h-5 w-40" />
            )}
          </dd>
        </div>
        <div className={mobile ? "col-span-2" : ""}>
          <dt className="text-xs font-mono uppercase text-muted-foreground mb-1">
            Expires
          </dt>
          <dd>
            {preview ? (
              new Date(preview.expires).toLocaleDateString(undefined, {
                ...dateOpts,
                month: "short",
              })
            ) : (
              <Skeleton className="h-5 w-40" />
            )}
          </dd>
        </div>
      </dl>

      <div className={`mt-auto ${mobile ? "pt-4" : "pt-6"}`}>
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  );
}
