"use client";

import { Button, CloseIcon, Select, Switch, TextField } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  cloneReportCalculatorDraft,
  formatReportCalculatorValidationError,
  getReportCalculatorModuleLabels,
  mapReportCalculatorDraft,
  type ReportCalculatorDraft,
  type ReportCalculatorTab,
} from "../utils/reportCalculator";

type ReportCalculatorModalProps = {
  draft: ReportCalculatorDraft;
  comparators: string[];
  onClose: () => void;
  onSave: (draft: ReportCalculatorDraft) => void;
};

const MODULE_TABS: Array<{ id: ReportCalculatorTab; label: string }> = [
  { id: "cost", label: "Cost Analysis" },
  { id: "budget", label: "Budget Impact Analysis" },
];

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getInitialTab(draft: ReportCalculatorDraft): ReportCalculatorTab {
  if (draft.dosingEnabled || draft.costAnalysisEnabled) return "cost";
  if (draft.budgetImpactEnabled) return "budget";
  return "cost";
}

function prepareDraft(
  draft: ReportCalculatorDraft,
  comparators: string[],
): ReportCalculatorDraft {
  const next = cloneReportCalculatorDraft(draft);
  if (next.dosingEnabled && !next.costAnalysisEnabled) {
    next.costAnalysisEnabled = true;
  }
  if (!next.budgetImpact.currentTreatmentName.trim() && comparators[0]) {
    next.budgetImpact.currentTreatmentName = comparators[0];
  }
  return next;
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h3 className="text-label font-medium text-text-heading">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-[72ch] text-helper leading-5 text-text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

function NumberField({
  label,
  value,
  onChange,
  helper,
  min,
  max,
  step = "any",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: ReactNode;
  min?: number;
  max?: number;
  step?: string;
  required?: boolean;
}) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      helper={helper}
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      step={step}
      required={required}
    />
  );
}

function ModuleHeader({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6 rounded-card bg-surface-subtle px-5 py-4">
      <div>
        <h3 className="text-card-title font-medium text-white">{title}</h3>
        <p className="mt-2 max-w-[70ch] text-helper leading-5 text-text-muted">
          {description}
        </p>
      </div>
      <Switch
        checked={checked}
        onChange={onChange}
        aria-label={`Include ${title}`}
      />
    </div>
  );
}

export function ReportCalculatorModal({
  draft,
  comparators,
  onClose,
  onSave,
}: ReportCalculatorModalProps) {
  const [localDraft, setLocalDraft] = useState(() =>
    prepareDraft(draft, comparators),
  );
  const [activeTab, setActiveTab] = useState<ReportCalculatorTab>(() =>
    getInitialTab(draft),
  );
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstTabRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => {
      firstTabRef.current?.focus();
    });

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  const updateDosing = <K extends keyof ReportCalculatorDraft["dosing"]>(
    field: K,
    value: ReportCalculatorDraft["dosing"][K],
  ) => {
    setLocalDraft((current) => ({
      ...current,
      dosing: { ...current.dosing, [field]: value },
    }));
    setError(null);
  };

  const updateCost = <K extends keyof ReportCalculatorDraft["costAnalysis"]>(
    field: K,
    value: ReportCalculatorDraft["costAnalysis"][K],
  ) => {
    setLocalDraft((current) => ({
      ...current,
      costAnalysis: { ...current.costAnalysis, [field]: value },
    }));
    setError(null);
  };

  const updateBudget = <
    K extends keyof ReportCalculatorDraft["budgetImpact"],
  >(
    field: K,
    value: ReportCalculatorDraft["budgetImpact"][K],
  ) => {
    setLocalDraft((current) => ({
      ...current,
      budgetImpact: { ...current.budgetImpact, [field]: value },
    }));
    setError(null);
  };

  const setModuleEnabled = (
    module: "dosing" | "cost" | "budget",
    enabled: boolean,
  ) => {
    setLocalDraft((current) => {
      if (module === "cost") {
        return {
          ...current,
          costAnalysisEnabled: enabled,
          dosingEnabled: enabled ? current.dosingEnabled : false,
        };
      }

      if (module === "dosing") {
        return { ...current, dosingEnabled: enabled };
      }

      return { ...current, budgetImpactEnabled: enabled };
    });
    setError(null);
  };

  const handleSave = () => {
    try {
      mapReportCalculatorDraft(localDraft);
      onSave(cloneReportCalculatorDraft(localDraft));
      onClose();
    } catch (validationError) {
      setError(formatReportCalculatorValidationError(validationError));
    }
  };

  const enabledLabels = getReportCalculatorModuleLabels(localDraft);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-3 sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        data-visual-scope="calculator"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-calculator-title"
        aria-describedby="report-calculator-description"
        tabIndex={-1}
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[1080px] flex-col overflow-hidden rounded-button bg-[#171717] text-white shadow-[0_24px_80px_rgba(0,0,0,0.48)] sm:max-h-[calc(100dvh-3rem)]"
      >
        <header className="flex shrink-0 items-start justify-between gap-6 border-b border-border-default px-5 py-5 sm:px-7">
          <div>
            <h2
              id="report-calculator-title"
              className="text-card-title font-medium text-text-heading"
            >
              Report calculation inputs
            </h2>
            <p
              id="report-calculator-description"
              className="mt-2 max-w-[72ch] text-helper leading-5 text-text-muted"
            >
              Choose only the analyses this report needs. Results are
              recalculated during generation and added to Economic Evidence.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-radio text-white/70 transition-colors hover:bg-surface-default hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label="Close report calculation inputs"
          >
            <CloseIcon className="size-5" />
          </button>
        </header>

        <div
          className="shrink-0 border-b border-border-default px-3 sm:px-7"
          role="tablist"
          aria-label="Calculation modules"
        >
          <div className="flex overflow-x-auto">
            {MODULE_TABS.map((tab, index) => {
              const active = activeTab === tab.id;
              const enabled =
                tab.id === "cost"
                  ? localDraft.costAnalysisEnabled
                  : localDraft.budgetImpactEnabled;
              return (
                <button
                  key={tab.id}
                  ref={index === 0 ? firstTabRef : undefined}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative min-h-14 shrink-0 px-4 text-label transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand",
                    active ? "font-medium text-white" : "text-text-muted",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {tab.label}
                    {enabled ? (
                      <span className="size-1.5 rounded-full bg-brand" aria-label="Included" />
                    ) : null}
                  </span>
                  {active ? (
                    <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-t bg-brand" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          <datalist id="report-calculator-comparators">
            {comparators.map((comparator) => (
              <option key={comparator} value={comparator} />
            ))}
          </datalist>
          {activeTab === "cost" ? (
            <section className="space-y-7" role="tabpanel">
              <ModuleHeader
                title="Cost Analysis"
                description="Build per-patient and programme costs. Drug acquisition can be calculated from dosing or entered as a manual annual cost."
                checked={localDraft.costAnalysisEnabled}
                onChange={(enabled) => setModuleEnabled("cost", enabled)}
              />
              {localDraft.costAnalysisEnabled ? (
                <div className="space-y-7">
                  <div className="space-y-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                      <SectionHeading
                        title="Drug acquisition"
                        description="Use a dosing regimen to calculate annual acquisition cost, or switch it off and enter the annual cost manually."
                      />
                      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                        <span className="text-label font-medium text-text-body">
                          Calculate from dosing
                        </span>
                        <Switch
                          checked={localDraft.dosingEnabled}
                          onChange={(enabled) =>
                            setModuleEnabled("dosing", enabled)
                          }
                          aria-label="Calculate drug acquisition from dosing"
                        />
                      </div>
                    </div>

                    {localDraft.dosingEnabled ? (
                      <div className="space-y-6 border-l-2 border-brand/60 pl-4 sm:pl-5">
                        <SectionHeading
                          title="Dosing inputs"
                          description="Drug and indication are inherited from Drug Intake. Enter the package cost and regimen used by the deterministic calculator."
                        />
                        <FieldGrid>
                          <NumberField
                            label="Unit cost"
                            value={localDraft.dosing.unitCost}
                            min={0}
                            onChange={(value) => updateDosing("unitCost", value)}
                          />
                          <NumberField
                            label="Unit size"
                            value={localDraft.dosing.unitSize}
                            min={0}
                            onChange={(value) => updateDosing("unitSize", value)}
                          />
                          <NumberField
                            label="Dose per administration"
                            value={localDraft.dosing.dose}
                            min={0}
                            onChange={(value) => updateDosing("dose", value)}
                          />
                          <NumberField
                            label="Times per day"
                            value={localDraft.dosing.timesPerDay}
                            min={0}
                            helper="Fractions are supported for non-daily regimens."
                            onChange={(value) =>
                              updateDosing("timesPerDay", value)
                            }
                          />
                          <NumberField
                            label="Treatment days per year"
                            value={localDraft.dosing.daysPerYear}
                            min={0}
                            max={366}
                            onChange={(value) =>
                              updateDosing("daysPerYear", value)
                            }
                          />
                          <Select
                            label="Dose type"
                            value={localDraft.dosing.doseType}
                            options={[
                              { value: "fixed", label: "Fixed dose" },
                              { value: "weight_based", label: "Weight based" },
                            ]}
                            onChange={(event) =>
                              updateDosing(
                                "doseType",
                                event.target.value as "fixed" | "weight_based",
                              )
                            }
                          />
                          {localDraft.dosing.doseType === "weight_based" ? (
                            <NumberField
                              label="Patient weight (kg)"
                              value={localDraft.dosing.patientWeight}
                              min={0}
                              onChange={(value) =>
                                updateDosing("patientWeight", value)
                              }
                            />
                          ) : null}
                          <NumberField
                            label="Wastage"
                            value={localDraft.dosing.wastagePercent}
                            min={0}
                            max={100}
                            helper="Percentage"
                            onChange={(value) =>
                              updateDosing("wastagePercent", value)
                            }
                          />
                        </FieldGrid>
                      </div>
                    ) : null}

                    <div className="max-w-[340px]">
                      <NumberField
                        label={
                          localDraft.dosingEnabled
                            ? "Annual drug acquisition override"
                            : "Annual drug acquisition"
                        }
                        value={localDraft.costAnalysis.drugAcquisition}
                        min={0}
                        required={!localDraft.dosingEnabled}
                        helper={
                          localDraft.dosingEnabled
                            ? "Optional. Leave blank to use the calculated dosing result."
                            : "Required when acquisition is not calculated from dosing."
                        }
                        onChange={(value) =>
                          updateCost("drugAcquisition", value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-border-subtle pt-6">
                    <SectionHeading title="Programme" />
                    <FieldGrid>
                      <TextField
                        label="Currency"
                        value={localDraft.costAnalysis.currency}
                        maxLength={3}
                        onChange={(event) =>
                          updateCost(
                            "currency",
                            event.target.value.toUpperCase(),
                          )
                        }
                        helper="Three-letter code; no conversion is applied."
                      />
                      <NumberField
                        label="New-treatment patients"
                        value={localDraft.costAnalysis.newDrugPatientCount}
                        min={1}
                        step="1"
                        onChange={(value) =>
                          updateCost("newDrugPatientCount", value)
                        }
                      />
                    </FieldGrid>
                  </div>

                  <div className="space-y-4 border-t border-border-subtle pt-6">
                    <SectionHeading
                      title="Annual cost components"
                      description="Enter per-patient annual amounts. Expected adverse-event cost is calculated from management cost and rate."
                    />
                    <FieldGrid>
                      {(
                        [
                          ["Administration", "administration"],
                          ["Monitoring", "monitoring"],
                          ["Laboratory / diagnostics", "laboratoryDiagnostics"],
                          ["Outpatient visits", "outpatientVisits"],
                          ["Adverse-event management", "adverseEventManagement"],
                          ["Adverse-event rate (%)", "adverseEventRatePercent"],
                          ["Hospitalizations", "hospitalizations"],
                          ["Other direct costs", "otherDirectCosts"],
                        ] as const
                      ).map(([label, field]) => (
                        <NumberField
                          key={field}
                          label={label}
                          value={localDraft.costAnalysis[field]}
                          min={0}
                          max={
                            field === "adverseEventRatePercent" ? 100 : undefined
                          }
                          onChange={(value) => updateCost(field, value)}
                        />
                      ))}
                    </FieldGrid>
                  </div>

                  <div className="space-y-4 border-t border-border-subtle pt-6">
                    <SectionHeading title="Offsets" />
                    <FieldGrid>
                      <NumberField
                        label="Hospitalization avoidance"
                        value={localDraft.costAnalysis.hospitalizationAvoidance}
                        min={0}
                        onChange={(value) =>
                          updateCost("hospitalizationAvoidance", value)
                        }
                      />
                      <NumberField
                        label="Other offsets"
                        value={localDraft.costAnalysis.otherOffsets}
                        min={0}
                        onChange={(value) => updateCost("otherOffsets", value)}
                      />
                    </FieldGrid>
                  </div>

                  <div className="space-y-4 border-t border-border-subtle pt-6">
                    <SectionHeading
                      title="Comparator — optional"
                      description="Choose or enter one comparator to add programme and per-patient comparisons."
                    />
                    <TextField
                      label="Comparator"
                      list="report-calculator-comparators"
                      value={localDraft.costAnalysis.comparatorName}
                      placeholder="Leave blank for no comparator"
                      onChange={(event) =>
                        updateCost("comparatorName", event.target.value)
                      }
                    />
                    {localDraft.costAnalysis.comparatorName.trim() ? (
                      <FieldGrid>
                        <NumberField
                          label="Annual drug cost"
                          value={
                            localDraft.costAnalysis.comparatorAnnualDrugCost
                          }
                          min={0}
                          onChange={(value) =>
                            updateCost("comparatorAnnualDrugCost", value)
                          }
                        />
                        <NumberField
                          label="Administration and monitoring"
                          value={
                            localDraft.costAnalysis
                              .comparatorAdministrationAndMonitoring
                          }
                          min={0}
                          onChange={(value) =>
                            updateCost(
                              "comparatorAdministrationAndMonitoring",
                              value,
                            )
                          }
                        />
                        <NumberField
                          label="Offsets"
                          value={localDraft.costAnalysis.comparatorOffsets}
                          min={0}
                          onChange={(value) =>
                            updateCost("comparatorOffsets", value)
                          }
                        />
                        <NumberField
                          label="Patient count"
                          value={
                            localDraft.costAnalysis.comparatorPatientCount
                          }
                          min={0}
                          step="1"
                          onChange={(value) =>
                            updateCost("comparatorPatientCount", value)
                          }
                        />
                      </FieldGrid>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {activeTab === "budget" ? (
            <div className="space-y-7" role="tabpanel">
              <ModuleHeader
                title="Budget Impact Analysis"
                description="Model baseline and scenario spend over three or five years. Blank treatment-cost fields use Cost Analysis outputs."
                checked={localDraft.budgetImpactEnabled}
                onChange={(enabled) => setModuleEnabled("budget", enabled)}
              />
              {localDraft.budgetImpactEnabled ? (
                <div className="space-y-7">
                  <div className="space-y-4">
                    <SectionHeading title="Scenario" />
                    <FieldGrid>
                      <TextField
                        label="Perspective"
                        value={localDraft.budgetImpact.perspective}
                        onChange={(event) =>
                          updateBudget("perspective", event.target.value)
                        }
                      />
                      <Select
                        label="Time horizon"
                        value={String(localDraft.budgetImpact.timeHorizon)}
                        options={[
                          { value: "3", label: "3 years" },
                          { value: "5", label: "5 years" },
                        ]}
                        onChange={(event) =>
                          updateBudget(
                            "timeHorizon",
                            Number(event.target.value) as 3 | 5,
                          )
                        }
                      />
                      <TextField
                        label="Currency"
                        value={localDraft.budgetImpact.currency}
                        maxLength={3}
                        onChange={(event) =>
                          updateBudget(
                            "currency",
                            event.target.value.toUpperCase(),
                          )
                        }
                      />
                    </FieldGrid>
                  </div>

                  <div className="space-y-4 border-t border-border-subtle pt-6">
                    <SectionHeading
                      title="New-treatment costs"
                      description={
                        localDraft.costAnalysisEnabled
                          ? "Leave any field blank to carry forward its Cost Analysis result."
                          : "Cost Analysis is off, so all four treatment-cost fields are required."
                      }
                    />
                    <FieldGrid>
                      {(
                        [
                          [
                            "Annual drug cost per patient",
                            "annualDrugCostPerPatient",
                          ],
                          [
                            "Administration and monitoring",
                            "administrationAndMonitoring",
                          ],
                          ["Expected adverse-event cost", "expectedAeCost"],
                          ["Offsets", "offsets"],
                        ] as const
                      ).map(([label, field]) => (
                        <NumberField
                          key={field}
                          label={label}
                          value={localDraft.budgetImpact[field]}
                          min={0}
                          required={!localDraft.costAnalysisEnabled}
                          helper={
                            localDraft.costAnalysisEnabled
                              ? "Blank uses Cost Analysis."
                              : undefined
                          }
                          onChange={(value) => updateBudget(field, value)}
                        />
                      ))}
                      <NumberField
                        label="Wastage (%)"
                        value={localDraft.budgetImpact.wastagePercent}
                        min={0}
                        max={100}
                        onChange={(value) =>
                          updateBudget("wastagePercent", value)
                        }
                      />
                    </FieldGrid>
                  </div>

                  <div className="space-y-4 border-t border-border-subtle pt-6">
                    <SectionHeading title="Current treatment" />
                    <TextField
                      label="Treatment name"
                      list="report-calculator-comparators"
                      value={localDraft.budgetImpact.currentTreatmentName}
                      onChange={(event) =>
                        updateBudget(
                          "currentTreatmentName",
                          event.target.value,
                        )
                      }
                    />
                    <FieldGrid>
                      <NumberField
                        label="Drug price"
                        value={
                          localDraft.budgetImpact.currentTreatmentDrugPrice
                        }
                        min={0}
                        onChange={(value) =>
                          updateBudget("currentTreatmentDrugPrice", value)
                        }
                      />
                      <NumberField
                        label="Extra care cost"
                        value={
                          localDraft.budgetImpact.currentTreatmentExtraCareCost
                        }
                        min={0}
                        onChange={(value) =>
                          updateBudget("currentTreatmentExtraCareCost", value)
                        }
                      />
                      <NumberField
                        label="Savings"
                        value={
                          localDraft.budgetImpact.currentTreatmentSavings
                        }
                        min={0}
                        onChange={(value) =>
                          updateBudget("currentTreatmentSavings", value)
                        }
                      />
                    </FieldGrid>
                  </div>

                  <div className="space-y-4 border-t border-border-subtle pt-6">
                    <SectionHeading title="Eligible population" />
                    <FieldGrid>
                      {(
                        [
                          ["Hospital beds", "hospitalBeds"],
                          ["Bed occupancy (%)", "bedOccupancyPercent"],
                          ["Prevalence (%)", "prevalencePercent"],
                          ["Diagnosis rate (%)", "diagnosisRatePercent"],
                          ["Eligibility (%)", "eligibilityPercent"],
                          [
                            "Average length of stay (days)",
                            "averageLengthOfStayDays",
                          ],
                          [
                            "Annual population growth (%)",
                            "annualPopulationGrowthPercent",
                          ],
                          ["Annual inflation (%)", "annualInflationPercent"],
                        ] as const
                      ).map(([label, field]) => (
                        <NumberField
                          key={field}
                          label={label}
                          value={localDraft.budgetImpact[field]}
                          step={field === "hospitalBeds" ? "1" : "any"}
                          onChange={(value) => updateBudget(field, value)}
                        />
                      ))}
                    </FieldGrid>
                  </div>

                  <div className="space-y-4 border-t border-border-subtle pt-6">
                    <SectionHeading
                      title="Annual uptake"
                      description="Enter one adoption percentage for each year in the selected horizon."
                    />
                    <FieldGrid>
                      {localDraft.budgetImpact.uptakePercent
                        .slice(0, localDraft.budgetImpact.timeHorizon)
                        .map((value, index) => (
                          <NumberField
                            key={index}
                            label={`Year ${index + 1} uptake (%)`}
                            value={value}
                            min={0}
                            max={100}
                            onChange={(nextValue) => {
                              const uptake = [
                                ...localDraft.budgetImpact.uptakePercent,
                              ] as ReportCalculatorDraft["budgetImpact"]["uptakePercent"];
                              uptake[index] = nextValue;
                              updateBudget("uptakePercent", uptake);
                            }}
                          />
                        ))}
                    </FieldGrid>
                  </div>

                  <details className="border-t border-border-subtle pt-6">
                    <summary className="cursor-pointer text-label font-medium text-brand outline-none focus-visible:ring-2 focus-visible:ring-brand/30">
                      Sensitivity assumptions
                    </summary>
                    <div className="mt-5 space-y-5">
                      <FieldGrid>
                        <NumberField
                          label="Conservative uptake multiplier"
                          value={
                            localDraft.budgetImpact
                              .conservativeUptakeMultiplier
                          }
                          min={0}
                          onChange={(value) =>
                            updateBudget(
                              "conservativeUptakeMultiplier",
                              value,
                            )
                          }
                        />
                        <NumberField
                          label="Optimistic uptake multiplier"
                          value={
                            localDraft.budgetImpact.optimisticUptakeMultiplier
                          }
                          min={0}
                          onChange={(value) =>
                            updateBudget(
                              "optimisticUptakeMultiplier",
                              value,
                            )
                          }
                        />
                        <NumberField
                          label="Conservative cost increase (%)"
                          value={
                            localDraft.budgetImpact
                              .conservativeCostIncreasePercent
                          }
                          min={0}
                          max={100}
                          onChange={(value) =>
                            updateBudget(
                              "conservativeCostIncreasePercent",
                              value,
                            )
                          }
                        />
                        <NumberField
                          label="Optimistic cost decrease (%)"
                          value={
                            localDraft.budgetImpact
                              .optimisticCostDecreasePercent
                          }
                          min={0}
                          max={100}
                          onChange={(value) =>
                            updateBudget(
                              "optimisticCostDecreasePercent",
                              value,
                            )
                          }
                        />
                      </FieldGrid>
                      <label className="flex flex-col gap-2 text-label font-medium text-white">
                        Notes
                        <textarea
                          value={localDraft.budgetImpact.notes}
                          onChange={(event) =>
                            updateBudget("notes", event.target.value)
                          }
                          rows={3}
                          className="w-full resize-y rounded-card border border-border-default bg-input-fill px-4 py-3 text-input font-medium text-white outline-none placeholder:text-text-muted focus:border-brand-chip-border"
                          placeholder="Optional local assumptions"
                        />
                      </label>
                    </div>
                  </details>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p
              id="report-calculator-error"
              role="alert"
              className="mt-6 rounded-card bg-amber-400/10 px-4 py-3 text-helper leading-5 text-amber-200"
            >
              {error}
            </p>
          ) : null}
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-border-default px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-helper text-text-muted" aria-live="polite">
            {enabledLabels.length > 0
              ? `${enabledLabels.join(", ")} will be included.`
              : "No calculation modules selected."}
          </p>
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-3 text-label font-medium text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Cancel
            </button>
            <Button className="h-11" onClick={handleSave}>
              Save calculation inputs
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
