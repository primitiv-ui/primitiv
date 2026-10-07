/*
 * Avatar styled-surface recipe — generated from contract.json.
 *
 * Yours to edit once `primitiv add` copies it into your project — re-running
 * `add` keeps your changes unless you pass --force. (In the Primitiv repo,
 * edit registry/components/avatar/contract.json and regenerate instead.)
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const avatar = cva("primitiv-avatar", {
  variants: {
    size: {
      xs: "primitiv-avatar--xs",
      sm: "primitiv-avatar--sm",
      md: "primitiv-avatar--md",
      lg: "primitiv-avatar--lg",
      xl: "primitiv-avatar--xl",
    },
    shape: {
      circle: "primitiv-avatar--circle",
      square: "primitiv-avatar--square",
    },
  },
  defaultVariants: {
    size: "md",
    shape: "circle",
  },
});

export type AvatarVariants = VariantProps<typeof avatar>;

export const avatarImage = cva("primitiv-avatar__image");

export type AvatarImageVariants = VariantProps<typeof avatarImage>;

export const avatarFallback = cva("primitiv-avatar__fallback");

export type AvatarFallbackVariants = VariantProps<typeof avatarFallback>;
