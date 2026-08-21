/*
 * Drawer styled-surface recipe — authored alongside the bespoke wrapper.
 *
 * Like Modal (and unlike the generated registry components), Drawer's wrapper is
 * hand-authored (drawer.tsx) because Drawer.Root / Drawer.Portal take no
 * className. This recipe still follows the generated shape: it maps the `width`
 * variant (the drawer's cross-axis extent) to the contract's modifier classes;
 * the styling lives in the copied stylesheet (RFC 0006 §6.1 / D53). The `side`
 * axis is NOT a class — it rides on the `data-side` attribute the headless
 * Drawer.Content emits, which the stylesheet keys off for positioning + the slide
 * direction. Change registry/components/drawer/contract.json + this file together.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const drawer = cva("primitiv-drawer", {
  variants: {
    width: {
      xs: "primitiv-drawer--xs",
      sm: "primitiv-drawer--sm",
      md: "primitiv-drawer--md",
      lg: "primitiv-drawer--lg",
      xl: "primitiv-drawer--xl",
    },
  },
  defaultVariants: {
    width: "md",
  },
});

export type DrawerVariants = VariantProps<typeof drawer>;

export const drawerOverlay = cva("primitiv-drawer__overlay");

export type DrawerOverlayVariants = VariantProps<typeof drawerOverlay>;

export const drawerHeader = cva("primitiv-drawer__header");

export type DrawerHeaderVariants = VariantProps<typeof drawerHeader>;

export const drawerBody = cva("primitiv-drawer__body");

export type DrawerBodyVariants = VariantProps<typeof drawerBody>;

export const drawerFooter = cva("primitiv-drawer__footer");

export type DrawerFooterVariants = VariantProps<typeof drawerFooter>;

export const drawerTitle = cva("primitiv-drawer__title");

export type DrawerTitleVariants = VariantProps<typeof drawerTitle>;

export const drawerDescription = cva("primitiv-drawer__description");

export type DrawerDescriptionVariants = VariantProps<typeof drawerDescription>;

export const drawerClose = cva("primitiv-drawer__close");

export type DrawerCloseVariants = VariantProps<typeof drawerClose>;
