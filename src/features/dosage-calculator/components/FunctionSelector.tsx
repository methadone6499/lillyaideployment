"use client";

import { Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { KeyboardEvent, ReactNode } from "react";

type FunctionSelectorOption = {
  value: string;
  label: string;
};

type FunctionSelectorProps = {
  id: string;
  label: ReactNode;
  options: readonly FunctionSelectorOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: ReactNode;
  className?: string;
};

export function FunctionSelector({
  id,
  label,
  options,
  value,
  onChange,
  required = false,
  error,
  className,
}: FunctionSelectorProps) {
  const labelId = `${id}-label`;
  const errorId = error ? `${id}-error` : undefined;
  const selectedIndex = options.findIndex((option) => option.value === value);
  const tabbableIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const selectAndFocus = (index: number) => {
    const option = options[index];
    if (!option) return;

    onChange(option.value);
    document.getElementById(`${id}-${option.value}`)?.focus();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % options.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + options.length) % options.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = options.length - 1;
    }

    if (nextIndex === null) return;

    event.preventDefault();
    selectAndFocus(nextIndex);
  };

  return (
    <div
      id={id}
      role="radiogroup"
      aria-labelledby={labelId}
      aria-describedby={errorId}
      aria-invalid={error ? true : undefined}
      aria-required={required || undefined}
      className={cn("flex flex-col gap-5", className)}
    >
      <div id={labelId} className="text-label font-medium text-white">
        {label}
      </div>
      <div className="flex flex-wrap gap-3">
        {options.map((option, index) => {
          const selected = option.value === value;

          return (
            <Chip
              key={option.value}
              id={`${id}-${option.value}`}
              role="radio"
              aria-checked={selected}
              aria-pressed={undefined}
              tabIndex={index === tabbableIndex ? 0 : -1}
              selected={selected}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {option.label}
            </Chip>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-helper text-status-running">
          {error}
        </p>
      ) : null}
    </div>
  );
}
