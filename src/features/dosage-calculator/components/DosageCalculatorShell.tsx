import { AppHeader } from "@/components/shared/AppHeader";
import { DashboardHeaderActions } from "@/features/dashboard";
import { PharmaCalculatorWorkspace } from "./PharmaCalculatorWorkspace";
import styles from "./PharmaCalculator.module.css";

export function DosageCalculatorShell() {
  return (
    <div className="flex min-h-screen flex-col bg-base-black font-[family-name:var(--font-inter)] text-text-body">
      <AppHeader actions={<DashboardHeaderActions />} />

      <main className="mx-auto w-full max-w-[var(--layout-max-width)] flex-1 px-4 pb-12 sm:px-6 lg:px-12 lg:pb-16">
        <div className={styles.calculatorFrame} data-visual-scope="calculator">
          <section className="mt-8 py-3 lg:mt-10 lg:py-4">
            <h1 className="text-[30px] font-medium leading-tight tracking-[-0.025em] text-text-heading lg:text-[38px]">
              Budget Impact
            </h1>
            <p className="mt-3 max-w-[70ch] text-[14px] leading-6 text-text-body">
              Calculate dosing, annual treatment costs, programme comparisons,
              and multi-year budget impact analysis with validated API results.
            </p>
          </section>

          <PharmaCalculatorWorkspace />
        </div>
      </main>
    </div>
  );
}
