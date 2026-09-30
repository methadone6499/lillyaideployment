"use client";

import { useCallback, useEffect, useState } from "react";

const DEFAULT_COOLDOWN_SECONDS = 60;

export function useResendCooldown(
  cooldownSeconds = DEFAULT_COOLDOWN_SECONDS,
): {
  secondsRemaining: number;
  isCoolingDown: boolean;
  startCooldown: (seconds?: number) => void;
} {
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [secondsRemaining]);

  const startCooldown = useCallback(
    (seconds?: number) => {
      setSecondsRemaining(Math.max(0, Math.ceil(seconds ?? cooldownSeconds)));
    },
    [cooldownSeconds],
  );

  return {
    secondsRemaining,
    isCoolingDown: secondsRemaining > 0,
    startCooldown,
  };
}
