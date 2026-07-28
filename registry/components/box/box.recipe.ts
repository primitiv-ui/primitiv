/*
 * Box styled-surface recipe.
 *
 * Maps to the single root class — no variants: Box has no visual opinion, so
 * there is nothing for props to switch between (RFC 0022).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const box = cva("primitiv-box");

export type BoxVariants = VariantProps<typeof box>;
