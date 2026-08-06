"use client";

import { AppHeader } from "@/components/shared/AppHeader";
import { DashboardHeaderActions } from "@/features/dashboard";
import { useEffect, useRef } from "react";
import { useDosageCalculatorStore } from "../store/useDosageCalculatorStore";
import { DosageCalculatorForm } from "./DosageCalculatorForm";
import { DosageCalculatorResults } from "./DosageCalculatorResults";

export function DosageCalculatorShell() {
  const resultView = useDosageCalculatorStore((state) => state.resultView);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (
      resultView !== "preview" ||
      window.matchMedia("(min-width: 1280px)").matches
    ) {
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
  }, [resultView]);

  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-text-body">
      <AppHeader actions={<DashboardHeaderActions />} />

      <main className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 flex-col px-4 pb-12 sm:px-6 lg:px-12">
        <div className="mt-8 flex flex-col gap-2 lg:mt-[46px]">
          <h1 className="text-[28px] font-medium leading-tight tracking-[-0.02em] text-text-heading lg:text-[40px]">
            Clinical Dosage Calculator
          </h1>
          <p className="max-w-3xl text-input leading-5.5 text-text-body lg:text-body-lg lg:leading-7">
            Evidence-based dosing recommendations with guideline cross-reference
            and AI validation.
          </p>
        </div>

        <div className="mt-7 grid w-full max-w-[1484px] items-start gap-4 lg:mt-12 xl:grid-cols-[1.028fr_1fr]">
          <div className="min-w-0">
            <DosageCalculatorForm />
          </div>

          {resultView === "preview" ? (
            <DosageCalculatorResults headingRef={resultsHeadingRef} />
          ) : null}
        </div>
      </main>
    </div>
  );
}
