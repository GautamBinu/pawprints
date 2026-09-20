"use client";

import React from "react";
import { Check } from "lucide-react";
import { Petition, PetitionStatus } from "@/types/petition";
import { evaluateReview } from "@/lib/review-stages";
import { cn } from "@/lib/utils";

/**
 * Where a pending petition is in review, at a glance.
 *
 * One pip per stage, left to right, and a short phrase for the live one.
 * Deliberately terse: the row already carries a title, a category, a byline
 * and a signature meter. A reviewer scanning the list needs "SG done, staff
 * next" — the names and counts are on the detail page.
 */
export function ReviewStagePips({ petition }: { petition: Petition }) {
  if (petition.status !== PetitionStatus.NeedsReview) return null;

  const progress = evaluateReview(
    petition.review_stage ?? 0,
    petition.reviews ?? [],
    petition.assignments ?? [],
  );
  const current = progress.current;

  const phrase = !current
    ? "Review complete"
    : current.blocked
      ? `Changes requested at ${current.stage.name}`
      : current.needsAssignment
        ? `${current.stage.name} — nobody assigned`
        : `Awaiting ${current.stage.name}`;

  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={progress.stages
        .map(
          (stage) =>
            `${stage.stage.name}: ${
              stage.status === "complete"
                ? "approved"
                : stage.status === "current"
                  ? `${stage.approvalCount} of ${stage.stage.minApprovals} approved`
                  : "not started"
            }`,
        )
        .join(" · ")}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        {progress.stages.map((stage) => (
          <span
            key={stage.stage.key}
            className={cn(
              "flex h-3.5 w-3.5 items-center justify-center rounded-full border text-[9px]",
              stage.status === "complete" &&
                "border-emerald-600 bg-emerald-600 text-white",
              stage.status === "current" &&
                (stage.blocked
                  ? "border-destructive bg-destructive/15"
                  : "border-amber-500 bg-amber-500/20"),
              stage.status === "upcoming" && "border-muted-foreground/30",
            )}
          >
            {stage.status === "complete" && <Check className="h-2.5 w-2.5" />}
          </span>
        ))}
      </span>
      <span
        className={cn(
          "text-xs",
          current?.blocked
            ? "text-destructive"
            : current?.needsAssignment
              ? "text-amber-700 dark:text-amber-400"
              : "text-muted-foreground",
        )}
      >
        {phrase}
      </span>
    </span>
  );
}

export default ReviewStagePips;
