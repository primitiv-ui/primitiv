/*
 * Spacer styled-surface recipe.
 *
 * Maps to the single root class — no variants: the spacer is a fixed
 * `flex: 1 0 0` rule with nothing for props to switch between (RFC 0022).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const spacer = cva("primitiv-spacer");

export type SpacerVariants = VariantProps<typeof spacer>;
