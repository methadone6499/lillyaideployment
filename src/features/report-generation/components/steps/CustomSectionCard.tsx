"use client";

import { Card, CloseIcon, Switch, TextField } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useState } from "react";
import {
  useDeleteCustomSectionMutation,
  usePatchCustomSectionMutation,
} from "../../hooks/useGenerateReport";
import { useReportWizardStore } from "../../store/useReportWizardStore";
import type { WizardCustomSection } from "../../types";
import { getCustomSectionErrorMessage } from "../../utils/customSections";

type CustomSectionCardProps = {
  section: WizardCustomSection;
  index: number;
  reportServiceId: string | null;
};

export function CustomSectionCard({
  section,
  index,
  reportServiceId,
}: CustomSectionCardProps) {
  const [title, setTitle] = useState(section.title);
  const [titleFromStore, setTitleFromStore] = useState(section.title);
  const [error, setError] = useState<string | null>(null);
  const updateCustomSection = useReportWizardStore(
    (state) => state.updateCustomSection,
  );
  const removeCustomSection = useReportWizardStore(
    (state) => state.removeCustomSection,
  );
  const patchMutation = usePatchCustomSectionMutation();
  const deleteMutation = useDeleteCustomSectionMutation();
  const busy = patchMutation.isPending || deleteMutation.isPending;

  if (section.title !== titleFromStore) {
    setTitleFromStore(section.title);
    setTitle(section.title);
  }

  const persistPatch = async (
    input: { title?: string; enabled?: boolean },
  ) => {
    if (!reportServiceId) {
      setError("Report is not configured. Go back to Filters and continue again.");
      return false;
    }

    setError(null);
    try {
      await patchMutation.mutateAsync({
        reportServiceId,
        customId: section.customId,
        input: { ...input, sort_order: index },
      });
      updateCustomSection(section.customId, input);
      if (input.title !== undefined) {
        setTitle(input.title);
      }
      return true;
    } catch (patchError) {
      setError(getCustomSectionErrorMessage(patchError));
      return false;
    }
  };

  const handleTitleBlur = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(section.title);
      return;
    }
    if (trimmed === section.title) {
      return;
    }
    const saved = await persistPatch({ title: trimmed });
    if (!saved) {
      setTitle(section.title);
    }
  };

  const handleEnabledChange = async (enabled: boolean) => {
    if (enabled === section.enabled) {
      return;
    }
    await persistPatch({ enabled });
  };

  const handleDelete = async () => {
    if (!reportServiceId) {
      setError("Report is not configured. Go back to Filters and continue again.");
      return;
    }

    setError(null);
    try {
      await deleteMutation.mutateAsync({
        reportServiceId,
        customId: section.customId,
      });
      removeCustomSection(section.customId);
    } catch (deleteError) {
      setError(getCustomSectionErrorMessage(deleteError));
    }
  };

  return (
    <Card
      variant={section.enabled ? "accent" : "default"}
      className="flex flex-col gap-3 px-9 py-6"
    >
      <div className="flex items-center justify-between gap-6">
        <TextField
          containerClassName="flex-1"
          className="border-border-default bg-surface-default"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => {
            void handleTitleBlur();
          }}
          disabled={busy}
          aria-label="Custom section title"
        />
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              void handleDelete();
            }}
            disabled={busy}
            aria-label={`Remove ${section.title}`}
            className="inline-flex size-10 items-center justify-center rounded-button text-text-muted transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CloseIcon />
          </button>
          <Switch
            checked={section.enabled}
            onChange={(checked) => {
              void handleEnabledChange(checked);
            }}
            disabled={busy}
            className={cn(busy && "cursor-not-allowed opacity-50")}
            aria-label={`Toggle ${section.title}`}
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-helper text-status-running">
          {error}
        </p>
      )}
    </Card>
  );
}
