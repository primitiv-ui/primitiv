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
   * The part tree, one entry per render path.
   *
   * Optional because it only earns its place on a COMPOUND component. Button has
   * a single part, so an anatomy block would restate its own name; Select has
   * nine, and — the actual reason the Figma frame gives it a whole section —
   * five of them render nothing at all under `native`, so the tree is genuinely
   * different per path and a reader cannot infer one from the other.
   *
   * `code` is annotated source: the part on the left, the DOM/ARIA it produces
   * in a trailing `//` comment. That pairing is the point of the section — it is
   * the only place the site says what each part actually emits.
   */
  readonly anatomy?: readonly {
    /** Tab label, e.g. `"Rich"`. Also the tab's `value`. */
    readonly label: string;
    readonly code: string;
  }[];

  /** Intro line for the anatomy section. Backtick-marked, like the rest. */
  readonly anatomyMeta?: string;

  /**
   * Keyboard model, hand-authored — §1.7, same reasoning as `accessibility`.
   *
   * NOT derivable: `contract.json` records data attributes and modifiers but
   * says nothing about key handling, which lives in the headless hooks. Optional
   * because a component whose keys are entirely native (Button: Space/Enter on a
   * `<button>`) has nothing to document that the platform does not already
   * guarantee.
   *
   * `keys` is a list so a row can carry a pair (`ArrowDown` / `ArrowUp`); each
   * entry renders as a `Kbd`. `literal` opts out of that for a row describing a
   * CLASS of key rather than a key — "printable character" is prose, and setting
   * it in a key cap would claim there is a key with that legend.
   */
  readonly keyboard?: readonly {
    readonly keys: readonly string[];
    readonly literal?: boolean;
    /** Backtick-marked, like every other string here. */
    readonly behaviour: string;
  }[];

  /**
   * Optional intro line for the keyboard table — scope and the cross-cutting
   * rules that belong to no single row (what is focused on open, whether
   * disabled options are skipped).
   */
  readonly keyboardMeta?: string;

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
