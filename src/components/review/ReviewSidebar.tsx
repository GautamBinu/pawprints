"use client";

import React from "react";
import { Inbox, UserCheck, Clock, CircleDot, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { REVIEW_STAGES } from "@/lib/review-stages";
import { PETITION_STATE_LIST, PetitionStateIcon } from "@/lib/petition-status";
import { PetitionStatus } from "@/types/petition";

/**
 * `stage:<key>` views are generated from REVIEW_STAGES, so a stage added to
 * the pipeline gets a sidebar entry without anyone touching this file.
 */
export type ReviewView = "all" | "assigned" | "recent" | `stage:${string}`;

interface ViewDefinition {
  key: ReviewView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_VIEWS: ViewDefinition[] = [
  { key: "all", label: "Petitions", icon: Inbox },
  { key: "assigned", label: "Assigned to me", icon: UserCheck },
  { key: "recent", label: "Recent activity", icon: Clock },
];

// The section heading carries the "awaiting", so the rows are just names.
const STAGE_VIEWS: ViewDefinition[] = REVIEW_STAGES.map((stage) => ({
  key: `stage:${stage.key}`,
  label: stage.name,
  icon: CircleDot,
}));

export const REVIEW_VIEWS: ViewDefinition[] = [...PRIMARY_VIEWS, ...STAGE_VIEWS];

export function isReviewView(value: string | null | undefined): value is ReviewView {
  return !!value && REVIEW_VIEWS.some((view) => view.key === value);
}

/** The stage index a `stage:` view refers to, or null for any other view. */
export function stageIndexForView(view: ReviewView): number | null {
  if (!view.startsWith("stage:")) return null;
  const key = view.slice("stage:".length);
  const index = REVIEW_STAGES.findIndex((stage) => stage.key === key);
  return index === -1 ? null : index;
}

interface ReviewSidebarProps {
  view: ReviewView;
  onViewChange: (view: ReviewView) => void;
  counts: Partial<Record<ReviewView, number>>;
  /** Per-status counts within the current view, for the state filters. */
  stateCounts: Partial<Record<PetitionStatus, number>>;
  /** State keys currently applied as `state:` qualifiers. */
  activeStates: string[];
  onToggleState: (key: string) => void;
}

/**
 * Vertical nav on desktop, a horizontally scrolling chip row on mobile — the
 * same destinations either way, so the mobile layout does not hide a view
 * behind a menu.
 */
export function ReviewSidebar({
  view,
  onViewChange,
  counts,
  stateCounts,
  activeStates,
  onToggleState,
}: ReviewSidebarProps) {
  const viewRow = ({ key, label, icon: Icon }: ViewDefinition) => {
    const active = view === key;
    const count = counts[key];
    return (
      <button
        key={key}
        type="button"
        onClick={() => onViewChange(key)}
        aria-current={active ? "page" : undefined}
        className={cn(ROW, active ? ROW_ACTIVE : ROW_IDLE)}
      >
        {active && <Pill />}
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        {count !== undefined && <Count value={count} />}
      </button>
    );
  };

  return (
    <div className="flex shrink-0 flex-col gap-6 lg:w-56">
      <nav aria-label="Review views" className={LIST}>
        {PRIMARY_VIEWS.map(viewRow)}
      </nav>

      <Section title="Awaiting review from">
        <nav aria-label="Review stages" className={LIST}>
          {STAGE_VIEWS.map(viewRow)}
        </nav>
      </Section>

      {/* State filters write `state:` qualifiers into the same query the
          search box edits, so a chip appears there when one is picked here
          and vice versa. An active row grows a dismiss control on hover, the
          way a selected combobox chip does. */}
      <Section title="State">
        <div role="group" aria-label="Filter by state" className={LIST}>
          {PETITION_STATE_LIST.map(({ status, meta }) => {
            const active = activeStates.includes(meta.key);
            return (
              <button
                key={meta.key}
                type="button"
                onClick={() => onToggleState(meta.key)}
                aria-pressed={active}
                className={cn("group", ROW, active ? ROW_ACTIVE : ROW_IDLE)}
              >
                <PetitionStateIcon
                  status={status}
                  className={cn("h-4 w-4 shrink-0", !active && "opacity-70")}
                />
                <span className="flex-1 text-left">{meta.label}</span>
                {active ? (
                  <span
                    aria-hidden
                    className="rounded-sm p-0.5 text-muted-foreground group-hover:bg-black/10 group-hover:text-foreground dark:group-hover:bg-white/10"
                  >
                    <X className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <Count value={stateCounts[status] ?? 0} />
                )}
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

/** One row style for every list, so icons, labels and counts line up across sections. */
const ROW =
  "relative flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors lg:w-full";
const ROW_ACTIVE = "bg-muted font-semibold text-foreground";
const ROW_IDLE = "text-muted-foreground hover:bg-muted/60 hover:text-foreground";
/** Horizontal chip strip on mobile, vertical stack on desktop. */
const LIST =
  "-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      {/* Same `px-3` as the rows, so the heading's left edge sits on the icons'. */}
      <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

/** A short pill rather than a full-height rule: marks the row without a line the length of the nav. */
function Pill() {
  return (
    <span
      aria-hidden
      className="absolute left-0 top-1/2 hidden h-4 w-1 -translate-y-1/2 rounded-full bg-[#F76902] lg:block"
    />
  );
}

function Count({ value }: { value: number }) {
  return (
    <span className="rounded-full bg-muted-foreground/15 px-1.5 text-xs tabular-nums">
      {value}
    </span>
  );
}

export default ReviewSidebar;
