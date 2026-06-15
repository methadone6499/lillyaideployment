import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type LandingSectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
};

export function LandingSection({
  id,
  children,
  className,
  containerClassName,
}: LandingSectionProps) {
  return (
    <section
      id={id}
      className={cn("w-full px-landing-section-x py-landing-section-y", className)}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-landing-section",
          containerClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
