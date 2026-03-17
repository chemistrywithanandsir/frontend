import React from "react";
import katex from "katex";
import "katex/contrib/mhchem";

const CHEM_TAG_REGEX = /^<(sup|sub|frac|b)>([\s\S]*?)<\/\1>/i;
const CHEM_TAG_START_REGEX = /<(sup|sub|frac|b)>/i;
const ARROW_REGEX = /(⟶|⟵|⟷|⇌|⇄|⟹|⇒|→|←|↔)/g;

type ChemSegment =
  | { type: "plain"; content: string }
  | { type: "tag"; tag: "sup" | "sub" | "frac" | "b"; content: string }
  | { type: "math"; content: string; displayMode: boolean };

function findUnescapedDelimiter(input: string, delimiter: string, start: number) {
  for (let index = start; index <= input.length - delimiter.length; index += 1) {
    if (!input.startsWith(delimiter, index)) continue;
    let slashCount = 0;
    for (let cursor = index - 1; cursor >= 0 && input[cursor] === "\\"; cursor -= 1) {
      slashCount += 1;
    }
    if (slashCount % 2 === 0) {
      return index;
    }
  }
  return -1;
}

function readMathSegment(input: string, start: number): ChemSegment | null {
  const displayDollar = "$$";
  if (input.startsWith(displayDollar, start)) {
    const end = findUnescapedDelimiter(input, displayDollar, start + displayDollar.length);
    if (end > start) {
      return {
        type: "math",
        content: input.slice(start + displayDollar.length, end),
        displayMode: true,
      };
    }
    return null;
  }

  if (input.startsWith("\\[", start)) {
    const end = input.indexOf("\\]", start + 2);
    if (end > start) {
      return {
        type: "math",
        content: input.slice(start + 2, end),
        displayMode: true,
      };
    }
    return null;
  }

  if (input.startsWith("\\(", start)) {
    const end = input.indexOf("\\)", start + 2);
    if (end > start) {
      return {
        type: "math",
        content: input.slice(start + 2, end),
        displayMode: false,
      };
    }
    return null;
  }

  if (input[start] === "$" && input[start + 1] !== "$" && input[start - 1] !== "\\") {
    const end = findUnescapedDelimiter(input, "$", start + 1);
    if (end > start + 1) {
      return {
        type: "math",
        content: input.slice(start + 1, end),
        displayMode: false,
      };
    }
  }

  return null;
}

function readChemTagSegment(input: string, start: number): ChemSegment | null {
  const remaining = input.slice(start);
  const tagMatch = remaining.match(CHEM_TAG_REGEX);
  if (!tagMatch) return null;
  const [full, tagRaw, content] = tagMatch;
  if (!full) return null;
  return {
    type: "tag",
    tag: tagRaw.toLowerCase() as "sup" | "sub" | "frac" | "b",
    content,
  };
}

function consumedLengthForMath(input: string, start: number, segment: Extract<ChemSegment, { type: "math" }>) {
  if (input.startsWith("$$", start)) {
    return segment.content.length + 4;
  }
  if (input.startsWith("\\[", start) || input.startsWith("\\(", start)) {
    return segment.content.length + 4;
  }
  return segment.content.length + 2;
}

function tokenizeChemText(text: string): ChemSegment[] {
  if (!text) return [];

  const parts: ChemSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const remaining = text.slice(cursor);
    const tagSegment = readChemTagSegment(text, cursor);
    if (tagSegment) {
      parts.push(tagSegment);
      const full = remaining.match(CHEM_TAG_REGEX)?.[0] || "";
      cursor += full.length;
      continue;
    }

    const mathSegment = readMathSegment(text, cursor);
    if (mathSegment) {
      parts.push(mathSegment);
      cursor += consumedLengthForMath(text, cursor, mathSegment);
      continue;
    }

    const nextTagIndex = (() => {
      const match = remaining.match(CHEM_TAG_START_REGEX);
      return typeof match?.index === "number" ? match.index : -1;
    })();
    const nextMathIndex = (() => {
      for (let index = cursor; index < text.length; index += 1) {
        const ch = text[index];
        if (ch !== "$" && ch !== "\\") continue;
        if (readMathSegment(text, index)) {
          return index - cursor;
        }
      }
      return -1;
    })();

    const nextBoundary = [nextTagIndex, nextMathIndex]
      .filter((value) => value >= 0)
      .sort((a, b) => a - b)[0];

    if (typeof nextBoundary === "number") {
      parts.push({ type: "plain", content: remaining.slice(0, nextBoundary) });
      cursor += nextBoundary;
      continue;
    }

    parts.push({ type: "plain", content: remaining });
    break;
  }

  return parts.filter((part) => part.content.length > 0);
}

function renderFraction(content: string, key: string) {
  const raw = String(content || "").trim();
  const slash = raw.indexOf("/");
  if (slash <= 0 || slash >= raw.length - 1) {
    return <span key={key}>{raw}</span>;
  }

  const numerator = raw.slice(0, slash).trim();
  const denominator = raw.slice(slash + 1).trim();

  return (
    <span key={key} className="inline-flex flex-col items-center align-middle mx-[0.06em] leading-none">
      <span className="text-[0.88em] px-[0.08em]">{numerator}</span>
      <span className="w-full border-t border-current my-[0.06em]" />
      <span className="text-[0.88em] px-[0.08em]">{denominator}</span>
    </span>
  );
}

function renderMath(content: string, key: string, displayMode: boolean) {
  const source = String(content || "").trim();
  if (!source) {
    return null;
  }

  try {
    const html = katex.renderToString(source, {
      displayMode,
      throwOnError: false,
      output: "htmlAndMathml",
      strict: "ignore",
      trust: true,
    });

    return (
      <span
        key={key}
        className={
          displayMode
            ? "inline-block align-middle max-w-full overflow-hidden [&_.katex-display]:inline-block [&_.katex-display]:my-0 [&_.katex-display]:max-w-full [&_.katex-display]:overflow-hidden [&_.katex]:max-w-full"
            : "inline-block align-middle max-w-full overflow-hidden [&_.katex]:max-w-full"
        }
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return <span key={key}>{source}</span>;
  }
}

function pushPlainWithStyledArrows(
  input: string,
  nodes: React.ReactNode[],
  keyRef: { value: number }
) {
  if (!input) return;

  let last = 0;
  ARROW_REGEX.lastIndex = 0;
  let match = ARROW_REGEX.exec(input);

  while (match) {
    const [arrow] = match;
    const idx = match.index;

    if (idx > last) {
      nodes.push(input.slice(last, idx));
    }

    nodes.push(
      <span
        key={`arrow-${keyRef.value++}`}
        className="inline-block text-[1.25em] leading-none align-[-0.06em] mx-[0.08em]"
      >
        {arrow}
      </span>
    );

    last = idx + arrow.length;
    match = ARROW_REGEX.exec(input);
  }

  if (last < input.length) {
    nodes.push(input.slice(last));
  }
}

function parseChemText(text: string): React.ReactNode[] {
  if (!text) return [];

  const nodes: React.ReactNode[] = [];
  const keyRef = { value: 0 };
  for (const segment of tokenizeChemText(text)) {
    if (segment.type === "plain") {
      pushPlainWithStyledArrows(segment.content, nodes, keyRef);
      continue;
    }

    if (segment.type === "math") {
      const mathNode = renderMath(
        segment.content,
        `math-${keyRef.value++}`,
        segment.displayMode
      );
      if (mathNode) {
        nodes.push(mathNode);
      }
      continue;
    }

    if (segment.tag === "sup") {
      nodes.push(<sup key={`sup-${keyRef.value++}`}>{segment.content}</sup>);
    } else if (segment.tag === "frac") {
      nodes.push(renderFraction(segment.content, `frac-${keyRef.value++}`));
    } else if (segment.tag === "b") {
      nodes.push(<b key={`b-${keyRef.value++}`}>{segment.content}</b>);
    } else {
      nodes.push(<sub key={`sub-${keyRef.value++}`}>{segment.content}</sub>);
    }
  }

  return nodes;
}

type ChemTextProps = {
  text: string;
  className?: string;
};

export function ChemText({ text, className }: ChemTextProps) {
  return <span className={["whitespace-pre-wrap", className].filter(Boolean).join(" ")}>{parseChemText(text)}</span>;
}
