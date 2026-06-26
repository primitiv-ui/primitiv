/*
 * Prose styled-surface recipe.
 *
 * Maps to the single context class the styling hangs off — `.primitiv-flow`
 * (RFC 0016). No variants: the rhythm is governed entirely by the density-scoped
 * --primitiv-flow-* tokens in the cascade, not by props.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const prose = cva("primitiv-flow");

export type ProseVariants = VariantProps<typeof prose>;
