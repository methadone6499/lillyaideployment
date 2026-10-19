import { cn } from "@/lib/cn";

type IconProps = {
  className?: string;
};

export function EyeIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-5", className)}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M1.667 10S4.583 4.167 10 4.167 18.333 10 18.333 10 15.417 15.833 10 15.833 1.667 10 1.667 10Z"
        stroke="currentColor"
        strokeWidth="1.667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.667" />
    </svg>
  );
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-5", className)}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M2.5 2.5 17.5 17.5M8.233 4.383A8.24 8.24 0 0 1 10 4.167C15.417 4.167 18.333 10 18.333 10a14.17 14.17 0 0 1-2.633 3.45M5.15 5.15A14.15 14.15 0 0 0 1.667 10S4.583 15.833 10 15.833a8.287 8.287 0 0 0 4.85-1.65M8.233 8.233a2.5 2.5 0 0 0 3.534 3.534"
        stroke="currentColor"
        strokeWidth="1.667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SpinnerIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-5 animate-spin motion-reduce:animate-none", className)}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <circle
        cx="10"
        cy="10"
        r="7.5"
        stroke="currentColor"
        strokeWidth="1.667"
        opacity="0.25"
      />
      <path
        d="M10 2.5A7.5 7.5 0 0 1 17.5 10"
        stroke="currentColor"
        strokeWidth="1.667"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ArrowNarrowLeftIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-5", className)}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M15 10H5M5 10L10 15M5 10L10 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowNarrowRightIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-5", className)}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M5 10H15M15 10L10 5M15 10L10 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-4", className)}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronUpIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-6", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 15L12 9L18 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FilterLinesIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-5", className)}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M2.5 5H17.5M5 10H15M7.5 15H12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-6", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-6", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M9 18L15 12L9 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-5", className)}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M10 4V16M4 10H16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-5", className)}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M15 5L5 15M5 5L15 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HistoryIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-5", className)}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M3.5 3V6.5H7M3.8 6.25C5.1 3.9 7.55 2.5 10.25 2.6C14.3 2.75 17.5 6.05 17.5 10.1C17.5 14.2 14.15 17.5 10 17.5C6.7 17.5 3.9 15.4 2.9 12.45M10 6V10L12.75 11.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
