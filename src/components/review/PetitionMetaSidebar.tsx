"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, Loader2, Pencil, Users } from "lucide-react";
import { toast } from "sonner";
import { Petition } from "@/types/petition";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setPetitionCategory } from "@/app/review-actions";
import { PETITION_CATEGORIES } from "@/lib/constants";
import { PETITION_THRESHOLD, PETITION_TIERS } from "@/lib/constants";
import { formatDate, formatRelative } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { AssigneesPanel } from "./AssigneesPanel";
import { CategoryBadge, getCategoryStyle } from "@/lib/category-colors";

function Section({
  title,
  children,
  note,
}: {
  title: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    // `first:pt-2` lines the opening heading up with the byline inside the
    // first timeline card, which sits behind its own `py-2` header strip.
    <div className="border-b py-3 first:pt-2 last:border-0">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold text-muted-foreground">{title}</h2>
        {note && (
          <span className="text-[11px] text-muted-foreground/70">{note}</span>
        )}
      </div>
      <div className="mt-1.5 text-sm">{children}</div>
    </div>
  );
}

/** Text-sized link rows, so they start on the same left edge as every other
 *  section's content — a padded Button would inset them by its own gutter. */
function LinkRow({
  icon: Icon,
  children,
  href,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "flex w-full items-center gap-2 py-1 text-left text-sm text-muted-foreground transition-colors hover:text-foreground";

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {children}
    </button>
  );
}

/**
 * The category, with an inline editor for those allowed to change it.
 *
 * Available after publication too: a category is only a label and a filter,
 * so correcting one on a live petition costs nothing. (Tier is different —
 * it resets the signature target — and stays locked to the review stage.)
 */
function CategoryEditor({
  petitionId,
  current,
  canEdit,
}: {
  petitionId: number;
  current: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(current ?? "");
  }, [current]);

  const save = async () => {
    if (!value || value === current) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await setPetitionCategory(petitionId, value);
      toast.success("Category updated");
      setEditing(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || "Could not update the category");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="space-y-2">
        <Select value={value} onValueChange={setValue} disabled={saving}>
          <SelectTrigger className="h-8 w-full text-sm">
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            {PETITION_CATEGORIES.map((entry) => (
              <SelectItem key={entry} value={entry}>
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      getCategoryStyle(entry).swatch,
                    )}
                    aria-hidden
                  />
                  {entry}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1.5">
          <Button size="sm" className="h-7" onClick={save} disabled={saving || !value}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7"
            disabled={saving}
            onClick={() => {
              setValue(current ?? "");
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2">
      {current ? (
        <CategoryBadge name={current} className="rounded-full" />
      ) : (
        <span className="text-muted-foreground">Not set</span>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Change category"
          className="-m-1 shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function PetitionMetaSidebar({
  petition,
  canManageReviewers = false,
  canClassify = false,
}: {
  petition: Petition;
  canManageReviewers?: boolean;
  /** May change the category — at any stage, published included. */
  canClassify?: boolean;
}) {
  const threshold = petition.targetSignatures || PETITION_THRESHOLD;
  const progress = Math.min((petition.signatures / threshold) * 100, 100);
  const tier = PETITION_TIERS.find((entry) => entry.id === petition.tier);
  const expired = new Date(petition.expires) < new Date();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/petitions/${petition.id}`,
      );
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy — copy it from the address bar instead.");
    }
  };

  return (
    <aside className="w-full lg:w-72 lg:shrink-0">
      <Section title="Assignees">
        <AssigneesPanel
          petitionId={petition.id}
          assignments={petition.assignments ?? []}
          reviews={petition.reviews ?? []}
          canManage={canManageReviewers}
        />
      </Section>

      <Section title="Category">
        <CategoryEditor
          petitionId={petition.id}
          current={petition.tags[0]?.name ?? null}
          canEdit={canClassify}
        />
      </Section>

      <Section title="Tier">
        {tier ? (
          <div>
            <div>{tier.description}</div>
            <div className="text-xs text-muted-foreground">
              Tier {tier.id} · {tier.threshold} signatures
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">Not set</span>
        )}
      </Section>

      <Section title="Signatures">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="tabular-nums">
            {petition.signatures} of {threshold}
          </span>
        </div>
        <Progress
          value={progress}
          className={cn(
            "mt-2 h-1.5",
            progress >= 100 && "[&>div]:bg-emerald-500",
          )}
        />
        {petition.last_signed && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            Last signed {formatRelative(petition.last_signed)}
          </p>
        )}
      </Section>

      <Section title="Author">
        <div>{petition.author}</div>
        {petition.authorEmail && (
          <a
            href={`mailto:${petition.authorEmail}`}
            className="text-xs text-muted-foreground break-all hover:underline"
          >
            {petition.authorEmail}
          </a>
        )}
      </Section>

      <Section title="Dates">
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Created</dt>
            <dd>{formatDate(petition.created_at)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">
              {expired ? "Expired" : "Expires"}
            </dt>
            <dd className={cn(expired && "text-destructive")}>
              {formatDate(petition.expires)}
            </dd>
          </div>
        </dl>
      </Section>

      <Section title="Links">
        <div className="flex flex-col">
          <LinkRow icon={ExternalLink} href={`/petitions/${petition.id}`}>
            View public page
          </LinkRow>
          <LinkRow icon={Copy} onClick={copyLink}>
            Copy link
          </LinkRow>
        </div>
      </Section>
    </aside>
  );
}

export default PetitionMetaSidebar;
