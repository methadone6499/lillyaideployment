import { cn } from "@/lib/cn";

type IconProps = {
  className?: string;
};

export function ArrowNarrowRightSmallIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-[18px]", className)}
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

export function CheckIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-[18px] shrink-0 text-brand", className)}
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden
    >
      <path
        d="M3.75 9L7.5 12.75L14.25 5.25"
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
      className={cn("size-6 text-white/80", className)}
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

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-5 text-white", className)}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M6.5 3.5H8.75L10 7.25L8.25 8.5C9.15 10.45 10.55 11.85 12.5 12.75L13.75 11L17.5 12.25V14.5C17.5 15.05 17.05 15.5 16.5 15.5C9.7 15.5 4.5 10.3 4.5 3.5C4.5 2.95 4.95 2.5 5.5 2.5H6.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-5 text-white", className)}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M3.5 5.5H16.5V14.5H3.5V5.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 6.5L10 11L16.5 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SocialXIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-6 text-white/32", className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M13.53 10.77L20.77 3H18.9L12.81 9.54L7.9 3H2L9.63 13.23L2 21H3.87L10.35 14.46L15.55 21H21.45L13.53 10.77ZM11.58 13.52L10.9 12.62L4.62 4.12H7.45L12.55 11.02L13.23 11.92L19.95 20.04H17.12L11.58 13.52Z" />
    </svg>
  );
}

export function SocialInstagramIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-7 text-white/32", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  );
}

export function SocialLinkedInIcon({ className }: IconProps) {
  return (
    <svg
      className={cn("size-7 text-white/32", className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M6.5 9.5H3.75V20.25H6.5V9.5ZM5.125 3.75C4.09 3.75 3.25 4.59 3.25 5.625C3.25 6.66 4.09 7.5 5.125 7.5C6.16 7.5 7 6.66 7 5.625C7 4.59 6.16 3.75 5.125 3.75ZM9.75 9.5H12.35V10.85H12.4C12.8 10.05 13.85 9.2 15.45 9.2C18.75 9.2 20.25 11.45 20.25 15.2V20.25H17.5V15.65C17.5 14.45 17.25 12.85 15.45 12.85C13.45 12.85 12.95 14.25 12.95 15.55V20.25H10.2V9.5H9.75Z" />
    </svg>
  );
}
