"use client";

import { useEffect, useState } from "react";

/** Current time for countdowns, refreshed on an interval while one is shown. */
export function useNowMs(intervalMs: number | false): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!intervalMs) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [intervalMs]);

  return nowMs;
}
