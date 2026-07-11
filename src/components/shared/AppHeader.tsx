import type { ReactNode } from "react";
import { LogoLink } from "./LogoLink";

type AppHeaderProps = {
  actions?: ReactNode;
};

export function AppHeader({ actions }: AppHeaderProps) {
  return (
    <header className="flex h-[var(--layout-header-height)] shrink-0 items-center border-b border-border-default bg-base-black">
      <div className="mx-auto flex w-full max-w-[var(--layout-max-width)] items-center justify-between px-[var(--layout-page-padding)]">
        <LogoLink width={92} height={32} />
        {actions ? (
          <div className="flex shrink-0 items-center">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
