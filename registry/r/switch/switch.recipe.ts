/*
 * Switch styled-surface recipe — generated from contract.json.
 *
 * Do not edit by hand: change registry/r/switch/contract.json and regenerate.
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const switchRecipe = cva("primitiv-switch");

export type SwitchVariants = VariantProps<typeof switchRecipe>;
