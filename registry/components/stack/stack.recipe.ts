/*
 * Stack styled-surface recipe.
 *
 * Maps the `direction` and `gap` variants to the contract's modifier classes;
 * the styling lives in the copied stylesheet (RFC 0006 §6.1). Hand-authored —
 * like `prose`, this entry has no headless `@primitiv-ui/react` primitive to
 * generate from — so it carries no drift-guard test; the shape still mirrors
 * the generated recipes.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const stack = cva("primitiv-stack", {
  variants: {
    direction: {
      column: "primitiv-stack--column",
      row: "primitiv-stack--row",
      "column-reverse": "primitiv-stack--column-reverse",
      "row-reverse": "primitiv-stack--row-reverse",
    },
    gap: {
      none: "primitiv-stack--gap-none",
      xs: "primitiv-stack--gap-xs",
      sm: "primitiv-stack--gap-sm",
      md: "primitiv-stack--gap-md",
      lg: "primitiv-stack--gap-lg",
      xl: "primitiv-stack--gap-xl",
    },
    wrap: {
      nowrap: "primitiv-stack--nowrap",
      wrap: "primitiv-stack--wrap",
    },
    align: {
      start: "primitiv-stack--align-start",
      center: "primitiv-stack--align-center",
      end: "primitiv-stack--align-end",
      stretch: "primitiv-stack--align-stretch",
      baseline: "primitiv-stack--align-baseline",
    },
    justify: {
      start: "primitiv-stack--justify-start",
      center: "primitiv-stack--justify-center",
      end: "primitiv-stack--justify-end",
      between: "primitiv-stack--justify-between",
      around: "primitiv-stack--justify-around",
      evenly: "primitiv-stack--justify-evenly",
    },
  },
  defaultVariants: {
    direction: "column",
    gap: "md",
    wrap: "nowrap",
    align: "stretch",
    justify: "start",
  },
});

export type StackVariants = VariantProps<typeof stack>;
