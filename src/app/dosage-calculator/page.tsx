import { DosageCalculatorShell } from "@/features/dosage-calculator";
import { PaidFeatureGate } from "@/features/billing";

export default function DosageCalculatorPage() {
  return (
    <PaidFeatureGate feature="dosage_calculator">
      <DosageCalculatorShell />
    </PaidFeatureGate>
  );
}
