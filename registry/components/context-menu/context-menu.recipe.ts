/*
 * ContextMenu styled-surface recipe — authored alongside the bespoke wrapper.
 *
 * Like Dropdown, Popover, and Modal, ContextMenu's wrapper is hand-authored
 * (context-menu.tsx) because ContextMenu.Root / Trigger / Sub take no
 * className (Root and Sub are context providers with no DOM; Trigger is a
 * pass-through span). This recipe still follows the generated shape: it maps
 * the variant props to the contract's modifier classes; the styling lives in
 * the copied stylesheet (RFC 0006 §6.1 / D53). Change contract.json + this
 * file together.
 *
 * `placement` has no `defaultVariants` entry — unlike Dropdown, the root
 * Content never carries one of these classes (it is positioned at the
 * pointer, not anchored), so omitting it from the JSON leaves the class list
 * untouched when a caller doesn't pass one. Only SubContent supplies it,
 * defaulting to `"submenu"` as a JS default parameter in the wrapper.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const contextMenu = cva("primitiv-context-menu", {
  variants: {
    size: {
      xs: "primitiv-context-menu--xs",
      sm: "primitiv-context-menu--sm",
      md: "primitiv-context-menu--md",
      lg: "primitiv-context-menu--lg",
      xl: "primitiv-context-menu--xl",
    },
    placement: {
      "bottom-start": "primitiv-context-menu--bottom-start",
      "bottom-end": "primitiv-context-menu--bottom-end",
      "top-start": "primitiv-context-menu--top-start",
      "top-end": "primitiv-context-menu--top-end",
      submenu: "primitiv-context-menu--submenu",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type ContextMenuVariants = VariantProps<typeof contextMenu>;

export const contextMenuItem = cva("primitiv-context-menu__item");

export type ContextMenuItemVariants = VariantProps<typeof contextMenuItem>;

export const contextMenuCheckboxItem = cva("primitiv-context-menu__checkbox-item");

export type ContextMenuCheckboxItemVariants = VariantProps<typeof contextMenuCheckboxItem>;

export const contextMenuRadioItem = cva("primitiv-context-menu__radio-item");

export type ContextMenuRadioItemVariants = VariantProps<typeof contextMenuRadioItem>;

export const contextMenuItemLeading = cva("primitiv-context-menu__item-leading");

export type ContextMenuItemLeadingVariants = VariantProps<typeof contextMenuItemLeading>;

export const contextMenuItemLabel = cva("primitiv-context-menu__item-label");

export type ContextMenuItemLabelVariants = VariantProps<typeof contextMenuItemLabel>;

export const contextMenuItemTrailing = cva("primitiv-context-menu__item-trailing");

export type ContextMenuItemTrailingVariants = VariantProps<typeof contextMenuItemTrailing>;

export const contextMenuItemIndicator = cva("primitiv-context-menu__item-indicator");

export type ContextMenuItemIndicatorVariants = VariantProps<typeof contextMenuItemIndicator>;

export const contextMenuLabel = cva("primitiv-context-menu__label");

export type ContextMenuLabelVariants = VariantProps<typeof contextMenuLabel>;

export const contextMenuSeparator = cva("primitiv-context-menu__separator");

export type ContextMenuSeparatorVariants = VariantProps<typeof contextMenuSeparator>;

export const contextMenuGroup = cva("primitiv-context-menu__group");

export type ContextMenuGroupVariants = VariantProps<typeof contextMenuGroup>;

export const contextMenuRadioGroup = cva("primitiv-context-menu__radio-group");

export type ContextMenuRadioGroupVariants = VariantProps<typeof contextMenuRadioGroup>;

export const contextMenuSubTrigger = cva("primitiv-context-menu__sub-trigger");

export type ContextMenuSubTriggerVariants = VariantProps<typeof contextMenuSubTrigger>;
