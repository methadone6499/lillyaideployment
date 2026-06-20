import type { ReactNode } from "react";

export function renderInlineMarkdown(text: string): ReactNode {
  if (!text) {
    return null;
  }

  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={index} className="font-semibold">
          {boldMatch[1]}
        </strong>
      );
    }
    return part;
  });
}
