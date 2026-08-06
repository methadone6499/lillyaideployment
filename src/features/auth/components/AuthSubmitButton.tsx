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
      className="!h-[var(--layout-auth-button-height)] w-full gap-1.5 !rounded-[10.5px] border-[1.75px] border-[rgba(1,176,89,0.72)] !bg-landing-emerald-gradient px-6 !text-[16px] !font-medium text-white shadow-landing-emerald-glow hover:!bg-landing-emerald-gradient hover:!opacity-95"
    >
      {children}
    </Button>
  );
}
