"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  QUALIFIER_KEYS,
  parseSearchQuery,
  quoteIfNeeded,
  type QualifierKey,
} from "@/lib/petition-search";
import {
  PETITION_STATE_LIST,
  PetitionStateIcon,
  getPetitionState,
  statusFromStateKey,
} from "@/lib/petition-status";
import { PETITION_CATEGORIES } from "@/lib/constants";
import { getCategoryStyle } from "@/lib/category-colors";

interface PetitionSearchProps {
  value: string;
  onChange: (value: string) => void;
  /** Author names in the current list, for `author:` suggestions. */
  authors: string[];
}

interface Suggestion {
  /** What gets inserted. For a key, `state:`; for a value, the value. */
  insert: string;
  label: string;
  hint?: string;
  key?: QualifierKey;
  icon?: React.ReactNode;
}

const KEY_HINTS: Record<QualifierKey, string> = {
  state: "Review state",
  category: "Category",
  author: "Who opened it",
};

/**
 * The query is still one string (`state:pending category:"Housing" bikes`),
 * because that is what the URL and the sidebar filters already speak. This
 * component is a different way of editing it: each qualifier is a chip that
 * can be backspaced or dismissed, and typing `state:` opens a list of the
 * values that exist. Free text stays free text.
 *
 * A half-typed qualifier (`category:Hou`) is never committed to the query —
 * it lives in the draft until picked or completed — so the list does not
 * flash empty while someone is still choosing.
 */
export function PetitionSearch({ value, onChange, authors }: PetitionSearchProps) {
  const parsed = useMemo(() => parseSearchQuery(value), [value]);
  const chips = useMemo(
    () =>
      QUALIFIER_KEYS.flatMap((key) =>
        parsed.qualifiers[key].map((chipValue) => ({ key, value: chipValue })),
      ),
    [parsed],
  );

  const [draft, setDraft] = useState(parsed.text);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // When the query changes from outside (sidebar filter, URL restore), pull
  // the free-text part back into the draft — but not while the user is
  // mid-qualifier, which the outside world never sees.
  useEffect(() => {
    if (!/^[a-z]+:/i.test(draft)) setDraft(parsed.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed.text]);

  const serialize = (
    nextChips: { key: QualifierKey; value: string }[],
    text: string,
  ) =>
    [
      ...nextChips.map((chip) => `${chip.key}:${quoteIfNeeded(chip.value)}`),
      text.trim(),
    ]
      .filter(Boolean)
      .join(" ");

  const commitText = (text: string) => {
    // A partial qualifier is not a search term. Keep the committed query as
    // the chips plus whatever plain text preceded it.
    const partial = /^([a-z]+):(.*)$/i.exec(text.trim());
    onChange(serialize(chips, partial ? "" : text));
  };

  const addChip = (key: QualifierKey, chipValue: string) => {
    const exists = chips.some(
      (chip) => chip.key === key && chip.value.toLowerCase() === chipValue.toLowerCase(),
    );
    const next = exists ? chips : [...chips, { key, value: chipValue }];
    onChange(serialize(next, ""));
    setDraft("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeChip = (index: number) => {
    const next = chips.filter((_, i) => i !== index);
    onChange(serialize(next, draft));
    inputRef.current?.focus();
  };

  // ------------------------------------------------------------ suggestions
  const suggestions = useMemo<Suggestion[]>(() => {
    const trimmed = draft.trim();
    const match = /^([a-z]+):(.*)$/i.exec(trimmed);

    if (match) {
      const key = match[1].toLowerCase() as QualifierKey;
      const partial = match[2].replace(/^"|"$/g, "").toLowerCase();
      if (!QUALIFIER_KEYS.includes(key)) return [];

      const taken = new Set(parsed.qualifiers[key].map((entry) => entry.toLowerCase()));
      const filter = (candidates: Suggestion[]) =>
        candidates.filter(
          (candidate) =>
            !taken.has(candidate.insert.toLowerCase()) &&
            (candidate.insert.toLowerCase().includes(partial) ||
              candidate.label.toLowerCase().includes(partial)),
        );

      if (key === "state") {
        return filter(
          PETITION_STATE_LIST.map(({ status, meta }) => ({
            insert: meta.key,
            label: meta.label,
            key,
            icon: <PetitionStateIcon status={status} className="h-3.5 w-3.5" />,
          })),
        );
      }
      if (key === "category") {
        return filter(
          PETITION_CATEGORIES.map((name) => ({
            insert: name,
            label: name,
            key,
            icon: (
              <span
                className={cn("h-2.5 w-2.5 rounded-full", getCategoryStyle(name).swatch)}
                aria-hidden
              />
            ),
          })),
        );
      }
      return filter(authors.map((name) => ({ insert: name, label: name, key })));
    }

    // No colon yet: offer the keys, narrowed by whatever has been typed.
    const lowered = trimmed.toLowerCase();
    return QUALIFIER_KEYS.filter((key) => key.startsWith(lowered)).map((key) => ({
      insert: `${key}:`,
      label: `${key}:`,
      hint: KEY_HINTS[key],
    }));
  }, [draft, parsed, authors]);

  useEffect(() => setHighlight(0), [suggestions.length, draft]);

  const pick = (suggestion: Suggestion) => {
    if (suggestion.key) {
      addChip(suggestion.key, suggestion.insert);
    } else {
      setDraft(suggestion.insert);
      setOpen(true);
      inputRef.current?.focus();
    }
  };

  // ------------------------------------------------------------- keyboard
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && draft === "" && chips.length > 0) {
      event.preventDefault();
      removeChip(chips.length - 1);
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || suggestions.length === 0) {
      if (event.key === "Enter") {
        // A complete `key:value` typed by hand becomes a chip.
        const match = /^([a-z]+):(.+)$/i.exec(draft.trim());
        if (match && QUALIFIER_KEYS.includes(match[1].toLowerCase() as QualifierKey)) {
          event.preventDefault();
          addChip(
            match[1].toLowerCase() as QualifierKey,
            match[2].replace(/^"|"$/g, ""),
          );
        }
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((index) => (index - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      pick(suggestions[highlight]);
    }
  };

  // Close when focus leaves the whole control, not just the input.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const showList = open && suggestions.length > 0;

  return (
    <div ref={rootRef} className="relative">
      <div
        className="flex min-h-11 w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-background py-1.5 pl-9 pr-9 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
        onClick={() => inputRef.current?.focus()}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        {chips.map((chip, index) => (
          <QualifierChip
            key={`${chip.key}:${chip.value}`}
            qualifierKey={chip.key}
            value={chip.value}
            onRemove={() => removeChip(index)}
          />
        ))}

        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setOpen(true);
            commitText(event.target.value);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={chips.length ? "" : "Search, or type state: / category: / author:"}
          aria-label="Search petitions"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          role="combobox"
          spellCheck={false}
          autoComplete="off"
          className="min-w-[8rem] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
        />

        {(chips.length > 0 || draft) && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={(event) => {
              event.stopPropagation();
              setDraft("");
              onChange("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-md border bg-popover p-1 shadow-md"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.key ?? "key"}:${suggestion.insert}`}
              role="option"
              aria-selected={index === highlight}
              onMouseEnter={() => setHighlight(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                pick(suggestion);
              }}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                index === highlight ? "bg-accent text-accent-foreground" : "",
              )}
            >
              {suggestion.icon}
              <span className={cn(!suggestion.key && "font-mono")}>
                {suggestion.label}
              </span>
              {suggestion.hint && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {suggestion.hint}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * A qualifier as a chip. State chips borrow the status colours, category
 * chips the category colours, so the search bar reads the same as the list.
 */
function QualifierChip({
  qualifierKey,
  value,
  onRemove,
}: {
  qualifierKey: QualifierKey;
  value: string;
  onRemove: () => void;
}) {
  let tint = "bg-muted text-foreground border-transparent";
  let icon: React.ReactNode = null;
  let label = value;

  if (qualifierKey === "state") {
    const status = statusFromStateKey(value);
    if (status !== null) {
      const meta = getPetitionState(status);
      tint = cn(meta.chipClassName, "border-transparent");
      icon = <PetitionStateIcon status={status} className="h-3 w-3" />;
      label = meta.label;
    }
  } else if (qualifierKey === "category") {
    tint = getCategoryStyle(value).chip;
  }

  return (
    <span
      className={cn(
        "inline-flex h-7 max-w-full items-center gap-1 rounded-md border pl-2 pr-1 text-xs",
        tint,
      )}
    >
      <span className="opacity-60">{qualifierKey}:</span>
      {icon}
      <span className="truncate font-medium">{label}</span>
      <button
        type="button"
        aria-label={`Remove ${qualifierKey} ${label}`}
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        className="ml-0.5 rounded-sm p-0.5 opacity-60 hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export default PetitionSearch;
