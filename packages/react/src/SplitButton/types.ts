import { ComponentProps, ReactNode, Ref } from "react";

import type { Direction } from "../DirectionProvider/index.ts";
import type {
  DropdownContentProps,
  DropdownItemProps,
  DropdownSeparatorProps,
  DropdownTriggerProps,
} from "../Dropdown/types";

export type SplitButtonRootBaseProps = Omit<
  ComponentProps<"div">,
  "role" | "dir"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
  dir?: Direction;
};

export type SplitButtonRootUncontrolledProps = SplitButtonRootBaseProps & {
  defaultOpen?: boolean;
  open?: never;
  onOpenChange?: (open: boolean) => void;
};

export type SplitButtonRootControlledProps = SplitButtonRootBaseProps & {
  defaultOpen?: never;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type SplitButtonRootProps =
  | SplitButtonRootUncontrolledProps
  | SplitButtonRootControlledProps;

export type SplitButtonActionProps = ComponentProps<"button"> & {
  children?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
};

export type SplitButtonTriggerProps = DropdownTriggerProps;

export type SplitButtonMenuProps = DropdownContentProps;

export type SplitButtonItemProps = DropdownItemProps;

export type SplitButtonSeparatorProps = DropdownSeparatorProps;
