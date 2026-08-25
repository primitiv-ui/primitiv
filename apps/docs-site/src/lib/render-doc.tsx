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
 * markup, so this splits on the two forms that actually occur and builds
 * elements from the pieces. Anything it does not recognise stays plain text.
 *
 * `size` should match the surrounding type — `InlineCode` inherits nothing about
 * size from its context, so a chip in a 20px lede and a chip in a 14px table
 * cell have to be told separately or one of them looks wrong.
 */
export const renderDoc = (text: string, size: Size = "md"): ReactNode[] => {
  const parts = text.split(/(`[^`]+`|\{@link\s+[^}]+\})/g);

  return parts.map((part, i) => {
    if (part.length > 1 && part.startsWith("`") && part.endsWith("`")) {
      return (
        <InlineCode key={i} size={size}>
          {part.slice(1, -1)}
        </InlineCode>
      );
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
