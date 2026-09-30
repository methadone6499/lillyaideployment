import { claimVerificationPayloadSchema } from "../schemas/reportSchemas";
import type {
  ClaimVerificationGroup,
  ClaimVerificationPayload,
  SectionType,
} from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseVerification(value: unknown): ClaimVerificationPayload | null {
  const result = claimVerificationPayloadSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function getClaimVerificationGroups(
  sectionType: SectionType,
  raw: Record<string, unknown> | undefined,
): ClaimVerificationGroup[] {
  if (!raw || !["clinical", "economic", "hta"].includes(sectionType)) {
    return [];
  }

  const root = raw.claim_verification;

  if (sectionType === "clinical" || sectionType === "hta") {
    const verification = parseVerification(root);
    if (!verification) return [];
    return [
      {
        id: sectionType,
        label: sectionType === "clinical" ? "Clinical claims" : "HTA claims",
        verification,
      },
    ];
  }

  if (!isRecord(root)) return [];

  const groups: ClaimVerificationGroup[] = [];
  const economic = parseVerification(root.economic);
  const bia = parseVerification(root.bia);
  if (economic) {
    groups.push({
      id: "economic",
      label: "Economic claims",
      verification: economic,
    });
  }
  if (bia) {
    groups.push({
      id: "bia",
      label: "Budget impact claims",
      verification: bia,
    });
  }

  // Accept a direct payload for backwards-compatible economic responses.
  if (groups.length === 0) {
    const direct = parseVerification(root);
    if (direct) {
      groups.push({
        id: "economic",
        label: "Economic claims",
        verification: direct,
      });
    }
  }

  return groups;
}
