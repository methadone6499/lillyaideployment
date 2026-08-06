"use client";

import { useState } from "react";
import {
  ArrowNarrowRightIcon,
  Button,
  Card,
  PlusIcon,
  TextField,
} from "@/components/ui";

export function AddCustomSectionCard() {
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  return (
    <Card variant="subtle" className="flex flex-col gap-6 px-9 py-8">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-4">
          <h3 className="text-card-title font-medium text-white">
            Add new section
          </h3>
          <p className="text-helper text-text-muted">
            Enter prompt to explain your custom section
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={isPromptOpen ? "primary" : "secondary"}
            leadingIcon={<PlusIcon />}
            className="h-12 pl-3 pr-5"
            onClick={() => setIsPromptOpen((open) => !open)}
          >
            Generate via AI
          </Button>
          <Button
            variant="secondary"
            leadingIcon={<PlusIcon />}
            className="h-12 pl-3 pr-5"
          >
            Upload Document Template
          </Button>
        </div>
      </div>

      {isPromptOpen && (
        <div className="flex gap-4">
          <TextField
            containerClassName="flex-1"
            className="border-border-default bg-surface-default placeholder:text-text-step"
            placeholder="Generate a reimbursement landscape section focused on GCC payer systems."
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            aria-label="Custom section prompt"
          />
          <Button
            variant="secondary"
            trailingIcon={<ArrowNarrowRightIcon />}
            className="h-12 pl-5 pr-3"
          >
            Proceed
          </Button>
        </div>
      )}
    </Card>
  );
}
