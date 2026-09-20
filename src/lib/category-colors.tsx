import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { PETITION_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * One colour per category, everywhere a category is shown.
 *
 * The old lookup in PetitionCard keyed on short names ("dining", "facilities")
 * that no category actually has — the real ones are "Dining Services /
 * Cafeteria" and "Facilities & Parking" — so everything fell through to grey
 * except Housing, the one name that happened to match. This keys on the exact
 * strings in PETITION_CATEGORIES, and the type check fails if a category is
 * added there without a colour here.
 *
 * Hue is identity, assigned in a fixed order and never derived from the
 * category's position, so adding or reordering categories does not repaint
 * the survivors. Each entry carries light and dark steps of the same hue.
 */
type Category = (typeof PETITION_CATEGORIES)[number];

interface CategoryStyle {
  /** Filled chip: soft background, strong text. */
  chip: string;
  /** A solid swatch of the same hue, for dots and rails. */
  swatch: string;
}

const STYLES: Record<Category, CategoryStyle> = {
  "Academic Affairs": {
    chip: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900",
    swatch: "bg-indigo-500",
  },
  "Student Services": {
    chip: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900",
    swatch: "bg-sky-500",
  },
  "Campus Life (SG, Clubs, & Organizations)": {
    chip: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 dark:border-fuchsia-900",
    swatch: "bg-fuchsia-500",
  },
  "Facilities & Parking": {
    chip: "bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
    swatch: "bg-slate-500",
  },
  Technology: {
    chip: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-900",
    swatch: "bg-cyan-500",
  },
  Housing: {
    chip: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-900",
    swatch: "bg-orange-500",
  },
  "Dining Services / Cafeteria": {
    chip: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900",
    swatch: "bg-amber-500",
  },
  "Commuter Transportation": {
    chip: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-900",
    swatch: "bg-teal-500",
  },
  "Health & Wellness": {
    chip: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900",
    swatch: "bg-rose-500",
  },
  "Safety & Security": {
    chip: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900",
    swatch: "bg-red-500",
  },
  "Accessibility & Inclusion": {
    chip: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-900",
    swatch: "bg-violet-500",
  },
  Sustainability: {
    chip: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-900",
    swatch: "bg-green-500",
  },
  "Financial Services": {
    chip: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900",
    swatch: "bg-emerald-500",
  },
  "Library & Learning Resources": {
    chip: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-900",
    swatch: "bg-yellow-500",
  },
  "Career Services": {
    chip: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900",
    swatch: "bg-blue-500",
  },
  Other: {
    chip: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    swatch: "bg-zinc-400",
  },
};

const FALLBACK: CategoryStyle = STYLES.Other;

/** Tolerant of legacy names and stray whitespace; unknown falls to "Other". */
export function getCategoryStyle(name: string | null | undefined): CategoryStyle {
  if (!name) return FALLBACK;
  const trimmed = name.trim();
  if (trimmed in STYLES) return STYLES[trimmed as Category];

  // Older petitions carry short names ("Housing", "Dining") that predate the
  // current list. Match on a leading word so they keep their colour.
  const lowered = trimmed.toLowerCase();
  const match = (Object.keys(STYLES) as Category[]).find((key) =>
    key.toLowerCase().startsWith(lowered),
  );
  return match ? STYLES[match] : FALLBACK;
}

export function CategoryBadge({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-normal", getCategoryStyle(name).chip, className)}
    >
      {name}
    </Badge>
  );
}
