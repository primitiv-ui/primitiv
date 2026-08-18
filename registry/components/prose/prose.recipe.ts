/*
 * Prose styled-surface recipe.
 *
 * Maps to the single context class the styling hangs off — `.primitiv-flow`
 * (RFC 0016). The rhythm itself is governed entirely by the density-scoped
 * --primitiv-flow-* tokens in the cascade, not by props; the one variant is
 * `measure`, which caps the column at a reading line length.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const prose = cva("primitiv-flow", {
  variants: {
    /**
     * Cap the column at a comfortable reading measure (~68 characters). Off by
     * default: a flow context is often a whole region containing grids and
     * media, which a reading-width cap would break.
     */
    measure: {
      true: "primitiv-flow--measure",
      false: "",
    },
  },
  defaultVariants: {
    measure: false,
  },
});

export type ProseVariants = VariantProps<typeof prose>;
