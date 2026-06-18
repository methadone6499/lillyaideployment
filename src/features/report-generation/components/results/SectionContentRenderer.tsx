function formatKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

type SectionContentRendererProps = {
  content: unknown;
  depth?: number;
};

export function SectionContentRenderer({
  content,
  depth = 0,
}: SectionContentRendererProps) {
  if (content === null || content === undefined) {
    return null;
  }

  if (typeof content === "string") {
    return (
      <p className="leading-report whitespace-pre-wrap text-text-body">
        {content}
      </p>
    );
  }

  if (typeof content === "number" || typeof content === "boolean") {
    return <p className="leading-report text-text-body">{String(content)}</p>;
  }

  if (Array.isArray(content)) {
    if (content.length === 0) {
      return null;
    }

    const isPrimitiveList = content.every(
      (item) =>
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean",
    );

    if (isPrimitiveList) {
      return (
        <ul className="list-disc pl-7 text-text-body">
          {content.map((item, index) => (
            <li key={index}>{String(item)}</li>
          ))}
        </ul>
      );
    }

    return (
      <ul className="list-disc pl-7 text-text-body">
        {content.map((item, index) => (
          <li key={index} className="mt-2">
            <SectionContentRenderer content={item} depth={depth + 1} />
          </li>
        ))}
      </ul>
    );
  }

  if (typeof content === "object") {
    return (
      <div className={depth === 0 ? "flex flex-col gap-8" : "flex flex-col gap-4"}>
        {Object.entries(content as Record<string, unknown>).map(
          ([key, value]) => (
            <div key={key}>
              <h4
                className={
                  depth === 0
                    ? "text-section-heading font-medium text-text-heading"
                    : "font-medium text-text-heading"
                }
              >
                {formatKey(key)}
              </h4>
              <div className="mt-4">
                <SectionContentRenderer content={value} depth={depth + 1} />
              </div>
            </div>
          ),
        )}
      </div>
    );
  }

  return null;
}
