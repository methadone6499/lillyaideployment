"use client";

import { ChevronDownIcon } from "@/components/ui/icons";
import {
  getActiveContext,
  useAuthUser,
  useLogoutMutation,
  type ContextType,
  type EffectiveRole,
} from "@/features/auth";
import { LeaveCompanyDialog } from "@/features/seat-management";
import { cn } from "@/lib/cn";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type OpenPanel = "account" | null;

export type AccountMenuVariant =
  | "standard"
  | "company-admin"
  | "seat"
  | "reviewer"
  | "super-admin";

function getAccountMenuVariant(
  contextType: ContextType | undefined,
  contextRole: EffectiveRole | undefined,
): AccountMenuVariant {
  if (contextType === "global" && contextRole === "super_admin") {
    return "super-admin";
  }

  if (contextType === "reviewer" && contextRole === "reviewer") {
    return "reviewer";
  }

  if (contextType === "company" && contextRole === "company_admin") {
    return "company-admin";
  }

  if (contextType === "company" && contextRole === "company_seat_user") {
    return "seat";
  }

  return "standard";
}

export function DashboardHeaderActions() {
  const router = useRouter();
  const { authMe } = useAuthUser();
  const activeContext = getActiveContext(authMe);
  const accountMenuVariant = getAccountMenuVariant(
    activeContext?.type,
    activeContext?.role,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [leaveCompanyOpen, setLeaveCompanyOpen] = useState(false);
  const logoutMutation = useLogoutMutation();
  const contextMenuItem =
    accountMenuVariant === "company-admin"
      ? { href: "/company-admin/dashboard", label: "Company Menu" }
      : accountMenuVariant === "super-admin"
        ? { href: "/super-admin/dashboard", label: "Admin Menu" }
        : accountMenuVariant === "reviewer"
          ? { href: "/reviewer/assignments", label: "Reviewer Menu" }
        : null;
  const showBilling =
    accountMenuVariant !== "seat" &&
    accountMenuVariant !== "reviewer" &&
    accountMenuVariant !== "super-admin";

  useEffect(() => {
    if (!openPanel) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenPanel(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenPanel(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openPanel]);

  const togglePanel = (panel: Exclude<OpenPanel, null>) => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  const handleLogout = async () => {
    setOpenPanel(null);

    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Local session cleanup always runs inside performLogout.
    }

    router.push("/login");
  };

  return (
    <div ref={containerRef} className="flex items-center gap-2 sm:gap-4">
      <div className="relative">
        <button
          type="button"
          ref={accountButtonRef}
          aria-label="Account menu"
          aria-haspopup="menu"
          aria-expanded={openPanel === "account"}
          aria-controls="dashboard-account-menu"
          className={cn(
            "inline-flex h-12 items-center gap-2 rounded-header-control border border-border-default bg-surface-default px-3 text-label font-medium text-text-heading transition-colors hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-4",
            openPanel === "account" && "bg-surface-elevated",
          )}
          onClick={() => togglePanel("account")}
        >
          <span className="hidden sm:inline">My Account</span>
          <ChevronDownIcon
            className={cn(
              "text-white transition-transform",
              openPanel === "account" && "rotate-180",
            )}
          />
        </button>

        {openPanel === "account" ? (
          <div
            id="dashboard-account-menu"
            role="menu"
            aria-label="Account menu"
            className="absolute right-0 top-full z-50 mt-2 w-[min(280px,calc(100vw-2rem))] overflow-hidden rounded-surface bg-[#222] shadow-[0_36px_174px_rgba(0,0,0,0.13),0_10.63px_51.859px_rgba(0,0,0,0.09),0_2.555px_15.698px_rgba(0,0,0,0.08),0_-0.567px_1.537px_rgba(0,0,0,0.06),0_-1.483px_0_rgba(0,0,0,0.05),0_-1.147px_0_rgba(0,0,0,0.04)]"
          >
            {contextMenuItem ? (
              <Link
                href={contextMenuItem.href}
                role="menuitem"
                className="flex h-13.25 items-center justify-between border-b border-white/6 pl-5.5 pr-4.5 text-body-lg font-medium leading-normal text-white transition-colors hover:bg-white/6 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
                onClick={() => setOpenPanel(null)}
              >
                <span>{contextMenuItem.label}</span>
                <span
                  aria-hidden
                  className="flex size-5 items-center justify-center"
                >
                  <Image
                    src="/notification-chevron.svg"
                    alt=""
                    width={7}
                    height={12}
                    className="rotate-180"
                  />
                </span>
              </Link>
            ) : null}
            {accountMenuVariant === "seat" ? (
              <button
                type="button"
                role="menuitem"
                className="mx-2 mt-2 flex h-12 w-[calc(100%-16px)] items-center rounded-field px-3.5 text-left text-body-lg font-medium leading-normal text-status-danger transition-colors hover:bg-[rgba(217,34,68,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                onClick={() => {
                  setOpenPanel(null);
                  accountButtonRef.current?.focus();
                  setLeaveCompanyOpen(true);
                }}
              >
                Leave company
              </button>
            ) : null}
            {showBilling ? (
              <Link
                href="/settings/billing"
                role="menuitem"
                className="mx-2 mt-2 flex h-12 items-center justify-between rounded-field px-3.5 text-body-lg font-medium leading-normal text-white transition-colors hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                onClick={() => setOpenPanel(null)}
              >
                <span>Billing</span>
                <span
                  aria-hidden
                  className="flex size-5 items-center justify-center"
                >
                  <Image
                    src="/notification-chevron.svg"
                    alt=""
                    width={7}
                    height={12}
                    className="rotate-180"
                  />
                </span>
              </Link>
            ) : null}
            <button
              type="button"
              role="menuitem"
              className="m-2 flex h-12 w-[calc(100%-16px)] items-center justify-between rounded-field bg-[rgba(217,34,68,0.16)] pl-3.5 pr-4.5 text-left text-body-lg font-medium leading-normal text-status-danger transition-colors hover:bg-[rgba(217,34,68,0.24)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-muted"
              disabled={logoutMutation.isPending}
              onClick={() => void handleLogout()}
            >
              <span>
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </span>
              <Image
                src="/account-logout.svg"
                alt=""
                width={20}
                height={20}
                aria-hidden
                className="size-5 shrink-0"
              />
            </button>
          </div>
        ) : null}
      </div>
      {leaveCompanyOpen && accountMenuVariant === "seat" ? (
        <LeaveCompanyDialog onClose={() => setLeaveCompanyOpen(false)} />
      ) : null}
    </div>
  );
}
