/*
 * AvatarGroup styled-surface recipe.
 *
 * Maps to the contract's modifier classes; the styling lives in the copied
 * stylesheet (RFC 0006 §6.1). Hand-authored — AvatarGroup composes the
 * registry `avatar` component rather than a headless primitive of its own
 * (it owns no keyboard model or state), so it carries no drift-guard test.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const avatarGroup = cva("primitiv-avatar-group", {
  variants: {
    size: {
      xs: "primitiv-avatar-group--xs",
      sm: "primitiv-avatar-group--sm",
      md: "primitiv-avatar-group--md",
      lg: "primitiv-avatar-group--lg",
      xl: "primitiv-avatar-group--xl",
    },
    direction: {
      ltr: "primitiv-avatar-group--ltr",
      rtl: "primitiv-avatar-group--rtl",
    },
  },
  defaultVariants: { size: "md", direction: "ltr" },
});

export type AvatarGroupVariants = VariantProps<typeof avatarGroup>;
