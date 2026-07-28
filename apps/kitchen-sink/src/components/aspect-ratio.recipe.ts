/*
 * AspectRatio styled-surface recipe.
 *
 * Maps to the single root class — no variants: `ratio` is a continuous
 * numeric value set inline per instance (RFC 0022), not a fixed enum, so
 * there is nothing for a modifier group to switch between.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const aspectRatio = cva("primitiv-aspect-ratio");

export type AspectRatioVariants = VariantProps<typeof aspectRatio>;
