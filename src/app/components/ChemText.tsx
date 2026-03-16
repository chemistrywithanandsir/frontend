import React from "react";

const CHEM_TAG_REGEX = /<(sup|sub|frac)>([\s\S]*?)<\/\1>/gi;
const ARROW_REGEX = /(⟶|⟵|⟷|⇌|⇄|⟹|⇒|→|←|↔)/g;

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
  let lastIndex = 0;
  CHEM_TAG_REGEX.lastIndex = 0;

  let match = CHEM_TAG_REGEX.exec(text);
  while (match) {
    const [full, tagRaw, content] = match;
    const start = match.index;

    if (start > lastIndex) {
      pushPlainWithStyledArrows(text.slice(lastIndex, start), nodes, keyRef);
    }

    const tag = String(tagRaw).toLowerCase();
    if (tag === "sup") {
      nodes.push(<sup key={`sup-${keyRef.value++}`}>{content}</sup>);
    } else if (tag === "frac") {
      nodes.push(renderFraction(content, `frac-${keyRef.value++}`));
    } else {
      nodes.push(<sub key={`sub-${keyRef.value++}`}>{content}</sub>);
    }

    lastIndex = start + full.length;
    match = CHEM_TAG_REGEX.exec(text);
  }

  if (lastIndex < text.length) {
    pushPlainWithStyledArrows(text.slice(lastIndex), nodes, keyRef);
  }

  return nodes;
}

type ChemTextProps = {
  text: string;
  className?: string;
};

export function ChemText({ text, className }: ChemTextProps) {
  return <span className={className}>{parseChemText(text)}</span>;
}
