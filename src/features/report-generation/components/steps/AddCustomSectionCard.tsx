"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  ArrowNarrowRightIcon,
  Button,
  Card,
  PlusIcon,
  TextField,
} from "@/components/ui";
import { useCreateCustomSectionMutation } from "../../hooks/useGenerateReport";
import { useReportWizardStore } from "../../store/useReportWizardStore";
import {
  CUSTOM_SECTION_FILE_ACCEPT,
  getCustomSectionErrorMessage,
  specToWizardCustomSection,
  validateCustomSectionFile,
} from "../../utils/customSections";

export function AddCustomSectionCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportServiceId = useReportWizardStore((state) => state.reportServiceId);
  const addCustomSection = useReportWizardStore(
    (state) => state.addCustomSection,
  );
  const createMutation = useCreateCustomSectionMutation();

  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = createMutation.isPending;

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submit = async (fileOverride?: File | null) => {
    const trimmedTitle = title.trim();
    const trimmedPrompt = prompt.trim();
    const file = fileOverride === undefined ? selectedFile : fileOverride;

    if (!reportServiceId) {
      setError(
        "Report is not configured. Go back to Filters and continue again.",
      );
      return;
    }
    if (!trimmedTitle) {
      setError("Enter a title for this section.");
      return;
    }
    if (!trimmedPrompt && !file) {
      setError("Enter a prompt or upload a .pdf/.docx template.");
      return;
    }
    if (file) {
      const fileError = validateCustomSectionFile(file);
      if (fileError) {
        setError(fileError);
        return;
      }
    }

    setError(null);
    try {
      const result = await createMutation.mutateAsync({
        reportServiceId,
        input: {
          title: trimmedTitle,
          prompt: trimmedPrompt || undefined,
          file: file ?? undefined,
        },
      });
      addCustomSection(specToWizardCustomSection(result.section));
      setTitle("");
      setPrompt("");
      setSelectedFile(null);
      resetFileInput();
    } catch (submitError) {
      setError(getCustomSectionErrorMessage(submitError));
    }
  };

  const handleUploadClick = () => {
    if (busy) {
      return;
    }
    if (!title.trim()) {
      setError("Enter a title for this section.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const fileError = validateCustomSectionFile(file);
    if (fileError) {
      setError(fileError);
      setSelectedFile(null);
      resetFileInput();
      return;
    }

    setSelectedFile(file);
    void submit(file);
  };

  return (
    <Card variant="subtle" className="flex flex-col gap-6 px-9 py-8">
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-4">
          <h3 className="text-card-title font-medium text-white">
            Add new section
          </h3>
          <p className="text-helper text-text-muted">
            Enter a title, then describe the section with a prompt and/or a
            PDF/DOCX template (max 20 MB).
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={isPromptOpen ? "primary" : "secondary"}
            leadingIcon={<PlusIcon />}
            className="h-12 pl-3 pr-5"
            disabled={busy}
            onClick={() => setIsPromptOpen((open) => !open)}
          >
            Generate via AI
          </Button>
          <Button
            variant="secondary"
            leadingIcon={<PlusIcon />}
            className="h-12 pl-3 pr-5"
            disabled={busy}
            onClick={handleUploadClick}
          >
            Upload Document Template
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={CUSTOM_SECTION_FILE_ACCEPT}
            className="hidden"
            disabled={busy}
            onChange={handleFileChange}
            aria-label="Custom section document template"
          />
        </div>
      </div>

      <TextField
        label="Section title"
        required
        containerClassName="max-w-xl"
        className="border-border-default bg-surface-default placeholder:text-text-step"
        placeholder="GCC Reimbursement Landscape"
        value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setError(null);
            }}
        disabled={busy}
        error={error && !title.trim() ? error : undefined}
        aria-label="Custom section title"
      />

      {isPromptOpen && (
        <div className="flex gap-4">
          <TextField
            containerClassName="flex-1"
            className="border-border-default bg-surface-default placeholder:text-text-step"
            placeholder="Generate a reimbursement landscape section focused on GCC payer systems."
            value={prompt}
            onChange={(event) => {
              setPrompt(event.target.value);
              setError(null);
            }}
            disabled={busy}
            aria-label="Custom section prompt"
          />
          <Button
            variant="secondary"
            trailingIcon={<ArrowNarrowRightIcon />}
            className="h-12 pl-5 pr-3"
            disabled={busy}
            onClick={() => {
              void submit();
            }}
          >
            {busy ? "Working…" : "Proceed"}
          </Button>
        </div>
      )}

      {selectedFile && (
        <p className="text-helper text-text-muted">
          Template: {selectedFile.name}
        </p>
      )}

      {error && title.trim() && (
        <p role="alert" className="text-helper text-status-running">
          {error}
        </p>
      )}
    </Card>
  );
}
