"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type ScrollCompensation = {
  element: HTMLDivElement;
  topBefore: number;
};

export type UseSingleExpandedSectionOptions = {
  /** Expand the first available section once items are present. */
  defaultExpandFirst?: boolean;
  firstItemId?: string | null;
};

export function useSingleExpandedSection({
  defaultExpandFirst = false,
  firstItemId = null,
}: UseSingleExpandedSectionOptions = {}) {
  const [expandedId, setExpandedId] = useState<string | null>(() =>
    defaultExpandFirst ? firstItemId : null,
  );
  const appliedDefaultRef = useRef(!defaultExpandFirst || firstItemId != null);
  const scrollCompensationRef = useRef<ScrollCompensation | null>(null);

  useEffect(() => {
    if (appliedDefaultRef.current || !defaultExpandFirst || !firstItemId) {
      return;
    }

    setExpandedId(firstItemId);
    appliedDefaultRef.current = true;
  }, [defaultExpandFirst, firstItemId]);

  useLayoutEffect(() => {
    const pending = scrollCompensationRef.current;
    if (!pending) {
      return;
    }

    const { element, topBefore } = pending;
    const topAfter = element.getBoundingClientRect().top;
    const delta = topAfter - topBefore;

    if (Math.abs(delta) > 0.5) {
      window.scrollBy({ top: delta, behavior: "instant" });
    }

    scrollCompensationRef.current = null;
  }, [expandedId]);

  const expandSection = useCallback(
    (id: string, element: HTMLDivElement) => {
      const isSwitching = expandedId !== null && expandedId !== id;
      if (isSwitching && element.isConnected) {
        scrollCompensationRef.current = {
          element,
          topBefore: element.getBoundingClientRect().top,
        };
      }

      setExpandedId(id);
    },
    [expandedId],
  );

  const toggleSection = useCallback(
    (id: string, element: HTMLDivElement) => {
      const isSwitching = expandedId !== null && expandedId !== id;
      if (isSwitching && element.isConnected) {
        scrollCompensationRef.current = {
          element,
          topBefore: element.getBoundingClientRect().top,
        };
      }

      const nextId = expandedId === id ? null : id;
      setExpandedId(nextId);
      return nextId;
    },
    [expandedId],
  );

  return {
    expandedId,
    setExpandedId,
    expandSection,
    toggleSection,
  };
}
