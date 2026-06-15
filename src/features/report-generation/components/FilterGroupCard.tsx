import { Card } from "@/components/ui";
import type { ReactNode } from "react";

type FilterGroupCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function FilterGroupCard({
  title,
  description,
  children,
}: FilterGroupCardProps) {
  return (
    <Card className="px-6 py-7">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h3 className="text-label font-medium text-white">{title}</h3>
          {description && (
            <p className="text-helper text-text-muted">{description}</p>
          )}
        </div>
        {children}
      </div>
    </Card>
  );
}
