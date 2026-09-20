/**
 * Hands what a list already knows about a petition to the page it links to.
 *
 * The full petition page waits on Safe Browsing checks over every link in the
 * body before it can render, which is the right thing to do with the content
 * and the wrong thing to make someone stare at a blank screen for. But the
 * title, category, author and signature count were on screen a moment ago in
 * the card they clicked. Stashing them lets the loading state show real words
 * instead of grey bars, and only the body has to wait.
 *
 * sessionStorage on purpose: it survives the navigation, dies with the tab,
 * and cannot be mistaken for a source of truth by anything else.
 */
import type { Petition } from "@/types/petition";

const PREFIX = "pawprints:petition-preview:";

export interface PetitionPreview {
  id: number;
  title: string;
  author: string;
  category: string | null;
  status: number;
  signatures: number;
  targetSignatures: number;
  expires: string;
}

export function toPetitionPreview(petition: Petition): PetitionPreview {
  return {
    id: petition.id,
    title: petition.title,
    author: petition.author,
    category: petition.tags[0]?.name ?? null,
    status: petition.status,
    signatures: petition.signatures,
    targetSignatures: petition.targetSignatures,
    expires: petition.expires,
  };
}

export function rememberPetitionPreview(petition: Petition) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      PREFIX + petition.id,
      JSON.stringify(toPetitionPreview(petition)),
    );
  } catch {
    // Storage full or disabled — the page just loads without a preview.
  }
}

export function readPetitionPreview(id: number): PetitionPreview | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PREFIX + id);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PetitionPreview;
    return parsed && parsed.id === id ? parsed : null;
  } catch {
    return null;
  }
}
