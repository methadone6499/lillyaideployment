"use client";
import { useCallback, useSyncExternalStore } from "react";
const currentSecond = () => Math.floor(Date.now() / 1000);
const serverSecond = () => 0;
export function useRetryCooldown(retryAt: number) {
  const subscribe = useCallback((notify: () => void) => {
    if (!retryAt || retryAt <= Date.now())
      return () => { };
    const timer = window.setInterval(() => {
      notify();
      if (Date.now() >= retryAt)
        window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [retryAt]);
  const now = useSyncExternalStore(subscribe, currentSecond, serverSecond);
  return Math.max(0, Math.ceil(retryAt / 1000) - now);
}
