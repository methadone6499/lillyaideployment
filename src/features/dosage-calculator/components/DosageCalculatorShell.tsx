"use client";

import { AppHeader } from "@/components/shared/AppHeader";
import { DashboardHeaderActions } from "@/features/dashboard";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDosageCalculatorJob } from "../hooks/useDosageCalculatorJob";
import {
  isDosageCalculatorResultReady,
  type DosageCalculatorRequest,
} from "../schemas/dosageCalculatorSchemas";
import {
  createDosageIdempotencyKey,
  type DosageCalculatorSubmission,
  type DosageCalculatorSubmittedInputViewModel,
} from "../utils/mapDosageCalculatorRequest";
import { DosageCalculatorForm } from "./DosageCalculatorForm";
import { DosageCalculatorResults } from "./DosageCalculatorResults";
import type { DosageJobProgress } from "./DosageJobProgressCard";

function cloneRequestWithNewKey(
  request: DosageCalculatorRequest,
): DosageCalculatorRequest {
  return {
    ...request,
    idempotency_key: createDosageIdempotencyKey(),
  };
}

export function DosageCalculatorShell() {
  const {
    jobId,
    error,
    isEnqueueing,
    isPolling,
    isCompleted,
    start,
    reset,
    statusQuery,
    resultQuery,
  } = useDosageCalculatorJob();
  const [submittedInputs, setSubmittedInputs] =
    useState<DosageCalculatorSubmittedInputViewModel | null>(null);
  const [lastRequest, setLastRequest] =
    useState<DosageCalculatorRequest | null>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

  const status = statusQuery.data;
  const isAwaitingResult =
    isDosageCalculatorResultReady(status?.job_status) &&
    !resultQuery.isSuccess &&
    !error;
  const isStartingRun =
    submittedInputs !== null &&
    jobId === null &&
    !isCompleted &&
    !error &&
    !isPolling;
  const isInProgress =
    isEnqueueing || isPolling || isAwaitingResult || isStartingRun;

  const progress: DosageJobProgress | null = isInProgress
    ? {
        phase: status?.phase ?? "queued",
        percent: status?.progress.percent ?? 0,
        detail:
          status?.progress.detail ||
          (isEnqueueing || isStartingRun
            ? "Starting calculation…"
            : isAwaitingResult
              ? "Loading results…"
              : "Waiting for status…"),
      }
    : null;

  const showResults = submittedInputs !== null;

  useEffect(() => {
    if (!showResults || window.matchMedia("(min-width: 1280px)").matches) {
      return;
    }

    const animationFrame = requestAnimationFrame(() => {
      const resultsHeading = resultsHeadingRef.current;
      if (!resultsHeading) return;

      resultsHeading.focus({ preventScroll: true });
      resultsHeading.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [showResults]);

  const handleSubmitCalculation = useCallback(
    async (submission: DosageCalculatorSubmission) => {
      setSubmittedInputs(submission.submittedInputs);
      setLastRequest(submission.request);

      try {
        await start(submission.request);
      } catch {
        // Surfaced through job.error.
      }
    },
    [start],
  );

  const handleRetry = useCallback(async () => {
    if (!lastRequest) return;

    const nextRequest = cloneRequestWithNewKey(lastRequest);
    setLastRequest(nextRequest);

    try {
      await start(nextRequest);
    } catch {
      // Surfaced through job.error.
    }
  }, [lastRequest, start]);

  const handleStartOver = useCallback(async () => {
    setSubmittedInputs(null);
    setLastRequest(null);
    await reset();
  }, [reset]);

  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-text-body">
      <AppHeader actions={<DashboardHeaderActions />} />

      <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-4 pb-12 sm:px-6 lg:px-12">
        <div className="mt-8 flex flex-col gap-2 lg:mt-[46px]">
          <h1 className="text-[28px] font-medium leading-tight tracking-[-0.02em] text-text-heading lg:text-[40px]">
            Dosage Calculator
          </h1>
          <p className="max-w-3xl text-input leading-5.5 text-text-body lg:text-body-lg lg:leading-7">
            Label-based dosing and cost estimates from the FDA DailyMed
            label, using the schedule and unit price you provide.
          </p>
        </div>

        <div className="mt-7 grid w-full max-w-[1484px] items-start gap-4 lg:mt-12 xl:grid-cols-[1.028fr_1fr]">
          <div className="min-w-0">
            <DosageCalculatorForm
              isSubmitting={isEnqueueing}
              onSubmitCalculation={handleSubmitCalculation}
            />
          </div>

          {submittedInputs ? (
            <DosageCalculatorResults
              headingRef={resultsHeadingRef}
              progress={progress}
              isInProgress={isInProgress}
              isCompleted={isCompleted}
              result={resultQuery.data}
              error={isInProgress ? null : error}
              isRetrying={isEnqueueing}
              onRetry={() => {
                void handleRetry();
              }}
              onStartOver={() => {
                void handleStartOver();
              }}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
