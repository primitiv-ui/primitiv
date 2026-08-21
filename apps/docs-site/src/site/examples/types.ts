import type { ReactNode } from "react";

/**
 * The bespoke half of a component page.
 *
 * Everything derivable from source lives in the generated docs-data (props,
 * types, defaults, descriptions, CSS custom properties, the install command).
 * This type covers only what genuinely cannot be generated — the playground's
 * preview, the worked examples, and the accessibility notes, which
 * docs-site-planning.md §1.7 records as not auto-generatable.
 *
 * Adding a component page is therefore: generate its docs-data, then add one of
 * these. No route, no nav entry, no TOC to maintain.
 */
export type ComponentSpec = {
  readonly playground: {
    /** Component name for the generated snippet, e.g. `"Button"`. */
    readonly component: string;
    /** Literal children placed inside the generated snippet. */
    readonly snippetChildren?: string;
    /** Extra lines above the snippet, e.g. an import. */
    readonly snippetPrefix?: string;
    /** Renders the live preview for the current control values. */
    readonly render: (values: Record<string, string>) => ReactNode;
  };

  readonly examples: readonly {
    /** Anchor id — also the nested TOC entry's target. */
    readonly id: string;
    readonly title: string;
    readonly render: () => ReactNode;
  }[];

  /**
   * Hand-authored: §1.7 records a11y as not derivable from source.
   *
   * Written with the SAME backtick convention as source JSDoc — `asChild`,
   * `:focus-visible`, `data-disabled` — and rendered through `renderDoc`, so
   * hand-authored and generated prose get identical code chips and there is one
   * rule to remember when adding a component.
   */
  readonly accessibility: readonly string[];
};
