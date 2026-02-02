"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "pawprints_visited_petitions";

export function useVisitedPetitions() {
  const [visitedIds, setVisitedIds] = useState<Set<number>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const ids = JSON.parse(stored);
        if (Array.isArray(ids)) {
          setVisitedIds(new Set(ids));
        }
      }
    } catch (e) {
      console.error("Failed to load visited petitions", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const markVisited = useCallback((id: number) => {
    setVisitedIds((prev) => {
      if (prev.has(id)) return prev;

      const next = new Set(prev);
      next.add(id);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error("Failed to save visited petition", e);
      }

      return next;
    });
  }, []);

  const isVisited = useCallback(
    (id: number) => {
      return visitedIds.has(id);
    },
    [visitedIds],
  );

  return { visitedIds, markVisited, isVisited, isLoaded };
}
