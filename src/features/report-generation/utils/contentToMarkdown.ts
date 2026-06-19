function formatKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function asListItem(markdown: string): string {
  const lines = markdown.split("\n");
  if (lines.length === 1) {
    return `- ${lines[0]}`;
  }

  return `- ${lines[0]}\n${lines
    .slice(1)
    .map((line) => `  ${line}`)
    .join("\n")}`;
}

function isPrimitive(value: unknown): value is string | number | boolean {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

/**
 * Converts arbitrary backend section content into a markdown string.
 * Strings are passed through unchanged so backend-provided markdown renders as-is.
 */
export function contentToMarkdown(content: unknown, depth = 0): string {
  if (content === null || content === undefined) {
    return "";
  }

  if (typeof content === "string") {
    return content;
  }

  if (typeof content === "number" || typeof content === "boolean") {
    return String(content);
  }

  if (Array.isArray(content)) {
    if (content.length === 0) {
      return "";
    }

    if (content.every(isPrimitive)) {
      return content.map((item) => `- ${String(item)}`).join("\n");
    }

    return content
      .map((item) => asListItem(contentToMarkdown(item, depth + 1)))
      .filter(Boolean)
      .join("\n");
  }

  if (typeof content === "object") {
    const headingLevel = Math.min(depth + 2, 6);
    const headingPrefix = "#".repeat(headingLevel);

    return Object.entries(content as Record<string, unknown>)
      .map(([key, value]) => {
        const heading = `${headingPrefix} ${formatKey(key)}`;
        const body = contentToMarkdown(value, depth + 1);
        return body ? `${heading}\n\n${body}` : heading;
      })
      .join("\n\n");
  }

  return "";
}
