"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Button, Card } from "@/components/ui";

import {
  useCompanyLogoContent,
  useCompanyLogoMetadata,
  useDeleteCompanyLogoMutation,
  usePutCompanyLogoMutation,
} from "../hooks/useCompanyBranding";
import {
  getCompanyLogoErrorMessage,
  validateCompanyLogoFile,
} from "../utils/companyBrandingFiles";

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type CompanyLogoPreviewProps = {
  blob: Blob;
  width: number;
  height: number;
};

function CompanyLogoPreview({
  blob,
  width,
  height,
}: CompanyLogoPreviewProps) {
  const [previewUrl] = useState(() => URL.createObjectURL(blob));

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <Image
      src={previewUrl}
      alt="Company logo"
      width={width}
      height={height}
      unoptimized
      className="max-h-full max-w-full object-contain"
    />
  );
}

export function CompanyBrandingCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoQuery = useCompanyLogoMetadata();
  const metadata = logoQuery.data?.logo ?? null;
  const contentQuery = useCompanyLogoContent(metadata?.version, {
    enabled: metadata !== null,
  });
  const putMutation = usePutCompanyLogoMutation();
  const deleteMutation = useDeleteCompanyLogoMutation();
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!logoQuery.canRead || !logoQuery.hasCompanyContext) {
    return null;
  }

  const isMutating = putMutation.isPending || deleteMutation.isPending;
  const metadataError = logoQuery.isError
    ? getCompanyLogoErrorMessage(
        logoQuery.error,
        "Unable to load company branding.",
      )
    : null;
  const previewError = contentQuery.isError
    ? getCompanyLogoErrorMessage(
        contentQuery.error,
        "Unable to load the company logo preview.",
      )
    : null;

  const handleFileChange = async (file: File | undefined) => {
    if (!file || isMutating) {
      return;
    }

    const validationError = validateCompanyLogoFile(file);
    if (validationError) {
      setActionError(validationError);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setActionError(null);
    setConfirmingDelete(false);

    try {
      await putMutation.mutateAsync(file);
    } catch (error) {
      setActionError(getCompanyLogoErrorMessage(error));
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (isMutating) {
      return;
    }

    setActionError(null);

    try {
      await deleteMutation.mutateAsync();
      setConfirmingDelete(false);
    } catch (error) {
      setActionError(
        getCompanyLogoErrorMessage(
          error,
          "Unable to remove the company logo. Please try again.",
        ),
      );
    }
  };

  return (
    <section aria-labelledby="company-branding-title" className="mt-6">
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2
              id="company-branding-title"
              className="text-card-title font-medium text-white"
            >
              Company branding
            </h2>
            <p className="mt-2 max-w-[680px] text-label leading-relaxed text-text-body">
              Add a private PNG logo that company members can include in PDF
              exports. The Report API resizes it when the PDF is generated.
            </p>
          </div>

          {logoQuery.canManage ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,.png"
                className="sr-only"
                disabled={isMutating}
                onChange={(event) => {
                  void handleFileChange(event.target.files?.[0]);
                }}
              />
              <Button
                variant="secondary"
                className="w-full shrink-0 sm:w-auto"
                disabled={isMutating}
                onClick={() => fileInputRef.current?.click()}
              >
                {putMutation.isPending
                  ? "Uploading…"
                  : metadata
                    ? "Replace logo"
                    : "Upload logo"}
              </Button>
            </>
          ) : null}
        </div>

        {logoQuery.isLoading ? (
          <p className="mt-6 text-label text-text-muted" role="status">
            Loading company branding…
          </p>
        ) : metadataError ? (
          <div className="mt-6 flex flex-wrap items-center gap-3" role="alert">
            <p className="text-label text-status-running">{metadataError}</p>
            <button
              type="button"
              className="rounded-button border border-border-default px-3 py-1.5 text-label font-medium text-white transition-colors hover:bg-surface-elevated"
              onClick={() => void logoQuery.refetch()}
            >
              Try again
            </button>
          </div>
        ) : metadata ? (
          <div className="mt-6 flex flex-col gap-5 rounded-button border border-border-default bg-base-black/30 p-5 sm:flex-row sm:items-center">
            <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-button border border-border-default bg-white p-4 sm:w-56">
              {contentQuery.data ? (
                <CompanyLogoPreview
                  key={metadata.version}
                  blob={contentQuery.data}
                  width={metadata.width}
                  height={metadata.height}
                />
              ) : contentQuery.isLoading ? (
                <span className="text-helper text-neutral-600">Loading preview…</span>
              ) : (
                <span className="text-helper text-neutral-600">
                  Preview unavailable
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-label font-medium text-white">
                PNG · {metadata.width} × {metadata.height} px ·{" "}
                {formatFileSize(metadata.size_bytes)}
              </p>
              <p className="mt-2 text-helper text-text-muted">
                Updated {formatUpdatedAt(metadata.updated_at)}
              </p>
              {previewError ? (
                <p className="mt-3 text-helper text-status-running" role="alert">
                  {previewError}
                </p>
              ) : null}

              {logoQuery.canManage ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {confirmingDelete ? (
                    <>
                      <span className="text-helper text-text-body">
                        Remove this logo?
                      </span>
                      <button
                        type="button"
                        disabled={isMutating}
                        className="text-helper font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
                        onClick={() => void handleDelete()}
                      >
                        {deleteMutation.isPending ? "Removing…" : "Confirm"}
                      </button>
                      <button
                        type="button"
                        disabled={isMutating}
                        className="text-helper font-medium text-text-body hover:text-white disabled:opacity-50"
                        onClick={() => setConfirmingDelete(false)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={isMutating}
                      className="text-helper font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
                      onClick={() => setConfirmingDelete(true)}
                    >
                      Remove logo
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-button border border-dashed border-border-default px-5 py-6">
            <p className="text-label text-text-body">
              No company logo has been uploaded.
            </p>
            {logoQuery.canManage ? (
              <p className="mt-2 text-helper text-text-muted">
                Upload a static PNG up to 10 MiB.
              </p>
            ) : null}
          </div>
        )}

        {actionError ? (
          <p className="mt-4 text-helper text-status-running" role="alert">
            {actionError}
          </p>
        ) : null}
      </Card>
    </section>
  );
}
