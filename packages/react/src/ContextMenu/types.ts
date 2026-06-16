import { ComponentProps, ReactNode, Ref } from "react";

import { CheckedState } from "../Checkbox/types";
import { Direction } from "../DirectionProvider/index.ts";

/**
 * Shared base for both {@link ContextMenuRootProps} variants — `children`
 * plus the reading-direction control.
 */
export type ContextMenuRootBaseProps = {
  children?: ReactNode;
  /**
   * Reading direction for the menu. Affects which arrow key opens / closes
   * a submenu — `ArrowRight` opens in `"ltr"`, `ArrowLeft` opens in
   * `"rtl"`. Falls back to the inherited {@link DirectionProvider} value,
   * or to `"ltr"` if no provider is present.
   */
  dir?: Direction;
};

/**
 * Uncontrolled variant of {@link ContextMenuRootProps}: the component owns
 * the open state. Pass `defaultOpen` (or omit it); `onOpenChange` is
 * optional and `open` is forbidden.
 */
export type ContextMenuRootUncontrolledProps = ContextMenuRootBaseProps & {
  defaultOpen?: boolean;
  open?: never;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Controlled variant of {@link ContextMenuRootProps}: the parent owns the
 * open state. Pass `open` and `onOpenChange` together; `defaultOpen` is
 * forbidden.
 */
export type ContextMenuRootControlledProps = ContextMenuRootBaseProps & {
  defaultOpen?: never;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Props for {@link ContextMenu.Root} — the open-state owner and
 * direction provider. A discriminated union of the uncontrolled
 * ({@link ContextMenuRootUncontrolledProps}) and controlled
 * ({@link ContextMenuRootControlledProps}) variants.
 */
export type ContextMenuRootProps =
  | ContextMenuRootUncontrolledProps
  | ContextMenuRootControlledProps;

/**
 * Props for {@link ContextMenu.Trigger} — the `<span>` whose right-click
 * (context menu) gesture opens the menu. Supports `asChild` to merge
 * onto a custom element and `disabled` to suppress the gesture.
 */
export type ContextMenuTriggerProps = ComponentProps<"span"> & {
  children?: ReactNode;
  ref?: Ref<HTMLSpanElement>;
  asChild?: boolean;
  disabled?: boolean;
};

/**
 * Props for {@link ContextMenu.Content} — the `<menu>` popover holding the
 * menu items. The managed `role`, `popover`, and `id` attributes are
 * omitted; `asChild` merges the props onto a custom element.
 */
export type ContextMenuContentProps = Omit<
  ComponentProps<"menu">,
  "role" | "popover" | "id"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLMenuElement>;
  asChild?: boolean;
};

/**
 * Props for {@link ContextMenu.Item} — a selectable `<li>` menu item. The
 * managed `role`, `tabIndex`, and `onSelect` are omitted from the host
 * props; `disabled` skips activation and `onSelect` fires on activation.
 */
export type ContextMenuItemProps = Omit<
  ComponentProps<"li">,
  "role" | "tabIndex" | "onSelect"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
  disabled?: boolean;
  /**
   * Fires when the item is activated (click, Enter, or Space). Called
   * with an event whose `preventDefault()` skips the auto-close that
   * ContextMenu performs after selection.
   */
  onSelect?: (event: Event) => void;
};

/**
 * Props for {@link ContextMenu.Separator} — a non-interactive `<li>`
 * divider between groups of items. The managed `role` is omitted;
 * `asChild` merges the props onto a custom element.
 */
export type ContextMenuSeparatorProps = Omit<ComponentProps<"li">, "role"> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
};

/**
 * Props for {@link ContextMenu.Group} — an `<li>` that groups related
 * items, optionally labelled by a {@link ContextMenu.Label}. The managed
 * `role` is omitted; `asChild` merges the props onto a custom element.
 */
export type ContextMenuGroupProps = Omit<ComponentProps<"li">, "role"> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
};

/**
 * Props for {@link ContextMenu.Label} — a non-interactive `<li>` caption
 * for a {@link ContextMenu.Group}. Supports `asChild` to merge the props
 * onto a custom element.
 */
export type ContextMenuLabelProps = ComponentProps<"li"> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
};

/**
 * Shared base for both {@link ContextMenuCheckboxItemProps} variants —
 * the `<li>` host props plus `children`, `ref`, `asChild`, `disabled`,
 * and `onSelect`. The managed `role`, `tabIndex`, `aria-checked`,
 * `defaultChecked`, and `onSelect` host attributes are omitted.
 */
export type ContextMenuCheckboxItemBaseProps = Omit<
  ComponentProps<"li">,
  "role" | "tabIndex" | "aria-checked" | "defaultChecked" | "onSelect"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
  disabled?: boolean;
  /**
   * Fires when activation completes and the auto-close fires. Call
   * `event.preventDefault()` to keep the menu open after toggling.
   */
  onSelect?: (event: Event) => void;
};

/**
 * Uncontrolled variant of {@link ContextMenuCheckboxItemProps}: the
 * component owns the checked state. Pass `defaultChecked` (or omit it);
 * `onCheckedChange` is optional and the controlled `checked` prop is
 * forbidden.
 */
export type ContextMenuCheckboxItemUncontrolledProps =
  ContextMenuCheckboxItemBaseProps & {
    defaultChecked?: CheckedState;
    checked?: never;
    onCheckedChange?: (checked: boolean) => void;
  };

/**
 * Controlled variant of {@link ContextMenuCheckboxItemProps}: the parent
 * owns the checked state. Pass `checked` and `onCheckedChange` together;
 * `defaultChecked` is forbidden.
 */
export type ContextMenuCheckboxItemControlledProps =
  ContextMenuCheckboxItemBaseProps & {
    defaultChecked?: never;
    checked: CheckedState;
    onCheckedChange: (checked: boolean) => void;
  };

/**
 * Props for {@link ContextMenu.CheckboxItem} — a toggleable menu item. A
 * discriminated union of the uncontrolled
 * ({@link ContextMenuCheckboxItemUncontrolledProps}) and controlled
 * ({@link ContextMenuCheckboxItemControlledProps}) variants.
 */
export type ContextMenuCheckboxItemProps =
  | ContextMenuCheckboxItemUncontrolledProps
  | ContextMenuCheckboxItemControlledProps;

/**
 * Props for {@link ContextMenu.ItemIndicator} — the `<span>` that renders
 * inside a checkbox or radio item to show its checked state. Set
 * `forceMount` to render even when unchecked; `asChild` merges the props
 * onto a custom element.
 */
export type ContextMenuItemIndicatorProps = ComponentProps<"span"> & {
  children?: ReactNode;
  ref?: Ref<HTMLSpanElement>;
  asChild?: boolean;
  /**
   * Render the indicator even when its parent item is unchecked. The
   * `data-state` attribute still reflects the live state.
   */
  forceMount?: boolean;
};

/**
 * Shared base for both {@link ContextMenuRadioGroupProps} variants — the
 * `<li>` host props plus `children`, `ref`, and `asChild`. The managed
 * `role` host attribute is omitted.
 */
export type ContextMenuRadioGroupBaseProps = Omit<
  ComponentProps<"li">,
  "role"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
};

/**
 * Uncontrolled variant of {@link ContextMenuRadioGroupProps}: the
 * component owns the selected-value state. Pass `defaultValue` (or omit
 * it); `onValueChange` is optional and the controlled `value` prop is
 * forbidden.
 */
export type ContextMenuRadioGroupUncontrolledProps =
  ContextMenuRadioGroupBaseProps & {
    defaultValue?: string;
    value?: never;
    onValueChange?: (value: string) => void;
  };

/**
 * Controlled variant of {@link ContextMenuRadioGroupProps}: the parent
 * owns the selected-value state. Pass `value` and `onValueChange`
 * together; `defaultValue` is forbidden.
 */
export type ContextMenuRadioGroupControlledProps =
  ContextMenuRadioGroupBaseProps & {
    defaultValue?: never;
    value: string;
    onValueChange: (value: string) => void;
  };

/**
 * Props for {@link ContextMenu.RadioGroup} — the container that tracks
 * which {@link ContextMenu.RadioItem} is selected. A discriminated union
 * of the uncontrolled ({@link ContextMenuRadioGroupUncontrolledProps})
 * and controlled ({@link ContextMenuRadioGroupControlledProps}) variants.
 */
export type ContextMenuRadioGroupProps =
  | ContextMenuRadioGroupUncontrolledProps
  | ContextMenuRadioGroupControlledProps;

/**
 * Props for {@link ContextMenu.RadioItem} — a mutually-exclusive choice
 * within a {@link ContextMenu.RadioGroup}, identified by its required
 * `value`. The managed `role`, `tabIndex`, `aria-checked`, and `onSelect`
 * host attributes are omitted.
 */
export type ContextMenuRadioItemProps = Omit<
  ComponentProps<"li">,
  "role" | "tabIndex" | "aria-checked" | "onSelect"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
  disabled?: boolean;
  value: string;
  onSelect?: (event: Event) => void;
};

/**
 * Shared base for both {@link ContextMenuSubProps} variants — just the
 * `children` of the submenu.
 */
export type ContextMenuSubBaseProps = {
  children?: ReactNode;
};

/**
 * Uncontrolled variant of {@link ContextMenuSubProps}: the component owns
 * the submenu open state. Pass `defaultOpen` (or omit it); `onOpenChange`
 * is optional and the controlled `open` prop is forbidden.
 */
export type ContextMenuSubUncontrolledProps = ContextMenuSubBaseProps & {
  defaultOpen?: boolean;
  open?: never;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Controlled variant of {@link ContextMenuSubProps}: the parent owns the
 * submenu open state. Pass `open` and `onOpenChange` together;
 * `defaultOpen` is forbidden.
 */
export type ContextMenuSubControlledProps = ContextMenuSubBaseProps & {
  defaultOpen?: never;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Props for {@link ContextMenu.Sub} — a nested submenu's open-state
 * owner. A discriminated union of the uncontrolled
 * ({@link ContextMenuSubUncontrolledProps}) and controlled
 * ({@link ContextMenuSubControlledProps}) variants.
 */
export type ContextMenuSubProps =
  | ContextMenuSubUncontrolledProps
  | ContextMenuSubControlledProps;

/**
 * Props for {@link ContextMenu.SubTrigger} — the `<li>` that opens its
 * parent {@link ContextMenu.Sub} on hover or arrow key. The managed
 * `role`, `tabIndex`, `aria-haspopup`, `aria-expanded`, and
 * `aria-controls` host attributes are omitted; `disabled` suppresses it.
 */
export type ContextMenuSubTriggerProps = Omit<
  ComponentProps<"li">,
  "role" | "tabIndex" | "aria-haspopup" | "aria-expanded" | "aria-controls"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
  disabled?: boolean;
};

/**
 * Props for {@link ContextMenu.SubContent} — the `<menu>` popover for a
 * nested submenu's items. The managed `role`, `popover`, and `id`
 * attributes are omitted; `asChild` merges the props onto a custom
 * element.
 */
export type ContextMenuSubContentProps = Omit<
  ComponentProps<"menu">,
  "role" | "popover" | "id"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLMenuElement>;
  asChild?: boolean;
};
