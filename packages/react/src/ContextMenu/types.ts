import { ComponentProps, ReactNode, Ref } from "react";

import { CheckedState } from "../Checkbox/types";

type ContextMenuRootBaseProps = {
  children?: ReactNode;
};

type ContextMenuRootUncontrolledProps = ContextMenuRootBaseProps & {
  defaultOpen?: boolean;
  open?: never;
  onOpenChange?: (open: boolean) => void;
};

type ContextMenuRootControlledProps = ContextMenuRootBaseProps & {
  defaultOpen?: never;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type ContextMenuRootProps =
  | ContextMenuRootUncontrolledProps
  | ContextMenuRootControlledProps;

export type ContextMenuTriggerProps = ComponentProps<"span"> & {
  children?: ReactNode;
  ref?: Ref<HTMLSpanElement>;
  asChild?: boolean;
  disabled?: boolean;
};

export type ContextMenuContentProps = Omit<
  ComponentProps<"menu">,
  "role" | "popover" | "id"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLMenuElement>;
  asChild?: boolean;
};

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

export type ContextMenuSeparatorProps = Omit<ComponentProps<"li">, "role"> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
};

export type ContextMenuGroupProps = Omit<ComponentProps<"li">, "role"> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
};

export type ContextMenuLabelProps = ComponentProps<"li"> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
};

type ContextMenuCheckboxItemBaseProps = Omit<
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

type ContextMenuCheckboxItemUncontrolledProps =
  ContextMenuCheckboxItemBaseProps & {
    defaultChecked?: CheckedState;
    checked?: never;
    onCheckedChange?: (checked: boolean) => void;
  };

type ContextMenuCheckboxItemControlledProps =
  ContextMenuCheckboxItemBaseProps & {
    defaultChecked?: never;
    checked: CheckedState;
    onCheckedChange: (checked: boolean) => void;
  };

export type ContextMenuCheckboxItemProps =
  | ContextMenuCheckboxItemUncontrolledProps
  | ContextMenuCheckboxItemControlledProps;

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

type ContextMenuRadioGroupBaseProps = Omit<ComponentProps<"li">, "role"> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
};

type ContextMenuRadioGroupUncontrolledProps =
  ContextMenuRadioGroupBaseProps & {
    defaultValue?: string;
    value?: never;
    onValueChange?: (value: string) => void;
  };

type ContextMenuRadioGroupControlledProps = ContextMenuRadioGroupBaseProps & {
  defaultValue?: never;
  value: string;
  onValueChange: (value: string) => void;
};

export type ContextMenuRadioGroupProps =
  | ContextMenuRadioGroupUncontrolledProps
  | ContextMenuRadioGroupControlledProps;

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

type ContextMenuSubBaseProps = {
  children?: ReactNode;
};

type ContextMenuSubUncontrolledProps = ContextMenuSubBaseProps & {
  defaultOpen?: boolean;
  open?: never;
  onOpenChange?: (open: boolean) => void;
};

type ContextMenuSubControlledProps = ContextMenuSubBaseProps & {
  defaultOpen?: never;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type ContextMenuSubProps =
  | ContextMenuSubUncontrolledProps
  | ContextMenuSubControlledProps;

export type ContextMenuSubTriggerProps = Omit<
  ComponentProps<"li">,
  "role" | "tabIndex" | "aria-haspopup" | "aria-expanded" | "aria-controls"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  asChild?: boolean;
  disabled?: boolean;
};

export type ContextMenuSubContentProps = Omit<
  ComponentProps<"menu">,
  "role" | "popover" | "id"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLMenuElement>;
  asChild?: boolean;
};
