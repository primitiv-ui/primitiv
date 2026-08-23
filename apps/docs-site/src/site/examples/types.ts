import type { ReactNode } from "react";

import type { Mode } from "@/site/preferences";

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
    /**
     * Extra lines above the snippet — in practice, the import block.
     *
     * A function when it depends on the consumption mode, which an import always
     * does: the specifier differs (`@primitiv-ui/react` vs the copied
     * `@/components/ui/<id>`) and for a compound the named symbols differ too.
     */
    readonly snippetPrefix?: string | ((mode: Mode) => string);
    /**
     * Writes the whole snippet, replacing the generated one.
     *
     * The generated `toJsx` puts every control on the NAMED component, which is
     * right only when the controls are that component's own props. For a
     * compound whose modifiers live on child parts it produces a lie: Select's
     * `size`/`mode`/`placement` are declared on `Select.Trigger` and
     * `Select.Content`, so the generated line reads
     * `<Select size="md" mode="rich" placement="bottom-start" />` — three props
     * the root does not accept, on a component that in rich mode renders no
     * element at all.
     *
     * Providing this is therefore not a styling preference, it is the escape
     * hatch for "the controls do not belong to the root". Keep the same
     * every-prop-including-defaults rule that `toJsx` follows, for the same
     * reason: the snippet is a readout of the current state, so a control whose
     * value never appears looks broken.
     *
     * Receives the consumption `mode`, because a compound's part names are not
     * mode-independent: headless exports one `Select` and the parts hang off it
     * (`Select.Trigger`), while styled copies a file of flat exports
     * (`SelectTrigger`) that exist nowhere else. See `partNamer`/`importBlock`.
     */
    readonly snippet?: (values: Record<string, string>, mode: Mode) => string;
    /** Renders the live preview for the current control values. */
    readonly render: (values: Record<string, string>) => ReactNode;
    /**
     * Stretch the preview to the full width of its container instead of
     * centring it at its natural size.
     *
     * For components where the WIDTH is part of what the controls do. Tabs is
     * the case that asked for it: `justify` moves the triggers within the
     * tablist, so on a tablist hugging its own content `start`, `center` and
     * `end` render identically and the control looks broken. A Button has no
     * such axis, and stretching it would just misrepresent how it lays out.
     *
     * @default false
     */
    readonly fill?: boolean;
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
   * `code` is the tree and nothing else — no trailing annotations. An earlier
   * pass paired each part with the DOM it emits in a `//` comment (as the Figma
   * frame draws it) and it read as clutter on screen: the comment column pushed
   * every line past the content width, so the block scrolled and the tree it was
   * annotating became the harder half to follow. What each part emits belongs in
   * prose and in the Data attributes table.
   *
   * Mode-aware for the same reason snippets are: the parts are `Select.Trigger`
   * in headless mode and `SelectTrigger` in the copied styled file, and showing
   * one form here while every snippet below shows the other is the confusion
   * this page just finished removing.
   */
  readonly anatomy?: readonly {
    /**
     * Render-path name, e.g. `"Rich"`.
     *
     * Was a tab label; since 2026-08-22 the mode tabs own the tablist (every
     * code block on the page carries them), so multiple paths STACK as labelled
     * blocks instead — this is the heading over each. See `Anatomy`.
     */
    readonly label: string;
    readonly code: (mode: Mode) => string;
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
