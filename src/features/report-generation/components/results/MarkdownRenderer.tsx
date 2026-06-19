type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function readListItems(
  lines: string[],
  startIndex: number,
  markerPattern: RegExp,
  stripMarker: (line: string) => string,
): { items: string[]; nextIndex: number } {
  const items: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    if (lines[index].trim() === "") {
      if (
        index + 1 < lines.length &&
        markerPattern.test(lines[index + 1])
      ) {
        index += 1;
        continue;
      }
      break;
    }

    if (!markerPattern.test(lines[index])) {
      break;
    }

    const itemLines = [stripMarker(lines[index])];
    index += 1;

    while (index < lines.length) {
      if (/^(\s{2,}|\t)/.test(lines[index])) {
        itemLines.push(lines[index].replace(/^\s{2,}/, ""));
        index += 1;
        continue;
      }

      if (
        lines[index].trim() === "" &&
        index + 1 < lines.length &&
        /^(\s{2,}|\t)/.test(lines[index + 1])
      ) {
        itemLines.push("");
        index += 1;
        continue;
      }

      break;
    }

    items.push(itemLines.join("\n").trimEnd());
  }

  return { items, nextIndex: index };
}

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const { items, nextIndex } = readListItems(
        lines,
        index,
        /^[-*]\s+/,
        (currentLine) => currentLine.replace(/^[-*]\s+/, ""),
      );
      blocks.push({ type: "ul", items });
      index = nextIndex;
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const { items, nextIndex } = readListItems(
        lines,
        index,
        /^\d+\.\s+/,
        (currentLine) => currentLine.replace(/^\d+\.\s+/, ""),
      );
      blocks.push({ type: "ol", items });
      index = nextIndex;
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,6})\s+/.test(lines[index]) &&
      !/^[-*]\s+/.test(lines[index]) &&
      !/^\d+\.\s+/.test(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    blocks.push({ type: "paragraph", text: paragraphLines.join("\n") });
  }

  return blocks;
}

function headingClassName(level: number): string {
  if (level <= 2) {
    return "text-section-heading font-medium text-text-heading";
  }

  return "font-medium text-text-heading";
}

type MarkdownRendererProps = {
  markdown: string;
  nested?: boolean;
};

export function MarkdownRenderer({ markdown, nested = false }: MarkdownRendererProps) {
  const blocks = parseMarkdown(markdown);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={nested ? "flex flex-col gap-4" : "flex flex-col gap-8"}>
      {blocks.map((block, blockIndex) => {
        switch (block.type) {
          case "heading":
            return (
              <h4
                key={blockIndex}
                className={headingClassName(block.level)}
              >
                {block.text}
              </h4>
            );
          case "paragraph":
            return (
              <p
                key={blockIndex}
                className="leading-report whitespace-pre-wrap text-text-body"
              >
                {block.text}
              </p>
            );
          case "ul":
            return (
              <ul
                key={blockIndex}
                className="list-disc pl-7 text-text-body"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="mt-2 first:mt-0">
                    <MarkdownRenderer markdown={item} nested />
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol
                key={blockIndex}
                className="list-decimal pl-7 text-text-body"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="mt-2 first:mt-0">
                    <MarkdownRenderer markdown={item} nested />
                  </li>
                ))}
              </ol>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
