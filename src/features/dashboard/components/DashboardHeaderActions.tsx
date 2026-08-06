"use client";

import { BellIcon, ChevronDownIcon } from "@/components/ui/icons";
import { useLogoutMutation } from "@/features/auth";
import { cn } from "@/lib/cn";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { dashboardNotifications } from "../data/dashboardData";
import type { DashboardNotification } from "../types";

type OpenPanel = "notifications" | "account" | null;

function NotificationItem({ notification }: { notification: DashboardNotification }) {
  const hasReportLeadIn = notification.message.startsWith("Your report");
  const trailingMessage = hasReportLeadIn
    ? notification.message.slice("Your report".length).trim()
    : notification.message;

  return (
    <li className="grid min-h-19.75 grid-cols-[minmax(0,1fr)_20px] items-center gap-3 border-b border-white/6 px-5 py-2.75 last:border-b-0">
      <div className="flex min-w-0 flex-col gap-3">
        <p className="text-input font-normal leading-normal text-white/72">
          {hasReportLeadIn ? "Your report " : null}
          {notification.reportName ? (
            <span className="font-medium text-white/92">
              {notification.reportName}
            </span>
          ) : null}
          {trailingMessage ? ` ${trailingMessage}` : null}
        </p>
        <p className="text-helper leading-normal tracking-[-0.12px] text-white/56">
          {notification.timestamp}
        </p>
      </div>
      <span aria-hidden className="flex size-5 items-center justify-center">
        <Image
          src="/notification-chevron.svg"
          alt=""
          width={7}
          height={12}
          className="rotate-180"
        />
      </span>
    </li>
  );
}

export function DashboardHeaderActions() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(
    dashboardNotifications.length > 0,
  );
  const logoutMutation = useLogoutMutation();

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
          aria-label="Notifications"
          aria-haspopup="true"
          aria-expanded={openPanel === "notifications"}
          aria-controls="dashboard-notifications-panel"
          className={cn(
            "relative flex size-11 items-center justify-center rounded-field border border-border-default bg-surface-default text-text-primary transition-colors hover:bg-surface-elevated",
            openPanel === "notifications" && "bg-surface-elevated",
          )}
          onClick={() => togglePanel("notifications")}
        >
          <BellIcon className="size-5" />
          {hasUnreadNotifications ? (
            <span className="absolute right-2 top-2 size-2 rounded-full bg-brand" />
          ) : null}
        </button>

        {openPanel === "notifications" ? (
          <div
            id="dashboard-notifications-panel"
            role="region"
            aria-label="Notifications"
            className="fixed left-4 right-4 top-[calc(var(--layout-header-height)+0.5rem)] z-50 overflow-hidden rounded-button bg-[#222] shadow-[0_36px_174px_rgba(0,0,0,0.13),0_10.63px_51.859px_rgba(0,0,0,0.09),0_2.555px_15.698px_rgba(0,0,0,0.08),0_-0.567px_1.537px_rgba(0,0,0,0.06),0_-1.483px_0_rgba(0,0,0,0.05),0_-1.147px_0_rgba(0,0,0,0.04)] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(400px,calc(100vw-2rem))]"
          >
            <div className="flex h-13 items-center justify-between gap-4 border-b border-white/6 px-5">
              <p className="text-label font-medium text-white/92">
                Notifications
              </p>
              <button
                type="button"
                className="flex shrink-0 items-center gap-1 text-helper font-medium tracking-[-0.12px] text-white/72 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                onClick={() => setHasUnreadNotifications(false)}
              >
                <span
                  aria-hidden
                  className="flex size-4 items-center justify-center overflow-hidden rounded-step-badge border border-white/16 bg-white/12"
                >
                  <Image
                    src="/notification-check.svg"
                    alt=""
                    width={7}
                    height={5}
                  />
                </span>
                Mark All as read
              </button>
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {dashboardNotifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div
        aria-hidden
        className="hidden h-8 w-px shrink-0 bg-border-default sm:block"
      />

      <div className="relative">
        <button
          type="button"
          aria-label="Account menu"
          aria-haspopup="menu"
          aria-expanded={openPanel === "account"}
          aria-controls="dashboard-account-menu"
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-field border border-border-default bg-surface-default px-3 text-label font-medium text-text-heading transition-colors hover:bg-surface-elevated sm:px-4",
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
            className="absolute right-0 top-full z-50 mt-2 w-[min(280px,calc(100vw-2rem))] overflow-hidden rounded-button bg-[#222] shadow-[0_36px_174px_rgba(0,0,0,0.13),0_10.63px_51.859px_rgba(0,0,0,0.09),0_2.555px_15.698px_rgba(0,0,0,0.08),0_-0.567px_1.537px_rgba(0,0,0,0.06),0_-1.483px_0_rgba(0,0,0,0.05),0_-1.147px_0_rgba(0,0,0,0.04)]"
          >
            <div
              role="presentation"
              className="flex h-13.25 items-center justify-between border-b border-white/6 pl-5.5 pr-4.5"
            >
              <p className="text-body-lg font-medium leading-normal text-white">
                Company Menu
              </p>
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
            </div>
            <button
              type="button"
              role="menuitem"
              className="m-2 flex h-12 w-[calc(100%-16px)] items-center justify-between rounded-card bg-[rgba(217,34,68,0.16)] pl-3.5 pr-4.5 text-left text-body-lg font-medium leading-normal text-[#d92244] transition-colors hover:bg-[rgba(217,34,68,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d92244] disabled:opacity-60"
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
    </div>
  );
}
