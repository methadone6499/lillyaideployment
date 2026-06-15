import { Card } from "@/components/ui";
import type { ReactNode } from "react";

type FilterGroupCardProps = {
  title: string | null;
  description?: string | null;
  children: ReactNode;
};

export function FilterGroupCard({
  title,
  description,
  children,
}: FilterGroupCardProps) {
  const hasHeader = Boolean(title || description);

  return (
    <Card className="px-6 py-7">
      {hasHeader ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            {title && <h3 className="text-label font-medium text-white">{title}</h3>}
            {description && <p className="text-helper text-text-muted">{description}</p>}
          </div>

          {children}
        </div>
      ) : (
        children
      )}
    </Card>
  );
}