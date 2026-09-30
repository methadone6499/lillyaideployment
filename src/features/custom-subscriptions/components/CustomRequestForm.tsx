"use client";

import { useState, type FormEvent } from "react";

import { Button, TextField } from "@/components/ui";
import {
  assignHostedBillingUrl,
  useCreatePortalMutation,
} from "@/features/billing";

import {
  useCreateCustomRequestMutation,
  useUpdateCustomRequestMutation,
} from "../hooks/useCustomSubscriptionMutations";
import {
  CUSTOM_TEXT_MAX_LENGTH,
  type CustomRequest,
} from "../schemas/customSubscriptionSchemas";
import {
  classifyCustomSubscriptionError,
  type ClassifiedCustomSubscriptionError,
} from "../utils/classifyCustomSubscriptionError";
import {
  buildCreateCustomRequestBody,
  buildInitialCustomRequestFormValues,
  buildUpdateCustomRequestBody,
  type CustomRequestFormValues,
} from "../utils/customRequestForm";
import { CustomSubscriptionAlert } from "./CustomSubscriptionAlert";
import { CustomTextArea } from "./CustomTextArea";

const FIELD_ERROR_KEYS: Record<keyof CustomRequestFormValues, string> = {
  companyName: "company_name",
  billingEmail: "billing_email",
  contactPhone: "contact_phone",
  requestedSeats: "requested_seats",
  requestedReports: "requested_reports",
  notes: "notes",
};

type CustomRequestFormProps =
  | {
      mode: "create";
      includeCompanyName: boolean;
      defaultCompanyName: string;
      defaultBillingEmail: string;
      onSubmitted: () => void;
    }
  | {
      mode: "edit";
      request: CustomRequest;
      onSubmitted: () => void;
      onCancel: () => void;
    };

export function CustomRequestForm(props: CustomRequestFormProps) {
  const request = props.mode === "edit" ? props.request : null;
  const includeCompanyName =
    props.mode === "create"
      ? props.includeCompanyName
      : props.request.target_scope_type === "user";
  const [values, setValues] = useState<CustomRequestFormValues>(() =>
    buildInitialCustomRequestFormValues({
      request,
      companyName: props.mode === "create" ? props.defaultCompanyName : null,
      billingEmail: props.mode === "create" ? props.defaultBillingEmail : null,
    }),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] =
    useState<ClassifiedCustomSubscriptionError | null>(null);
  const [noChanges, setNoChanges] = useState(false);
  const createMutation = useCreateCustomRequestMutation();
  const updateMutation = useUpdateCustomRequestMutation();
  const portalMutation = useCreatePortalMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const setField = (field: keyof CustomRequestFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setNoChanges(false);
    setFieldErrors((current) => {
      const key = FIELD_ERROR_KEYS[field];
      if (!(key in current)) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleError = (error: unknown) => {
    const classified = classifyCustomSubscriptionError(error);
    setFieldErrors(classified.fieldErrors);
    setFormError(classified);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPending) {
      return;
    }

    setFormError(null);

    if (props.mode === "create") {
      const result = buildCreateCustomRequestBody(values, { includeCompanyName });

      if (!result.ok) {
        setFieldErrors(result.fieldErrors);
        return;
      }

      try {
        await createMutation.mutateAsync(result.body);
        props.onSubmitted();
      } catch (error) {
        handleError(error);
      }

      return;
    }

    const result = buildUpdateCustomRequestBody(values, props.request);

    if (!result.ok) {
      setFieldErrors(result.fieldErrors);
      return;
    }

    if (result.body === null) {
      setNoChanges(true);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        requestId: props.request.id,
        body: result.body,
      });
      props.onSubmitted();
    } catch (error) {
      handleError(error);
    }
  };

  const openPortal = async () => {
    try {
      const response = await portalMutation.mutateAsync();
      assignHostedBillingUrl(response.url);
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <form
      className="flex max-w-2xl flex-col gap-5"
      noValidate
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      {includeCompanyName ? (
        <TextField
          label="Company name"
          required
          autoComplete="organization"
          maxLength={200}
          value={values.companyName}
          error={fieldErrors.company_name}
          disabled={isPending}
          onChange={(event) => setField("companyName", event.target.value)}
        />
      ) : request ? (
        <p className="text-label text-text-muted">
          Company: <span className="font-medium text-white">{request.company_name}</span>{" "}
          (managed by your company account)
        </p>
      ) : null}
      <TextField
        label="Billing email"
        type="email"
        required
        autoComplete="email"
        value={values.billingEmail}
        error={fieldErrors.billing_email}
        disabled={isPending}
        onChange={(event) => setField("billingEmail", event.target.value)}
      />
      <TextField
        label="Contact phone"
        type="tel"
        autoComplete="tel"
        placeholder="+1 415 555 2671"
        helper="Optional. Use international format with a country code."
        value={values.contactPhone}
        error={fieldErrors.contact_phone}
        disabled={isPending}
        onChange={(event) => setField("contactPhone", event.target.value)}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Seats needed"
          required
          inputMode="numeric"
          value={values.requestedSeats}
          error={fieldErrors.requested_seats}
          disabled={isPending}
          onChange={(event) => setField("requestedSeats", event.target.value)}
        />
        <TextField
          label="Reports per month"
          required
          inputMode="numeric"
          value={values.requestedReports}
          error={fieldErrors.requested_reports}
          disabled={isPending}
          onChange={(event) => setField("requestedReports", event.target.value)}
        />
      </div>
      <CustomTextArea
        label="Notes"
        helper="Optional. Tell us about your team, reviewers or timelines."
        maxLength={CUSTOM_TEXT_MAX_LENGTH}
        value={values.notes}
        error={fieldErrors.notes}
        disabled={isPending}
        onChange={(event) => setField("notes", event.target.value)}
      />
      {noChanges ? (
        <p className="text-helper text-text-muted" role="status">
          Nothing changed yet. Update a field before saving.
        </p>
      ) : null}
      <CustomSubscriptionAlert classified={formError}>
        {formError?.action === "open_portal" ? (
          <Button
            type="button"
            variant="secondary"
            className="h-11 text-label"
            disabled={portalMutation.isPending}
            onClick={() => {
              void openPortal();
            }}
          >
            {portalMutation.isPending ? "Opening portal..." : "Open billing portal"}
          </Button>
        ) : null}
      </CustomSubscriptionAlert>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" className="h-12 text-label" disabled={isPending}>
          {props.mode === "create"
            ? createMutation.isPending
              ? "Submitting..."
              : "Request Custom plan"
            : updateMutation.isPending
              ? "Saving..."
              : "Save changes"}
        </Button>
        {props.mode === "edit" ? (
          <Button
            type="button"
            variant="secondary"
            className="h-12 text-label"
            disabled={isPending}
            onClick={props.onCancel}
          >
            Discard changes
          </Button>
        ) : null}
      </div>
    </form>
  );
}
