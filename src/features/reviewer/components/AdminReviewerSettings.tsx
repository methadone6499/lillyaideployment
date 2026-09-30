"use client";

import { Button } from "@/components/ui";
import { hasPermission, useAuthUser } from "@/features/auth";
import { useState, type FormEvent } from "react";

import { useUpdateReviewerSettingsMutation } from "../hooks/useReviewerMutations";
import { useReviewerAssignmentSettings } from "../hooks/useReviewerQueries";
import type { ReviewerAssignmentSettings } from "../schemas/reviewerSchemas";
import { classifyReviewerError } from "../utils/classifyReviewerError";
import { ReviewerAdminNavigation } from "./ReviewerAdminNavigation";

export function AdminReviewerSettings() {
  const { authMe } = useAuthUser();
  const canManage = hasPermission(authMe, "admin:reviewers_manage");
  const settingsQuery = useReviewerAssignmentSettings(canManage);

  if (authMe && !canManage) {
    return <p className="mt-10 text-body-lg text-red-400" role="alert">You do not have permission to change reviewer assignment settings.</p>;
  }

  return (
    <>
      <ReviewerAdminNavigation activeHref="/super-admin/review-settings" />
      <section className="mt-8 max-w-[760px] rounded-button border border-border-default bg-surface-default p-6" aria-labelledby="review-settings-title">
        <h2 id="review-settings-title" className="text-card-title font-medium text-white">Automatic assignment policy</h2>
        <p className="mt-3 text-label leading-6 text-text-body">
          Changes apply to new and reassigned work. Existing due dates are not recalculated.
        </p>

        {settingsQuery.isPending ? (
          <p className="mt-8 text-label text-text-muted">Loading assignment settings...</p>
        ) : settingsQuery.isError ? (
          <div className="mt-8 flex items-center gap-4">
            <p className="text-label text-red-400" role="alert">{classifyReviewerError(settingsQuery.error).message}</p>
            <button type="button" className="text-label font-medium text-brand hover:underline" onClick={() => void settingsQuery.refetch()}>Try again</button>
          </div>
        ) : settingsQuery.data ? (
          <ReviewerSettingsForm key={settingsQuery.data.version} settings={settingsQuery.data} onRefresh={() => settingsQuery.refetch()} />
        ) : null}
      </section>
    </>
  );
}

function ReviewerSettingsForm({
  settings,
  onRefresh,
}: {
  settings: ReviewerAssignmentSettings;
  onRefresh: () => Promise<unknown>;
}) {
  const mutation = useUpdateReviewerSettingsMutation();
  const [overdueDays, setOverdueDays] = useState(String(settings.overdue_after_days));
  const [capacity, setCapacity] = useState(String(settings.max_active_assignments_per_reviewer));
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    const overdue = Number(overdueDays);
    const maximum = Number(capacity);

    if (!Number.isInteger(overdue) || overdue < 1 || overdue > 365) {
      setFeedback({ type: "error", message: "Overdue days must be a whole number from 1 to 365." });
      return;
    }
    if (!Number.isInteger(maximum) || maximum < 1 || maximum > 100) {
      setFeedback({ type: "error", message: "Assignment capacity must be a whole number from 1 to 100." });
      return;
    }

    try {
      await mutation.mutateAsync({
        overdue_after_days: overdue,
        max_active_assignments_per_reviewer: maximum,
        version: settings.version,
      });
      setFeedback({ type: "success", message: "Assignment settings updated." });
    } catch (error) {
      const classified = classifyReviewerError(error);
      if (classified.code === "reviewer_assignment_settings_conflict") {
        await onRefresh();
      }
      setFeedback({ type: "error", message: classified.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
      <label className="flex flex-col gap-2 text-label text-text-muted">
        Mark assignments overdue after (days)
        <input
          type="number"
          min={1}
          max={365}
          required
          value={overdueDays}
          onChange={(event) => setOverdueDays(event.target.value)}
          className="h-12 rounded-button border border-border-default bg-surface-subtle px-4 text-body-lg text-white outline-none focus:border-brand"
        />
      </label>
      <label className="flex flex-col gap-2 text-label text-text-muted">
        Maximum active assignments per reviewer
        <input
          type="number"
          min={1}
          max={100}
          required
          value={capacity}
          onChange={(event) => setCapacity(event.target.value)}
          className="h-12 rounded-button border border-border-default bg-surface-subtle px-4 text-body-lg text-white outline-none focus:border-brand"
        />
      </label>
      {feedback ? (
        <p className={feedback.type === "error" ? "text-label text-red-400" : "text-label text-brand"} role={feedback.type === "error" ? "alert" : "status"}>
          {feedback.message}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
