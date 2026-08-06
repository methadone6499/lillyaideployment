"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ChevronDownIcon } from "./icons";
import type {
  ChangeEvent,
  KeyboardEvent,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children" | "onChange"
> & {
  label?: string;
  helper?: ReactNode;
  error?: ReactNode;
  options: readonly SelectOption[];
  placeholder?: string;
  clearable?: boolean;
  clearLabel?: string;
  containerClassName?: string;
  menuPlacement?: "top" | "bottom";
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
};

export function Select({
  label,
  helper,
  error,
  options,
  placeholder = "Select an Option",
  clearable = false,
  clearLabel = "Nothing",
  className,
  containerClassName,
  menuPlacement = "bottom",
  value = "",
  onChange,
  disabled,
  name,
  id: idProp,
  required,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const labelId = `${id}-label`;
  const listboxId = `${id}-listbox`;
  const helperId = helper && !error ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy =
    [ariaDescribedBy, helperId, errorId].filter(Boolean).join(" ") || undefined;
  const hasError = Boolean(error);

  const menuOptions = clearable
    ? [{ value: "", label: clearLabel }, ...options]
    : options;

  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;
  const activeOptionId =
    open && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const findSelectedIndex = () => {
    const selectedIndex = menuOptions.findIndex(
      (option) => option.value === value,
    );

    return selectedIndex >= 0 ? selectedIndex : 0;
  };

  const openMenu = (initialIndex = findSelectedIndex()) => {
    if (menuOptions.length === 0) return;

    setActiveIndex(initialIndex);
    setOpen(true);
  };

  const handleSelect = (optionValue: string) => {
    setOpen(false);
    triggerRef.current?.focus();

    if (!onChange) return;

    const syntheticEvent = {
      target: { value: optionValue, name: name ?? "" },
      currentTarget: { value: optionValue, name: name ?? "" },
    } as ChangeEvent<HTMLSelectElement>;

    onChange(syntheticEvent);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || menuOptions.length === 0) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (open && activeIndex >= 0) {
        handleSelect(menuOptions[activeIndex].value);
      } else {
        openMenu();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!open) {
        openMenu();
      } else {
        setActiveIndex((current) =>
          Math.min(current + 1, menuOptions.length - 1),
        );
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!open) {
        openMenu(
          value === "" && !clearable
            ? menuOptions.length - 1
            : findSelectedIndex(),
        );
      } else {
        setActiveIndex((current) => Math.max(current - 1, 0));
      }
      return;
    }

    if (open && event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (open && event.key === "End") {
      event.preventDefault();
      setActiveIndex(menuOptions.length - 1);
      return;
    }

    if (open && event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      {label && (
        <span id={labelId} className="text-label font-medium text-white">
          {label}
          {required && <span className="text-brand"> *</span>}
        </span>
      )}
      <div className="relative" ref={containerRef}>
        {name ? (
          <input
            type="hidden"
            name={name}
            value={value}
            disabled={disabled}
          />
        ) : null}
        <button
          type="button"
          id={id}
          ref={triggerRef}
          disabled={disabled}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-describedby={describedBy}
          aria-invalid={hasError ? true : ariaInvalid}
          aria-required={required || undefined}
          aria-labelledby={label ? labelId : undefined}
          className={cn(
            "h-12 w-full rounded-card border border-border-default bg-surface-default px-[17px] pr-10 text-left text-input font-medium outline-none focus:border-brand-chip-border",
            value ? "text-white" : "text-text-muted",
            hasError && "border-status-running",
            disabled && "cursor-not-allowed opacity-50",
            className,
          )}
          onClick={() => {
            if (!disabled) {
              if (open) {
                setOpen(false);
              } else {
                openMenu();
              }
            }
          }}
          onKeyDown={handleKeyDown}
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
            aria-labelledby={label ? labelId : id}
            className={cn(
              "absolute left-0 right-0 z-50 overflow-hidden rounded-card border border-border-default bg-input-fill",
              menuPlacement === "top"
                ? "bottom-full mb-1"
                : "top-full mt-1",
            )}
          >
            {menuOptions.map((option, index) => (
              <li
                key={option.value || "__clear__"}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={value === option.value}
                className={cn(
                  "cursor-pointer px-[17px] py-3 text-input font-medium hover:bg-surface-elevated",
                  option.value === "" ? "text-text-muted" : "text-white",
                  index < menuOptions.length - 1 && "border-b border-white",
                  (value === option.value || activeIndex === index) &&
                    "bg-surface-elevated",
                )}
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => setActiveIndex(index)}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {helper && !error ? (
        <p id={helperId} className="text-helper text-text-muted">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-helper text-status-running">
          {error}
        </p>
      ) : null}
    </div>
  );
}
