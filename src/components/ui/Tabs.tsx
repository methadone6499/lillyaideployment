"use client";

import { cn } from "@/lib/cn";

export type TabItem<T extends string> = {
  id: T;
  label: string;
};

type TabsProps<T extends string> = {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  className?: string;
};

export function Tabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className,
}: TabsProps<T>) {
  return (
    <div className={cn("relative border-b border-border-default", className)}>
      <div className="flex items-center">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "px-4 py-3 text-label transition-colors",
                isActive
                  ? "font-medium text-white"
                  : "font-normal text-text-step",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        className="absolute bottom-0 h-0.5 rounded-t-[10px] bg-brand transition-all"
        style={{
          width: 162,
          left: tabs.findIndex((t) => t.id === activeTab) * 162,
        }}
      />
    </div>
  );
}
