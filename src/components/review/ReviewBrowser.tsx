"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, UserCheck } from "lucide-react";
import { Petition, PetitionStatus } from "@/types/petition";
import { Button } from "@/components/ui/button";
import {
  ReviewSidebar,
  isReviewView,
  stageIndexForView,
  type ReviewView,
} from "./ReviewSidebar";
import { PetitionSearch } from "./PetitionSearch";
import { PetitionList, sortPetitions, type SortKey } from "./PetitionList";
import {
  matchesQuery,
  parseSearchQuery,
  toggleQualifier,
} from "@/lib/petition-search";
import { REVIEW_STAGES, evaluateReview } from "@/lib/review-stages";
import { REVIEW_LIST_URL_KEY } from "@/lib/petition-preview";

interface ReviewBrowserProps {
  petitions: Petition[];
  /** Petitions the signed-in reviewer is assigned to or listed for. */
  assignedIds: number[];
}

const SORT_KEYS: SortKey[] = ["newest", "oldest", "signatures", "activity"];

function viewTitle(view: ReviewView): string {
  switch (view) {
    case "all":
      return "All petitions";
    case "assigned":
      return "Assigned to me";
    case "recent":
      return "Recent activity";
    default: {
      const index = stageIndexForView(view);
      return index === null
        ? "Petitions"
        : `Awaiting ${REVIEW_STAGES[index].name}`;
    }
  }
}

/**
 * Filters live in the URL (`?view=…&q=…&sort=…`), so opening a petition and
 * coming back lands on the same list, and a filtered view can be shared.
 * Written with `history.replaceState` rather than the router: the router
 * would re-fetch the page's server data on every keystroke.
 */
export function ReviewBrowser({ petitions, assignedIds }: ReviewBrowserProps) {
  const searchParams = useSearchParams();

  const [view, setView] = useState<ReviewView>(() => {
    const initial = searchParams.get("view");
    return isReviewView(initial) ? initial : "all";
  });
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [sort, setSort] = useState<SortKey>(() => {
    const initial = searchParams.get("sort") as SortKey | null;
    return initial && SORT_KEYS.includes(initial) ? initial : "newest";
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (view !== "all") params.set("view", view);
    if (query) params.set("q", query);
    if (sort !== "newest") params.set("sort", sort);
    const next = params.toString();
    const url = next ? `${window.location.pathname}?${next}` : window.location.pathname;
    if (url !== window.location.pathname + window.location.search) {
      window.history.replaceState(window.history.state, "", url);
    }
    // The detail page's "Back to petitions" link is a fresh navigation, not
    // a history pop, so it cannot see this URL on its own. Leave it where
    // that link can find it.
    try {
      window.sessionStorage.setItem(REVIEW_LIST_URL_KEY, url);
    } catch {
      // Storage unavailable — the link falls back to /review.
    }
  }, [view, query, sort]);

  const parsed = useMemo(() => parseSearchQuery(query), [query]);

  /** Which stage each pending petition is sitting at, evaluated once. */
  const currentStageOf = useCallback((petition: Petition) => {
    if (petition.status !== PetitionStatus.NeedsReview) return null;
    return evaluateReview(
      petition.review_stage ?? 0,
      petition.reviews ?? [],
      petition.assignments ?? [],
    ).currentIndex;
  }, []);

  const stageIndexById = useMemo(() => {
    const map = new Map<number, number | null>();
    for (const petition of petitions) map.set(petition.id, currentStageOf(petition));
    return map;
  }, [petitions, currentStageOf]);

  /** "Recent activity" is the triage queue: everything not yet decided on. */
  const unreviewed = useMemo(
    () =>
      petitions.filter(
        (petition) => petition.status === PetitionStatus.NeedsReview,
      ),
    [petitions],
  );

  const assigned = useMemo(() => {
    const ids = new Set(assignedIds);
    return petitions.filter((petition) => ids.has(petition.id));
  }, [petitions, assignedIds]);

  const byStage = useMemo(() => {
    const groups = new Map<number, Petition[]>();
    for (const petition of unreviewed) {
      const index = stageIndexById.get(petition.id);
      if (index === null || index === undefined) continue;
      groups.set(index, [...(groups.get(index) ?? []), petition]);
    }
    return groups;
  }, [unreviewed, stageIndexById]);

  const scope = useMemo(() => {
    if (view === "recent") return unreviewed;
    if (view === "assigned") return assigned;
    const stageIndex = stageIndexForView(view);
    if (stageIndex !== null) return byStage.get(stageIndex) ?? [];
    return petitions;
  }, [view, unreviewed, assigned, byStage, petitions]);

  const visible = useMemo(() => {
    const filtered = scope.filter((petition) => matchesQuery(petition, parsed));
    // The queue views are only useful oldest-waiting-first regardless of the
    // sort chosen for browsing, so they pin their own order.
    const queued = view === "recent" || view.startsWith("stage:");
    return sortPetitions(filtered, queued ? "oldest" : sort);
  }, [scope, parsed, sort, view]);

  const counts = useMemo(() => {
    const result: Partial<Record<ReviewView, number>> = {
      all: petitions.length,
      assigned: assigned.length,
      recent: unreviewed.length,
    };
    REVIEW_STAGES.forEach((stage, index) => {
      result[`stage:${stage.key}`] = byStage.get(index)?.length ?? 0;
    });
    return result;
  }, [petitions.length, assigned.length, unreviewed.length, byStage]);

  // Counts for the state filters, within the current view but before the
  // state qualifiers themselves are applied — otherwise picking "Published"
  // would zero every other row's count.
  const stateCounts = useMemo(() => {
    const withoutState = { ...parsed, qualifiers: { ...parsed.qualifiers, state: [] } };
    const result: Partial<Record<PetitionStatus, number>> = {};
    for (const petition of scope) {
      if (!matchesQuery(petition, withoutState)) continue;
      result[petition.status] = (result[petition.status] ?? 0) + 1;
    }
    return result;
  }, [scope, parsed]);

  const authors = useMemo(
    () => Array.from(new Set(scope.map((petition) => petition.author))).sort(),
    [scope],
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <ReviewSidebar
          view={view}
          onViewChange={setView}
          counts={counts}
          stateCounts={stateCounts}
          activeStates={parsed.qualifiers.state}
          onToggleState={(key) => setQuery(toggleQualifier(query, "state", key))}
        />

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold sm:text-2xl">{viewTitle(view)}</h1>
            <Button asChild className="bg-[#F76902] text-white hover:bg-[#d55a02]">
              <Link href="/create">
                <Plus className="mr-1.5 h-4 w-4" />
                New petition
              </Link>
            </Button>
          </div>

          {view === "assigned" && assigned.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border px-6 py-16 text-center">
              <UserCheck className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">Nothing assigned to you</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Petitions appear here once someone with the assign-reviewers
                permission puts you on one.
              </p>
            </div>
          ) : (
            <>
              <PetitionSearch value={query} onChange={setQuery} authors={authors} />

              <PetitionList
                petitions={visible}
                allPetitions={scope}
                query={query}
                parsed={parsed}
                onQueryChange={setQuery}
                sort={sort}
                onSortChange={setSort}
                emptyMessage={
                  view === "recent"
                    ? "Nothing is waiting for review right now."
                    : view === "assigned"
                      ? "None of the petitions assigned to you match this filter."
                      : view.startsWith("stage:")
                        ? `Nothing is waiting on ${viewTitle(view).replace("Awaiting ", "")} right now.`
                        : undefined
                }
              />

              <p className="text-xs text-muted-foreground">
                Filter with{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono">
                  state:
                </code>
                ,{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono">
                  category:
                </code>{" "}
                and{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono">
                  author:
                </code>
                . Values with spaces need quotes.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewBrowser;
