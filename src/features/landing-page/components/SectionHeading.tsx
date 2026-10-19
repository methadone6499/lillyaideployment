import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type SectionHeadingProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export function SectionHeading({
  title,
  subtitle,
  align = "center",
  className,
  titleClassName,
  subtitleClassName,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      <h2
        className={cn(
          "text-landing-section-size leading-landing-section-line font-medium tracking-[-0.01em] text-balance text-landing-text-heading",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "max-w-[70ch] text-landing-body-lg-size leading-landing-body-lg-line text-landing-text-subtle",
            subtitleClassName,
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
