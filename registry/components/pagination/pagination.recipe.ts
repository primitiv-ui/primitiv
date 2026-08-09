/*
 * Pagination styled-surface recipe — authored alongside the bespoke wrapper.
 *
 * Unlike the generated registry components, Pagination's wrapper is
 * hand-authored (pagination.tsx) — it composes the registry Button and Dropdown
 * rather than wrapping a headless primitive, so there is no contract-driven
 * generator behind it and no drift-guard test. Change
 * registry/components/pagination/contract.json + this file together.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const pagination = cva("primitiv-pagination", {
  variants: {
    variant: {
      numbered: "primitiv-pagination--numbered",
      compact: "primitiv-pagination--compact",
    },
    size: {
      xs: "primitiv-pagination--xs",
      sm: "primitiv-pagination--sm",
      md: "primitiv-pagination--md",
      lg: "primitiv-pagination--lg",
      xl: "primitiv-pagination--xl",
    },
  },
  defaultVariants: {
    variant: "numbered",
    size: "md",
  },
});

export type PaginationVariants = VariantProps<typeof pagination>;
