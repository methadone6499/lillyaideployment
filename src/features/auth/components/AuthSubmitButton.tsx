"use client";

import { ArrowNarrowRightIcon, Button } from "@/components/ui";
import type { ReactNode } from "react";

type AuthSubmitButtonProps = {
  children: ReactNode;
  isSubmitting?: boolean;
};

export function AuthSubmitButton({
  children,
  isSubmitting = false,
}: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      trailingIcon={
        isSubmitting ? null : (
          <ArrowNarrowRightIcon className="size-[18px]" />
        )
      }
      className="w-full gap-1.5 !rounded-button border-[1.75px] border-[rgba(1,176,89,0.72)] !bg-landing-emerald-gradient px-6 !text-[16px] !font-medium !text-brand-foreground shadow-landing-emerald-glow hover:!bg-landing-emerald-gradient hover:!opacity-95 disabled:!border-border-subtle disabled:!bg-none disabled:!bg-surface-default disabled:!text-text-muted disabled:!shadow-none disabled:hover:!opacity-100"
    >
      {children}
    </Button>
  );
}
