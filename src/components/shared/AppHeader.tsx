import type { ReactNode } from "react";
import { LogoLink } from "./LogoLink";

type AppHeaderProps = {
  actions?: ReactNode;
};

export function AppHeader({ actions }: AppHeaderProps) {
  return (
    <header className="flex h-[var(--layout-header-height)] shrink-0 items-center border-b border-border-default bg-base-black">
      <div className="mx-auto flex w-full max-w-[var(--layout-max-width)] items-center justify-between px-4 sm:px-6 lg:px-12">
        <LogoLink className="inline-flex shrink-0 [&_img]:h-auto [&_img]:w-[180px]" />
        {actions ? (
          <div className="flex shrink-0 items-center">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
