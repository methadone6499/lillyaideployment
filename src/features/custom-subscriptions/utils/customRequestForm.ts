import { companyNameSchema } from "@/features/billing";
import type { FieldErrors } from "@/services/ApiRequestError";

import {
  contactPhoneSchema,
  CUSTOM_TEXT_MAX_LENGTH,
  normalizeContactPhone,
  type CreateCustomRequestBody,
  type CustomRequest,
  type UpdateCustomRequestBody,
} from "../schemas/customSubscriptionSchemas";
import { parsePositiveIntegerInput } from "./formatCustomSubscription";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CustomRequestFormValues = {
  companyName: string;
  billingEmail: string;
  contactPhone: string;
  requestedSeats: string;
  requestedReports: string;
  notes: string;
};

export type CustomRequestFormResult<TBody> =
  | { ok: true; body: TBody }
  | { ok: false; fieldErrors: FieldErrors };

export function buildInitialCustomRequestFormValues(input: {
  request?: CustomRequest | null;
  companyName?: string | null;
  billingEmail?: string | null;
}): CustomRequestFormValues {
  const request = input.request;

  return {
    companyName: request?.company_name ?? input.companyName ?? "",
    billingEmail: request?.billing_email ?? input.billingEmail ?? "",
    contactPhone: request?.contact_phone ?? "",
    requestedSeats: request ? String(request.requested_seats) : "",
    requestedReports: request ? String(request.requested_reports) : "",
    notes: request?.notes ?? "",
  };
}

type ParsedFormValues = {
  companyName: string | null;
  billingEmail: string;
  contactPhone: string | null;
  requestedSeats: number;
  requestedReports: number;
  notes: string | null;
};

function parseFormValues(
  values: CustomRequestFormValues,
  includeCompanyName: boolean,
): CustomRequestFormResult<ParsedFormValues> {
  const fieldErrors: FieldErrors = {};
  let companyName: string | null = null;

  if (includeCompanyName) {
    const parsed = companyNameSchema.safeParse(values.companyName);
    if (parsed.success) {
      companyName = parsed.data;
    } else {
      fieldErrors.company_name = "Enter a company name up to 200 characters.";
    }
  }

  const billingEmail = values.billingEmail.trim();
  if (!EMAIL_PATTERN.test(billingEmail)) {
    fieldErrors.billing_email = "Enter a valid billing email address.";
  }

  let contactPhone: string | null = null;
  if (values.contactPhone.trim()) {
    const parsed = contactPhoneSchema.safeParse(values.contactPhone);
    if (parsed.success) {
      contactPhone = parsed.data;
    } else {
      fieldErrors.contact_phone =
        "Use an international number such as +14155552671.";
    }
  }

  const requestedSeats = parsePositiveIntegerInput(values.requestedSeats);
  if (requestedSeats === null) {
    fieldErrors.requested_seats = "Enter at least 1 seat.";
  }

  const requestedReports = parsePositiveIntegerInput(values.requestedReports);
  if (requestedReports === null) {
    fieldErrors.requested_reports = "Enter at least 1 report per month.";
  }

  const notes = values.notes.trim();
  if (notes.length > CUSTOM_TEXT_MAX_LENGTH) {
    fieldErrors.notes = `Keep notes under ${CUSTOM_TEXT_MAX_LENGTH} characters.`;
  }

  if (
    Object.keys(fieldErrors).length > 0 ||
    requestedSeats === null ||
    requestedReports === null
  ) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    body: {
      companyName,
      billingEmail,
      contactPhone,
      requestedSeats,
      requestedReports,
      notes: notes || null,
    },
  };
}

export function buildCreateCustomRequestBody(
  values: CustomRequestFormValues,
  options: { includeCompanyName: boolean },
): CustomRequestFormResult<CreateCustomRequestBody> {
  const parsed = parseFormValues(values, options.includeCompanyName);

  if (!parsed.ok) {
    return parsed;
  }

  const { body } = parsed;

  return {
    ok: true,
    body: {
      ...(body.companyName ? { company_name: body.companyName } : {}),
      billing_email: body.billingEmail,
      ...(body.contactPhone ? { contact_phone: body.contactPhone } : {}),
      requested_seats: body.requestedSeats,
      requested_reports: body.requestedReports,
      ...(body.notes ? { notes: body.notes } : {}),
    },
  };
}

/**
 * Builds a PATCH body with only the fields that differ from the request the
 * user last saw, plus that request's revision for optimistic concurrency.
 */
export function buildUpdateCustomRequestBody(
  values: CustomRequestFormValues,
  request: CustomRequest,
): CustomRequestFormResult<UpdateCustomRequestBody> | { ok: true; body: null } {
  const includeCompanyName = request.target_scope_type === "user";
  const parsed = parseFormValues(values, includeCompanyName);

  if (!parsed.ok) {
    return parsed;
  }

  const { body } = parsed;
  const update: UpdateCustomRequestBody = {
    expected_revision: request.revision,
  };
  const currentPhone = request.contact_phone
    ? normalizeContactPhone(request.contact_phone)
    : null;

  if (includeCompanyName && body.companyName !== request.company_name) {
    update.company_name = body.companyName ?? undefined;
  }

  if (body.billingEmail !== request.billing_email) {
    update.billing_email = body.billingEmail;
  }

  if (body.contactPhone !== currentPhone) {
    update.contact_phone = body.contactPhone;
  }

  if (body.requestedSeats !== request.requested_seats) {
    update.requested_seats = body.requestedSeats;
  }

  if (body.requestedReports !== request.requested_reports) {
    update.requested_reports = body.requestedReports;
  }

  if (body.notes !== (request.notes?.trim() || null)) {
    update.notes = body.notes;
  }

  return Object.keys(update).length > 1
    ? { ok: true, body: update }
    : { ok: true, body: null };
}
