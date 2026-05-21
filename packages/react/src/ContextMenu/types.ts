import { ComponentProps, ReactNode, Ref } from "react";

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
