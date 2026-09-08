import { cn } from "@/lib/cn";

type IconProps = {
  className?: string;
};

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

export function BellIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-6", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M14 21H10M18 8C18 6.4087 17.3679 4.8826 16.2426 3.7574C15.1174 2.6321 13.5913 2 12 2C10.4087 2 8.8826 2.6321 7.7574 3.7574C6.6321 4.8826 6 6.4087 6 8C6 11.0902 5.2205 13.206 4.3497 14.6054C3.6151 15.7859 3.2479 16.3761 3.2613 16.5408C3.2762 16.7231 3.3149 16.7926 3.4618 16.9016C3.5945 17 4.1926 17 5.3889 17H18.6111C19.8074 17 20.4055 17 20.5382 16.9016C20.6851 16.7926 20.7238 16.7231 20.7387 16.5408C20.7521 16.3761 20.3849 15.7859 19.6503 14.6054C18.7795 13.206 18 11.0902 18 8Z"
        stroke="currentColor"
        strokeWidth="2"
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
