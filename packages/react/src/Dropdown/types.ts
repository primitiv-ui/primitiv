import { ComponentProps, ReactNode, Ref } from "react";

import { CheckedState } from "../Checkbox/types";
import { Direction } from "../DirectionProvider";

type DropdownRootBaseProps = {
  children?: ReactNode;
  /**
   * Reading direction for the menu. Affects which arrow key opens / closes
   * a submenu — `ArrowRight` opens in `"ltr"`, `ArrowLeft` opens in
   * `"rtl"`. Falls back to the inherited {@link DirectionProvider} value,
   * or to `"ltr"` if no provider is present.
   */
  dir?: Direction;
};

type DropdownRootUncontrolledProps = DropdownRootBaseProps & {
  defaultOpen?: boolean;
  open?: never;
  onOpenChange?: (open: boolean) => void;
};

type DropdownRootControlledProps = DropdownRootBaseProps & {
  defaultOpen?: never;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type DropdownRootProps =
  | DropdownRootUncontrolledProps
  | DropdownRootControlledProps;

export type DropdownTriggerProps = Omit<
  ComponentProps<"button">,
  "aria-haspopup" | "aria-expanded" | "aria-controls"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
  asChild?: boolean;
};

export type DropdownContentProps = Omit<
  ComponentProps<"menu">,
  "role" | "popover" | "id"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLMenuElement>;
  asChild?: boolean;
};

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

export type DropdownSeparatorProps = Omit<ComponentProps<"li">, "role"> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
};

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

export type DropdownGroupProps = Omit<ComponentProps<"li">, "role"> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
};

export type DropdownLabelProps = ComponentProps<"li"> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
};

type DropdownCheckboxItemBaseProps = Omit<
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

type DropdownCheckboxItemUncontrolledProps = DropdownCheckboxItemBaseProps & {
  defaultChecked?: CheckedState;
  checked?: never;
  onCheckedChange?: (checked: boolean) => void;
};

type DropdownCheckboxItemControlledProps = DropdownCheckboxItemBaseProps & {
  defaultChecked?: never;
  checked: CheckedState;
  onCheckedChange: (checked: boolean) => void;
};

export type DropdownCheckboxItemProps =
  | DropdownCheckboxItemUncontrolledProps
  | DropdownCheckboxItemControlledProps;

type DropdownRadioGroupBaseProps = Omit<ComponentProps<"li">, "role"> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
};

type DropdownRadioGroupUncontrolledProps = DropdownRadioGroupBaseProps & {
  defaultValue?: string;
  value?: never;
  onValueChange?: (value: string) => void;
};

type DropdownRadioGroupControlledProps = DropdownRadioGroupBaseProps & {
  defaultValue?: never;
  value: string;
  onValueChange: (value: string) => void;
};

export type DropdownRadioGroupProps =
  | DropdownRadioGroupUncontrolledProps
  | DropdownRadioGroupControlledProps;

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

type DropdownSubBaseProps = {
  children?: ReactNode;
};

type DropdownSubUncontrolledProps = DropdownSubBaseProps & {
  defaultOpen?: boolean;
  open?: never;
  onOpenChange?: (open: boolean) => void;
};

type DropdownSubControlledProps = DropdownSubBaseProps & {
  defaultOpen?: never;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type DropdownSubProps =
  | DropdownSubUncontrolledProps
  | DropdownSubControlledProps;

export type DropdownSubTriggerProps = Omit<
  ComponentProps<"li">,
  "role" | "tabIndex" | "aria-haspopup" | "aria-expanded" | "aria-controls"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
  disabled?: boolean;
};

export type DropdownSubContentProps = Omit<
  ComponentProps<"menu">,
  "role" | "popover" | "id"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLMenuElement>;
  asChild?: boolean;
};
