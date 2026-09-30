"use client";

import { useState, type FormEvent } from "react";

import { Button, TextField } from "@/components/ui";
import { companyNameSchema } from "@/features/billing";

import type {
  CustomOffer,
  OfferTerms,
} from "../schemas/customSubscriptionSchemas";
import {
  formatUsdAmountInput,
  parsePositiveIntegerInput,
  parseUsdAmountInput,
} from "../utils/formatCustomSubscription";

type AdminOfferDraftFormProps = {
  offer?: CustomOffer | null;
  defaultCompanyName: string;
  defaultSeats: number;
  defaultReports: number;
  isPending: boolean;
  submitLabel: string;
  onSubmit: (terms: OfferTerms) => void;
  onCancel: () => void;
};

export function AdminOfferDraftForm({
  offer = null,
  defaultCompanyName,
  defaultSeats,
  defaultReports,
  isPending,
  submitLabel,
  onSubmit,
  onCancel,
}: AdminOfferDraftFormProps) {
  const [companyName, setCompanyName] = useState(
    offer?.company_name ?? defaultCompanyName,
  );
  const [amount, setAmount] = useState(
    offer ? formatUsdAmountInput(offer.amount_minor) : "",
  );
  const [seats, setSeats] = useState(String(offer?.seats ?? defaultSeats));
  const [reports, setReports] = useState(String(offer?.reports ?? defaultReports));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPending) {
      return;
    }

    const errors: Record<string, string> = {};
    const parsedCompanyName = companyNameSchema.safeParse(companyName);
    const amountMinor = parseUsdAmountInput(amount);
    const parsedSeats = parsePositiveIntegerInput(seats);
    const parsedReports = parsePositiveIntegerInput(reports);

    if (!parsedCompanyName.success) {
      errors.company_name = "Enter a company name up to 200 characters.";
    }

    if (amountMinor === null) {
      errors.amount_minor = "Enter a monthly USD price such as 750 or 750.50.";
    }

    if (parsedSeats === null) {
      errors.seats = "Enter at least 1 seat.";
    }

    if (parsedReports === null) {
      errors.reports = "Enter at least 1 report per month.";
    }

    setFieldErrors(errors);

    if (
      !parsedCompanyName.success ||
      amountMinor === null ||
      parsedSeats === null ||
      parsedReports === null
    ) {
      return;
    }

    onSubmit({
      company_name: parsedCompanyName.data,
      amount_minor: amountMinor,
      currency: "usd",
      seats: parsedSeats,
      reports: parsedReports,
    });
  };

  return (
    <form
      className="flex flex-col gap-4 rounded-card border border-border-default bg-surface-subtle p-5"
      noValidate
      onSubmit={handleSubmit}
    >
      <TextField
        label="Company name"
        required
        maxLength={200}
        value={companyName}
        error={fieldErrors.company_name}
        disabled={isPending}
        onChange={(event) => setCompanyName(event.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          label="Price / month (USD)"
          required
          inputMode="decimal"
          placeholder="750.00"
          value={amount}
          error={fieldErrors.amount_minor}
          disabled={isPending}
          onChange={(event) => setAmount(event.target.value)}
        />
        <TextField
          label="Seats"
          required
          inputMode="numeric"
          value={seats}
          error={fieldErrors.seats}
          disabled={isPending}
          onChange={(event) => setSeats(event.target.value)}
        />
        <TextField
          label="Reports / month"
          required
          inputMode="numeric"
          value={reports}
          error={fieldErrors.reports}
          disabled={isPending}
          onChange={(event) => setReports(event.target.value)}
        />
      </div>
      <p className="text-helper text-text-muted">
        Billed monthly in USD. Seats may be lower than the company uses today;
        the customer must free seats before accepting.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" className="h-11 text-label" disabled={isPending}>
          {submitLabel}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-11 text-label"
          disabled={isPending}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
