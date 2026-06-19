"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ChevronDownIcon } from "./icons";
import type { ChangeEvent, SelectHTMLAttributes } from "react";

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children" | "onChange"
> & {
  label?: string;
  helper?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
  menuPlacement?: "top" | "bottom";
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
};

export function Select({
  label,
  helper,
  options,
  placeholder = "Select an Option",
  className,
  containerClassName,
  menuPlacement = "bottom",
  value = "",
  onChange,
  disabled,
  name,
  id: idProp,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const listboxId = `${id}-listbox`;

  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleSelect = (optionValue: string) => {
    setOpen(false);

    if (!onChange) return;

    const syntheticEvent = {
      target: { value: optionValue, name: name ?? "" },
      currentTarget: { value: optionValue, name: name ?? "" },
    } as ChangeEvent<HTMLSelectElement>;

    onChange(syntheticEvent);
  };

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      {label && (
        <span id={`${id}-label`} className="text-label font-medium text-white">
          {label}
        </span>
      )}
      <div className="relative" ref={containerRef}>
        {name ? <input type="hidden" name={name} value={value} /> : null}
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-labelledby={label ? `${id}-label` : undefined}
          className={cn(
            "h-12 w-full rounded-card border border-border-default bg-surface-default px-[17px] pr-10 text-left text-input font-medium outline-none focus:border-brand-chip-border",
            value ? "text-white" : "text-text-muted",
            disabled && "cursor-not-allowed opacity-50",
            className,
          )}
          onClick={() => {
            if (!disabled) {
              setOpen((isOpen) => !isOpen);
            }
          }}
        >
          {displayLabel}
        </button>
        <ChevronDownIcon
          className={cn(
            "pointer-events-none absolute right-[15px] top-1/2 -translate-y-1/2 text-white transition-transform",
            open && "rotate-180",
          )}
        />
        {open ? (
          <ul
            id={listboxId}
            role="listbox"
            aria-labelledby={label ? `${id}-label` : id}
            className={cn(
              "absolute left-0 right-0 z-50 overflow-hidden rounded-card border border-border-default bg-input-fill",
              menuPlacement === "top"
                ? "bottom-full mb-1"
                : "top-full mt-1",
            )}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={value === option.value}
                className={cn(
                  "cursor-pointer px-[17px] py-3 text-input font-medium text-white hover:bg-surface-elevated",
                  index < options.length - 1 && "border-b border-white",
                  value === option.value && "bg-surface-elevated",
                )}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {helper ? <p className="text-helper text-text-muted">{helper}</p> : null}
    </div>
  );
}
