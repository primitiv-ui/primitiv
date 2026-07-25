/*
 * NavigationMenu styled-surface recipe — authored alongside the bespoke wrapper.
 *
 * Like Dropdown, Popover and Modal, NavigationMenu's wrapper is hand-authored
 * (navigation-menu.tsx) rather than generated: `Item` is a context provider whose
 * `value` is the whole disclosure/plain-link distinction, `Content` portal-projects
 * into a mounted `Viewport`, and `Indicator` publishes measured geometry as inline
 * custom properties — none of which `emit_wrapper` models. This recipe still
 * follows the generated shape: it maps variant props to the contract's modifier
 * classes; the styling lives in the copied stylesheet (RFC 0006 §6.1 / D53).
 * Change contract.json + this file together.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const navigationMenu = cva("primitiv-navigation-menu", {
  variants: {
    size: {
      xs: "primitiv-navigation-menu--xs",
      sm: "primitiv-navigation-menu--sm",
      md: "primitiv-navigation-menu--md",
      lg: "primitiv-navigation-menu--lg",
      xl: "primitiv-navigation-menu--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type NavigationMenuVariants = VariantProps<typeof navigationMenu>;

export const navigationMenuList = cva("primitiv-navigation-menu__list");

export type NavigationMenuListVariants = VariantProps<typeof navigationMenuList>;

export const navigationMenuItem = cva("primitiv-navigation-menu__item");

export type NavigationMenuItemVariants = VariantProps<typeof navigationMenuItem>;

export const navigationMenuTrigger = cva("primitiv-navigation-menu__trigger");

export type NavigationMenuTriggerVariants = VariantProps<typeof navigationMenuTrigger>;

export const navigationMenuTriggerLabel = cva("primitiv-navigation-menu__trigger-label");

export type NavigationMenuTriggerLabelVariants = VariantProps<typeof navigationMenuTriggerLabel>;

export const navigationMenuTriggerIcon = cva("primitiv-navigation-menu__trigger-icon");

export type NavigationMenuTriggerIconVariants = VariantProps<typeof navigationMenuTriggerIcon>;

export const navigationMenuContent = cva("primitiv-navigation-menu__content");

export type NavigationMenuContentVariants = VariantProps<typeof navigationMenuContent>;

export const navigationMenuViewport = cva("primitiv-navigation-menu__viewport");

export type NavigationMenuViewportVariants = VariantProps<typeof navigationMenuViewport>;

/*
 * `marker` mirrors the Figma Indicator set's Style axis. The arrow is the default
 * because it is the shape that reads as "this panel belongs to that trigger";
 * `underline` suits a nav whose panels are flush to the bar.
 */
export const navigationMenuIndicator = cva("primitiv-navigation-menu__indicator", {
  variants: {
    marker: {
      arrow: "primitiv-navigation-menu__indicator--arrow",
      underline: "primitiv-navigation-menu__indicator--underline",
    },
  },
  defaultVariants: {
    marker: "arrow",
  },
});

export type NavigationMenuIndicatorVariants = VariantProps<typeof navigationMenuIndicator>;

/*
 * One headless `Link` part, two placements — a bar entry beside the triggers, or a
 * row inside an open panel. Mirrors the Figma Bar Link / Panel Link split. The
 * placement is an explicit prop rather than a descendant selector so the class is
 * visible in the markup and the two geometries can't be confused.
 */
export const navigationMenuLink = cva("primitiv-navigation-menu__link", {
  variants: {
    placement: {
      bar: "primitiv-navigation-menu__link--bar",
      panel: "primitiv-navigation-menu__link--panel",
    },
  },
  defaultVariants: {
    placement: "bar",
  },
});

export type NavigationMenuLinkVariants = VariantProps<typeof navigationMenuLink>;

export const navigationMenuLinkText = cva("primitiv-navigation-menu__link-text");

export type NavigationMenuLinkTextVariants = VariantProps<typeof navigationMenuLinkText>;

export const navigationMenuLinkTitle = cva("primitiv-navigation-menu__link-title");

export type NavigationMenuLinkTitleVariants = VariantProps<typeof navigationMenuLinkTitle>;

export const navigationMenuLinkDescription = cva("primitiv-navigation-menu__link-description");

export type NavigationMenuLinkDescriptionVariants = VariantProps<typeof navigationMenuLinkDescription>;

export const navigationMenuLinkLeading = cva("primitiv-navigation-menu__link-leading");

export type NavigationMenuLinkLeadingVariants = VariantProps<typeof navigationMenuLinkLeading>;

export const navigationMenuLinkTrailing = cva("primitiv-navigation-menu__link-trailing");

export type NavigationMenuLinkTrailingVariants = VariantProps<typeof navigationMenuLinkTrailing>;
