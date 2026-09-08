import type { EditableTextTarget } from "../utils/reportBlockEditing";

export type ReportRewritePreset =
  | "more-concise"
  | "executive-tone"
  | "patient-friendly"
  | "add-citation"
  | "stronger-evidence-framing";

export type ReportRewritePreviewInput = {
  reportServiceId: string;
  sectionId: string;
  target: EditableTextTarget;
  selectedText: string;
  start: number;
  end: number;
  instruction: string;
  preset: ReportRewritePreset | null;
};

function makeMoreConcise(text: string): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= 14) {
    return text.trim();
  }
  return `${words.slice(0, Math.max(10, Math.ceil(words.length * 0.65))).join(" ")}…`;
}

/**
 * Temporary local adapter. Its request shape mirrors the future rewrite API,
 * while its deterministic output makes the interaction testable without
 * pretending that real clinical AI processing has taken place.
 */
export async function previewReportRewrite(
  input: ReportRewritePreviewInput,
): Promise<string> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 450);
  });

  const selectedText = input.selectedText.trim();

  switch (input.preset) {
    case "more-concise":
      return makeMoreConcise(selectedText);
    case "executive-tone":
      return `For decision-makers, ${selectedText.charAt(0).toLowerCase()}${selectedText.slice(1)}`;
    case "patient-friendly":
      return `In plain language, ${selectedText.charAt(0).toLowerCase()}${selectedText.slice(1)}`;
    case "add-citation":
      return `${selectedText} [citation to be added]`;
    case "stronger-evidence-framing":
      return `Available evidence indicates that ${selectedText.charAt(0).toLowerCase()}${selectedText.slice(1)}`;
    default:
      return input.instruction.trim()
        ? `${selectedText} [AI preview: ${input.instruction.trim()}]`
        : selectedText;
  }
}
