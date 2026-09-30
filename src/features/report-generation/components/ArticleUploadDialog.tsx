"use client";

import { Button, Checkbox, CloseIcon, TextField } from "@/components/ui";
import { useRef, useState, type ChangeEvent } from "react";
import { ReportApiError } from "../api/reportApi";
import { useUploadReportArticleMutation } from "../hooks/useGenerateReport";
import type {
  ArticleCandidate,
  ArticleUploadResponse,
  EvidenceBucket,
  WizardArticleUpload,
} from "../types";
import {
  ARTICLE_UPLOAD_ACCEPT,
  toWizardArticleUpload,
  validateArticleUploadFile,
} from "../utils/articleUploads";

type ArticleUploadDialogProps = {
  reportServiceId: string;
  bucket: EvidenceBucket;
  article?: Pick<ArticleCandidate, "pmid" | "pmcid" | "title">;
  onAccepted: (upload: WizardArticleUpload) => void;
  onClose: () => void;
};

const STATUS_LABELS: Record<ArticleUploadResponse["status"], string> = {
  match_good: "Verified match",
  match_poor: "Possible mismatch",
  not_found: "PubMed record not found",
  low_quality: "PDF quality is too low",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof ReportApiError) {
    if (error.status === 409) {
      return "Articles cannot be uploaded while the report is queued or processing.";
    }
    if (error.status === 413) {
      return "This PDF is larger than the 20 MB upload limit.";
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "The article could not be uploaded. Please try again.";
}

function formatScore(score: number | null): string {
  if (score === null) return "Not evaluated";
  return `${Math.round(score * 100)}%`;
}

export function ArticleUploadDialog({
  reportServiceId,
  bucket,
  article,
  onAccepted,
  onClose,
}: ArticleUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pmid, setPmid] = useState(article?.pmid ?? "");
  const [pmcid, setPmcid] = useState(article?.pmcid ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [result, setResult] = useState<ArticleUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uploadMutation = useUploadReportArticleMutation();
  const busy = uploadMutation.isPending;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    if (!nextFile) return;

    const fileError = validateArticleUploadFile(nextFile);
    if (fileError) {
      setFile(null);
      setError(fileError);
      event.target.value = "";
      return;
    }

    setFile(nextFile);
    setError(null);
    setResult(null);
  };

  const submit = async () => {
    if (!file) {
      setError("Choose a PDF to upload.");
      return;
    }
    if (!pmid.trim() && !pmcid.trim()) {
      setError("Enter a PMID or PMCID.");
      return;
    }

    setError(null);
    try {
      const response = await uploadMutation.mutateAsync({
        reportServiceId,
        file,
        bucket,
        pmid: pmid.trim() || undefined,
        pmcid: pmcid.trim() || undefined,
      });
      setResult(response);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
    }
  };

  const acceptResult = () => {
    if (!result || !file) return;
    if (!result.pmid && !result.pmcid) {
      setError(
        "The upload response did not include a PMID or PMCID, so this PDF cannot be added to report selections.",
      );
      return;
    }
    onAccepted(
      toWizardArticleUpload(result, file.name, {
        acceptedWarning: result.status !== "match_good",
        replaceExisting,
      }),
    );
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="article-upload-title"
        className="max-h-[90vh] w-full max-w-[680px] overflow-y-auto rounded-button border border-border-default bg-[#171717] text-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-border-default px-6 py-5">
          <div>
            <h2 id="article-upload-title" className="text-card-title font-medium">
              Upload {bucket} article
            </h2>
            {article?.title ? (
              <p className="mt-2 line-clamp-2 text-helper text-text-muted">
                {article.title}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex size-8 items-center justify-center rounded-radio text-white/72 hover:bg-surface-default hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label="Close article upload"
          >
            <CloseIcon className="size-5" />
          </button>
        </header>

        <div className="flex flex-col gap-6 px-6 py-6">
          {!result ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="PMID"
                  value={pmid}
                  disabled={busy}
                  placeholder="31535829"
                  onChange={(event) => {
                    setPmid(event.target.value);
                    setError(null);
                  }}
                />
                <TextField
                  label="PMCID"
                  value={pmcid}
                  disabled={busy}
                  placeholder="PMC8826179"
                  onChange={(event) => {
                    setPmcid(event.target.value);
                    setError(null);
                  }}
                  helper="Optional when a PMID is provided"
                />
              </div>

              <div className="rounded-card border border-dashed border-border-default bg-surface-subtle p-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ARTICLE_UPLOAD_ACCEPT}
                  className="hidden"
                  disabled={busy}
                  onChange={handleFileChange}
                  aria-label="Article PDF"
                />
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-label font-medium text-text-heading">
                      {file?.name ?? "Choose an article PDF"}
                    </p>
                    <p className="mt-1 text-helper text-text-muted">
                      PDF only, up to 20 MB
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    className="h-11"
                    disabled={busy}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse PDF
                  </Button>
                </div>
              </div>

              <label className="flex items-start gap-3 text-helper text-text-body">
                <Checkbox
                  checked={replaceExisting}
                  onChange={setReplaceExisting}
                  aria-label="Replace available repository full text"
                />
                <span>
                  Use this PDF even when repository full text is available.
                  Leave off to use it only when full text cannot be fetched.
                </span>
              </label>
            </>
          ) : (
            <div
              className={
                result.status === "match_good"
                  ? "rounded-card border border-brand-border bg-brand-bg p-5"
                  : "rounded-card border border-amber-400/30 bg-amber-400/10 p-5"
              }
            >
              <p
                className={
                  result.status === "match_good"
                    ? "text-card-title font-medium text-brand"
                    : "text-card-title font-medium text-amber-300"
                }
              >
                {STATUS_LABELS[result.status]}
              </p>
              <p className="mt-3 text-label leading-6 text-text-body">
                {result.message}
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-helper sm:grid-cols-4">
                {Object.entries(result.scores).map(([label, score]) => (
                  <div key={label}>
                    <dt className="capitalize text-text-muted">{label}</dt>
                    <dd className="mt-1 font-medium text-white">
                      {formatScore(score)}
                    </dd>
                  </div>
                ))}
              </dl>
              {result.status !== "match_good" ? (
                <p className="mt-5 text-helper leading-5 text-amber-200">
                  The PDF was retained. Choosing “Use anyway” confirms that you
                  understand this warning and still want it used for generation.
                </p>
              ) : null}
            </div>
          )}

          {error ? (
            <p role="alert" className="text-helper text-red-400">
              {error}
            </p>
          ) : null}

          <footer className="flex flex-wrap items-center justify-end gap-4 border-t border-border-default pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="h-11 px-3 text-label font-medium text-white/72 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            {result ? (
              <Button onClick={acceptResult}>
                {result.status === "match_good"
                  ? "Use verified article"
                  : "Use anyway"}
              </Button>
            ) : (
              <Button disabled={busy} onClick={() => void submit()}>
                {busy ? "Checking PDF…" : "Upload and verify"}
              </Button>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}
