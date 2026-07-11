import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type AppHeaderProps = {
  actions?: ReactNode;
};

export function AppHeader({ actions }: AppHeaderProps) {
  return (
    <header className="flex h-[var(--layout-header-height)] shrink-0 items-center border-b border-border-default bg-base-black">
      <div className="mx-auto flex w-full max-w-[var(--layout-max-width)] items-center justify-between px-[var(--layout-page-padding)]">
        <Link href="/" className="inline-flex shrink-0">
          <Image
            src="/lillyailogo.svg"
            alt="Lilly AI"
            width={92}
            height={32}
            priority
          />
        </Link>
        {actions ? (
          <div className="flex shrink-0 items-center">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
