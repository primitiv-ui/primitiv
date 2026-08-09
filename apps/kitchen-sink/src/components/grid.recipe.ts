/*
 * Grid styled-surface recipe.
 *
 * Maps the `gap`, `align` and `justify` variants to the contract's modifier
 * classes; the styling lives in the copied stylesheet (RFC 0006 §6.1).
 * Hand-authored — like `prose`, this entry has no headless `@primitiv-ui/react`
 * primitive to generate from (RFC 0022) — so it carries no drift-guard test;
 * the shape still mirrors the generated recipes.
 *
 * `columns` is the exception: it accepts a plain count *or* a per-breakpoint
 * object, which does not fit `cva`'s Record<string, string> variant model. It
 * is resolved by the `gridColumns` helper below instead, and the two class
 * lists are concatenated by the wrapper.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const grid = cva("primitiv-grid", {
  variants: {
    gap: {
      none: "primitiv-grid--gap-none",
      xs: "primitiv-grid--gap-xs",
      sm: "primitiv-grid--gap-sm",
      md: "primitiv-grid--gap-md",
      lg: "primitiv-grid--gap-lg",
      xl: "primitiv-grid--gap-xl",
    },
    align: {
      start: "primitiv-grid--align-start",
      center: "primitiv-grid--align-center",
      end: "primitiv-grid--align-end",
      stretch: "primitiv-grid--align-stretch",
      baseline: "primitiv-grid--align-baseline",
    },
    justify: {
      start: "primitiv-grid--justify-start",
      center: "primitiv-grid--justify-center",
      end: "primitiv-grid--justify-end",
      stretch: "primitiv-grid--justify-stretch",
    },
  },
  defaultVariants: {
    gap: "md",
    align: "stretch",
    justify: "stretch",
  },
});

export type GridVariants = VariantProps<typeof grid>;

/**
 * The breakpoint tiers `columns` may key on, in ascending order — the same
 * scale the token layer emits as `--primitiv-breakpoint-*` (RFC 0025).
 */
export const GRID_BREAKPOINTS = ["xs", "sm", "md", "lg", "xl", "2xl"] as const;

export type GridBreakpoint = (typeof GRID_BREAKPOINTS)[number];

/** The column counts the stylesheet ships modifier classes for. */
export type GridColumnCount = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Either one count applied at every width, or a mobile-first map of them:
 * `{ base: 1, md: 2, lg: 3 }`. `base` is the floor (no media query); each
 * named tier applies from that breakpoint up.
 */
export type GridColumns =
  | GridColumnCount
  | ({ base?: GridColumnCount } & Partial<Record<GridBreakpoint, GridColumnCount>>);

/**
 * Resolve a `columns` prop to its modifier classes.
 *
 * A bare number yields the single base class. An object yields the base class
 * (when `base` is set) plus one `--{tier}-cols-{n}` class per named tier. The
 * emitted order is cosmetic only — which rule wins when several match is fixed
 * by the stylesheet's ascending source order, not by the class attribute.
 */
export function gridColumns(columns: GridColumns | undefined): string[] {
  if (columns === undefined) return [];
  if (typeof columns === "number") return [`primitiv-grid--cols-${columns}`];

  const classes: string[] = [];
  if (columns.base !== undefined) classes.push(`primitiv-grid--cols-${columns.base}`);
  for (const tier of GRID_BREAKPOINTS) {
    const count = columns[tier];
    if (count !== undefined) classes.push(`primitiv-grid--${tier}-cols-${count}`);
  }
  return classes;
}
