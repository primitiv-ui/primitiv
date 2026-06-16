import { ComponentProps, ReactNode, Ref } from "react";

import { CheckedState } from "../Checkbox/types";
import { Direction } from "../DirectionProvider/index.ts";

/**
 * Shared base for both {@link DropdownRootProps} variants — `children` plus
 * the reading-direction control.
 */
export type DropdownRootBaseProps = {
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
 * Uncontrolled variant of {@link DropdownRootProps}: the component owns the
 * open state. Pass `defaultOpen` (or omit it); `onOpenChange` is optional
 * and `open` is forbidden.
 */
export type DropdownRootUncontrolledProps = DropdownRootBaseProps & {
  defaultOpen?: boolean;
  open?: never;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Controlled variant of {@link DropdownRootProps}: the parent owns the open
 * state. Pass `open` and `onOpenChange` together; `defaultOpen` is
 * forbidden.
 */
export type DropdownRootControlledProps = DropdownRootBaseProps & {
  defaultOpen?: never;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Props for {@link Dropdown.Root} — the controlled/uncontrolled discriminated
 * union pairing {@link DropdownRootUncontrolledProps} with
 * {@link DropdownRootControlledProps}, plus the shared `children` and `dir`.
 */
export type DropdownRootProps =
  | DropdownRootUncontrolledProps
  | DropdownRootControlledProps;

/**
 * Props for {@link Dropdown.Trigger} — the button that opens the menu. Extends
 * the native `<button>` props (minus the ARIA attributes Dropdown owns) and
 * adds `asChild` for rendering a custom element.
 */
export type DropdownTriggerProps = Omit<
  ComponentProps<"button">,
  "aria-haspopup" | "aria-expanded" | "aria-controls"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
  asChild?: boolean;
};

/**
 * Props for {@link Dropdown.Content} — the popover menu surface. Extends the
 * native `<menu>` props (minus the `role`/`popover`/`id` Dropdown manages) and
 * adds `asChild` for rendering a custom element.
 */
export type DropdownContentProps = Omit<
  ComponentProps<"menu">,
  "role" | "popover" | "id"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLMenuElement>;
  asChild?: boolean;
};

/**
 * Props for {@link Dropdown.Item} — a selectable menu item. Extends the native
 * `<li>` props and adds `disabled`, `asChild`, and an `onSelect` callback that
 * fires on activation (click, Enter, or Space).
 */
export type DropdownItemProps = Omit<
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
   * Dropdown performs after selection.
   */
  onSelect?: (event: Event) => void;
};

/**
 * Props for {@link Dropdown.Separator} — a non-interactive divider between
 * groups of items. Extends the native `<li>` props and adds `asChild`.
 */
export type DropdownSeparatorProps = Omit<ComponentProps<"li">, "role"> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
};

/**
 * Props for {@link Dropdown.ItemIndicator} — the check/dot rendered inside a
 * checkbox or radio item. Extends the native `<span>` props and adds
 * `forceMount` to keep it mounted while unchecked for enter/exit animation.
 */
export type DropdownItemIndicatorProps = ComponentProps<"span"> & {
  children?: ReactNode;
  ref?: Ref<HTMLSpanElement>;
  asChild?: boolean;
  /**
   * Render the indicator even when its parent item is unchecked. The
   * `data-state` attribute still reflects the live state (`"checked"` /
   * `"unchecked"` / `"indeterminate"`), so consumers can animate the
   * indicator in and out instead of mounting / unmounting it.
   */
  forceMount?: boolean;
};

/**
 * Props for {@link Dropdown.Group} — a labelled grouping of related items.
 * Extends the native `<li>` props and adds `asChild`.
 */
export type DropdownGroupProps = Omit<ComponentProps<"li">, "role"> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
};

/**
 * Props for {@link Dropdown.Label} — an accessible label for a
 * {@link Dropdown.Group}. Extends the native `<li>` props and adds `asChild`.
 */
export type DropdownLabelProps = ComponentProps<"li"> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
};

/**
 * Shared base for both {@link DropdownCheckboxItemProps} variants — the native
 * `<li>` props plus `disabled`, `asChild`, and the `onSelect` callback.
 */
export type DropdownCheckboxItemBaseProps = Omit<
  ComponentProps<"li">,
  "role" | "tabIndex" | "aria-checked" | "defaultChecked" | "onSelect"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
  disabled?: boolean;
  /**
   * Fires when activation completes and the close auto-fires. Call
   * `event.preventDefault()` to keep the menu open after toggling.
   */
  onSelect?: (event: Event) => void;
};

/**
 * Uncontrolled variant of {@link DropdownCheckboxItemProps}: the component owns
 * the checked state. Pass `defaultChecked` (or omit it); `onCheckedChange` is
 * optional and the controlled `checked` prop is forbidden.
 */
export type DropdownCheckboxItemUncontrolledProps =
  DropdownCheckboxItemBaseProps & {
    defaultChecked?: CheckedState;
    checked?: never;
    onCheckedChange?: (checked: boolean) => void;
  };

/**
 * Controlled variant of {@link DropdownCheckboxItemProps}: the parent owns the
 * checked state. Pass `checked` and `onCheckedChange` together;
 * `defaultChecked` is forbidden.
 */
export type DropdownCheckboxItemControlledProps =
  DropdownCheckboxItemBaseProps & {
    defaultChecked?: never;
    checked: CheckedState;
    onCheckedChange: (checked: boolean) => void;
  };

/**
 * Props for {@link Dropdown.CheckboxItem} — a togglable menu item. The
 * controlled/uncontrolled discriminated union pairing
 * {@link DropdownCheckboxItemUncontrolledProps} with
 * {@link DropdownCheckboxItemControlledProps}.
 */
export type DropdownCheckboxItemProps =
  | DropdownCheckboxItemUncontrolledProps
  | DropdownCheckboxItemControlledProps;

/**
 * Shared base for both {@link DropdownRadioGroupProps} variants — the native
 * `<li>` props plus `asChild`.
 */
export type DropdownRadioGroupBaseProps = Omit<ComponentProps<"li">, "role"> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
};

/**
 * Uncontrolled variant of {@link DropdownRadioGroupProps}: the component owns
 * the selected value. Pass `defaultValue` (or omit it); `onValueChange` is
 * optional and the controlled `value` prop is forbidden.
 */
export type DropdownRadioGroupUncontrolledProps =
  DropdownRadioGroupBaseProps & {
    defaultValue?: string;
    value?: never;
    onValueChange?: (value: string) => void;
  };

/**
 * Controlled variant of {@link DropdownRadioGroupProps}: the parent owns the
 * selected value. Pass `value` and `onValueChange` together; `defaultValue` is
 * forbidden.
 */
export type DropdownRadioGroupControlledProps = DropdownRadioGroupBaseProps & {
  defaultValue?: never;
  value: string;
  onValueChange: (value: string) => void;
};

/**
 * Props for {@link Dropdown.RadioGroup} — a single-select group of radio items.
 * The controlled/uncontrolled discriminated union pairing
 * {@link DropdownRadioGroupUncontrolledProps} with
 * {@link DropdownRadioGroupControlledProps}.
 */
export type DropdownRadioGroupProps =
  | DropdownRadioGroupUncontrolledProps
  | DropdownRadioGroupControlledProps;

/**
 * Props for {@link Dropdown.RadioItem} — one option within a
 * {@link Dropdown.RadioGroup}. Extends the native `<li>` props and adds the
 * required `value`, plus `disabled`, `asChild`, and `onSelect`.
 */
export type DropdownRadioItemProps = Omit<
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
 * Shared base for both {@link DropdownSubProps} variants — just the submenu
 * `children`.
 */
export type DropdownSubBaseProps = {
  children?: ReactNode;
};

/**
 * Uncontrolled variant of {@link DropdownSubProps}: the component owns the
 * submenu open state. Pass `defaultOpen` (or omit it); `onOpenChange` is
 * optional and the controlled `open` prop is forbidden.
 */
export type DropdownSubUncontrolledProps = DropdownSubBaseProps & {
  defaultOpen?: boolean;
  open?: never;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Controlled variant of {@link DropdownSubProps}: the parent owns the submenu
 * open state. Pass `open` and `onOpenChange` together; `defaultOpen` is
 * forbidden.
 */
export type DropdownSubControlledProps = DropdownSubBaseProps & {
  defaultOpen?: never;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Props for {@link Dropdown.Sub} — the root of a nested submenu. The
 * controlled/uncontrolled discriminated union pairing
 * {@link DropdownSubUncontrolledProps} with {@link DropdownSubControlledProps}.
 */
export type DropdownSubProps =
  | DropdownSubUncontrolledProps
  | DropdownSubControlledProps;

/**
 * Props for {@link Dropdown.SubTrigger} — the item that opens a submenu.
 * Extends the native `<li>` props (minus the ARIA attributes Dropdown owns) and
 * adds `disabled` and `asChild`.
 */
export type DropdownSubTriggerProps = Omit<
  ComponentProps<"li">,
  "role" | "tabIndex" | "aria-haspopup" | "aria-expanded" | "aria-controls"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
  disabled?: boolean;
};

/**
 * Props for {@link Dropdown.SubContent} — the popover surface of a submenu.
 * Extends the native `<menu>` props (minus the `role`/`popover`/`id` Dropdown
 * manages) and adds `asChild`.
 */
export type DropdownSubContentProps = Omit<
  ComponentProps<"menu">,
  "role" | "popover" | "id"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLMenuElement>;
  asChild?: boolean;
};
