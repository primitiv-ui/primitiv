import type { ReactNode } from "react";

import { InlineCode } from "@/components/inline-code";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Renders generated JSDoc prose, turning its markup into real elements.
 *
 * Every string that reaches the site from `docs-data` is **source JSDoc**, so it
 * contains authoring markup: backticked code spans and `{@link Symbol}` tags.
 * Printed raw, the reader sees the punctuation — Button's own description ends
 * "...styled as one via `asChild`." with the backticks visible.
 *
 * Deliberately NOT a markdown renderer, and deliberately not
 * `dangerouslySetInnerHTML`: doc comments are authored prose, not trusted
 * markup, so this splits on the three forms that actually occur and builds
 * elements from the pieces. Anything it does not recognise stays plain text.
 *
 * `**bold**` is one of those three because doc comments genuinely use it —
 * source JSDoc, `contract.json` descriptions and every hand-authored spec string
 * on this site do — and without it a reader sees the asterisks. It was missing
 * for as long as the site has existed, which is exactly the failure mode this
 * function is for: authoring markup printed as punctuation.
 *
 * `size` should match the surrounding type — `InlineCode` inherits nothing about
 * size from its context, so a chip in a 20px lede and a chip in a 14px table
 * cell have to be told separately or one of them looks wrong.
 */
export const renderDoc = (text: string, size: Size = "md"): ReactNode[] => {
  const parts = text.split(
    /(`[^`]+`|\{@link\s+[^}]+\}|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g,
  );

  return parts.map((part, i) => {
    if (part.length > 1 && part.startsWith("`") && part.endsWith("`")) {
      return (
        <InlineCode key={i} size={size}>
          {part.slice(1, -1)}
        </InlineCode>
      );
    }
    /*
     * Bold. The code-span alternative is FIRST in the pattern above, so a
     * backticked span is always captured before this can claim it; the inner
     * text is run back through `renderDoc` so a code span inside bold still
     * becomes a chip rather than raw backticks. (No string does that today —
     * checked — but the recursion costs nothing and removes the trap.)
     */
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{renderDoc(part.slice(2, -2), size)}</strong>;
    }
    /*
     * Italic. `**` is matched BEFORE this in the pattern above, so bold is never
     * mistaken for two italics; the `[^*\s]` after the opening star is what
     * keeps a lone `*` in prose from opening a run. Same recursion as bold, for
     * the same reason.
     */
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{renderDoc(part.slice(1, -1), size)}</em>;
    }
    // `{@link Target | label}` — take the target, drop any display label.
    const link = part.match(/^\{@link\s+([^}\s|]+)/);
    if (link) {
      return (
        <InlineCode key={i} size={size}>
          {link[1]}
        </InlineCode>
      );
    }
    return part;
  });
};

/** The first sentence, for summaries. Keeps any markup intact for `renderDoc`. */
export const firstSentence = (text: string): string =>
  text.split(/(?<=\.)\s/)[0];
