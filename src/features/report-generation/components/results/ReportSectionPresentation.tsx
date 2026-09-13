"use client";

import { Badge, ChevronDownIcon, ChevronUpIcon, StatusPill } from "@/components/ui";
import { cn } from "@/lib/cn";
import { Fragment, useId, useRef, type ReactNode, type RefObject } from "react";
import { useSingleExpandedSection } from "../../hooks/useSingleExpandedSection";
import type { ReportSectionContent, SectionStatus } from "../../types";
import { SectionContentRenderer } from "./SectionContentRenderer";

export type ReportSectionPresentationItem = {
  id: string;
  order: number;
  title: string;
  description: string;
  error?: string | null;
  status?: SectionStatus;
  canExpand?: boolean;
  content?: ReportSectionContent;
  skipFirstHeading?: boolean;
};

export type ReportSectionPresentationProps<
  T extends ReportSectionPresentationItem = ReportSectionPresentationItem,
> = {
  items: readonly T[];
  expandedId?: string | null;
  onToggle?: (id: string, element: HTMLDivElement) => void;
  /** Uncontrolled only: open the first expandable section by default. */
  defaultExpandFirst?: boolean;
  emptyMessage?: ReactNode;
  renderSection?: (
    item: T,
    ctx: {
      expanded: boolean;
      onToggle: (element: HTMLDivElement) => void;
    },
  ) => ReactNode;
  renderHeaderTrailing?: (
    item: T,
    ctx: { expanded: boolean },
  ) => ReactNode;
  renderBody?: (
    item: T,
    ctx: { expanded: boolean },
  ) => ReactNode;
  renderAfterContent?: (item: T) => ReactNode;
};

type ReportSectionAccordionFrameProps = {
  order: number;
  title: string;
  description?: string;
  error?: string | null;
  expanded: boolean;
  canExpand: boolean;
  onToggle: (element: HTMLDivElement) => void;
  headerTrailing?: ReactNode;
  children?: ReactNode;
  rootRef?: RefObject<HTMLDivElement | null>;
};

export function ReportSectionAccordionFrame({
  order,
  title,
  description,
  error,
  expanded,
  canExpand,
  onToggle,
  headerTrailing,
  children,
  rootRef,
}: ReportSectionAccordionFrameProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const resolvedRef = rootRef ?? innerRef;
  const panelId = useId();

  const toggle = () => {
    if (resolvedRef.current && canExpand) {
      onToggle(resolvedRef.current);
    }
  };

  return (
    <div
      ref={resolvedRef}
      className={cn(
        "rounded-card border",
        expanded
          ? "border-brand-border bg-brand-bg"
          : "border-border-default bg-surface-default",
      )}
    >
      <div className="flex items-center gap-3 px-4 py-6 sm:gap-5 sm:px-8">
        <button
          type="button"
          onClick={toggle}
          disabled={!canExpand}
          aria-expanded={canExpand ? expanded : undefined}
          aria-controls={canExpand ? panelId : undefined}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand",
            !canExpand && "cursor-default",
          )}
        >
          <Badge variant="brand" className="size-12 shrink-0">
            {order}
          </Badge>
          <span className="min-w-0 flex-1">
            <span className="block text-card-title font-medium text-white">
              {title}
            </span>
            {description ? (
              <span className="mt-4 block text-helper text-text-muted">
                {description}
              </span>
            ) : null}
            {error ? (
              <span className="mt-3 block text-helper text-red-400" role="alert">
                {error}
              </span>
            ) : null}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
          {headerTrailing}
          {canExpand ? (
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              onClick={toggle}
              className="inline-flex size-8 items-center justify-center text-white"
            >
              {expanded ? (
                <ChevronUpIcon />
              ) : (
                <ChevronDownIcon className="size-6" />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {expanded && canExpand ? (
        <div
          id={panelId}
          className="overflow-x-auto border-t border-border-default px-4 pb-10 pt-8 sm:px-8"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function getFirstExpandableId(
  items: readonly ReportSectionPresentationItem[],
): string | null {
  return items.find((item) => item.canExpand !== false)?.id ?? null;
}

export function ReportSectionPresentation<
  T extends ReportSectionPresentationItem = ReportSectionPresentationItem,
>({
  items,
  expandedId,
  onToggle,
  defaultExpandFirst = false,
  emptyMessage = (
    <p className="text-body-lg text-text-muted">
      No sections are available for this report.
    </p>
  ),
  renderSection,
  renderHeaderTrailing,
  renderBody,
  renderAfterContent,
}: ReportSectionPresentationProps<T>) {
  const isControlled = expandedId !== undefined;
  const expansion = useSingleExpandedSection({
    defaultExpandFirst: !isControlled && defaultExpandFirst,
    firstItemId: getFirstExpandableId(items),
  });
  const currentExpandedId = isControlled ? expandedId : expansion.expandedId;
  const handleToggle = onToggle ?? expansion.toggleSection;

  if (items.length === 0) {
    return <div className="flex flex-col gap-4">{emptyMessage}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const expanded = currentExpandedId === item.id;
        const toggleItem = (element: HTMLDivElement) => {
          handleToggle(item.id, element);
        };

        if (renderSection) {
          return (
            <Fragment key={item.id}>
              {renderSection(item, { expanded, onToggle: toggleItem })}
            </Fragment>
          );
        }

        const canExpand = item.canExpand !== false;

        return (
          <ReportSectionAccordionFrame
            key={item.id}
            order={item.order}
            title={item.title}
            description={item.description}
            error={item.error}
            expanded={expanded}
            canExpand={canExpand}
            onToggle={toggleItem}
            headerTrailing={
              renderHeaderTrailing
                ? renderHeaderTrailing(item, { expanded })
                : item.status
                  ? <StatusPill status={item.status} />
                  : null
            }
          >
            {renderBody ? (
              renderBody(item, { expanded })
            ) : item.content ? (
              <div className="text-body-lg">
                <SectionContentRenderer
                  content={item.content}
                  skipFirstHeading={item.skipFirstHeading}
                />
                {renderAfterContent?.(item)}
              </div>
            ) : (
              renderAfterContent?.(item)
            )}
          </ReportSectionAccordionFrame>
        );
      })}
    </div>
  );
}
