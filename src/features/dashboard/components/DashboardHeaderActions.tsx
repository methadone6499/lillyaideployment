"use client";

import { BellIcon, ChevronDownIcon } from "@/components/ui/icons";
import { useCurrentUserQuery } from "@/features/auth";
import { clearAuthToken } from "@/lib/authToken";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { dashboardNotifications } from "../data/dashboardData";
import type { DashboardNotification } from "../types";
import { formatDisplayName } from "../utils/formatDisplayName";

type OpenPanel = "notifications" | "account" | null;

function NotificationItem({ notification }: { notification: DashboardNotification }) {
  return (
    <li className="border-b border-border-default px-4 py-3 last:border-b-0">
      <p className="text-input font-medium text-text-heading">{notification.message}</p>
      {notification.reportName ? (
        <p className="mt-1 text-input text-brand">{notification.reportName}</p>
      ) : null}
      <p className="mt-1 text-helper text-text-muted">{notification.timestamp}</p>
    </li>
  );
}

export function DashboardHeaderActions() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const { data: user } = useCurrentUserQuery();
  const displayName = user
    ? formatDisplayName(user.first_name, user.last_name)
    : "";

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

  const handleLogout = () => {
    clearAuthToken();
    setOpenPanel(null);
    router.push("/");
  };

  return (
    <div ref={containerRef} className="flex items-center gap-4">
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
          {dashboardNotifications.length > 0 ? (
            <span className="absolute right-2 top-2 size-2 rounded-full bg-brand" />
          ) : null}
        </button>

        {openPanel === "notifications" ? (
          <div
            id="dashboard-notifications-panel"
            role="region"
            aria-label="Notifications"
            className="absolute right-0 top-full z-50 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-card border border-border-default bg-input-fill shadow-lg"
          >
            <div className="border-b border-border-default px-4 py-3">
              <p className="text-label font-medium text-text-heading">Notifications</p>
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
        className="h-8 w-px shrink-0 bg-border-default"
      />

      <div className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={openPanel === "account"}
          aria-controls="dashboard-account-menu"
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-field border border-border-default bg-surface-default px-4 text-label font-medium text-text-heading transition-colors hover:bg-surface-elevated",
            openPanel === "account" && "bg-surface-elevated",
          )}
          onClick={() => togglePanel("account")}
        >
          <span>My Account</span>
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
            className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-card border border-border-default bg-input-fill shadow-lg"
          >
            <div className="border-b border-border-default px-4 py-3">
              <p className="text-helper text-text-muted">Signed in as</p>
              <p className="mt-0.5 text-input font-medium text-brand">
                {displayName}
              </p>
            </div>
            <button
              type="button"
              role="menuitem"
              className="w-full px-4 py-3 text-left text-input font-medium text-text-heading transition-colors hover:bg-surface-elevated"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
