import { HTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from "react";

/**
 * Mode-independent props shared by every `ToggleGroup.Root` variant —
 * orientation, direction, `asChild`, children, and the ref. Combined with
 * a mode-specific arm to form {@link ToggleGroupRootProps}.
 */
export type ToggleGroupRootBaseProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "dir"
> & {
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
  asChild?: boolean;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
};

/**
 * Single-selection mode, uncontrolled — at most one item pressed, with the
 * initial value supplied via `defaultValue`.
 */
export type SingleUncontrolledProps = {
  type: "single";
  defaultValue?: string;
  value?: never;
  onValueChange?: never;
};

/**
 * Single-selection mode, controlled — the pressed value is owned by the
 * caller via `value` / `onValueChange`.
 */
export type SingleControlledProps = {
  type: "single";
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
  defaultValue?: never;
};

/**
 * Multiple-selection mode, uncontrolled — items toggle independently, with
 * the initial set supplied via `defaultValue`.
 */
export type MultipleUncontrolledProps = {
  type: "multiple";
  defaultValue?: string[];
  value?: never;
  onValueChange?: never;
};

/**
 * Multiple-selection mode, controlled — the set of pressed values is owned
 * by the caller via `value` / `onValueChange`.
 */
export type MultipleControlledProps = {
  type: "multiple";
  value: string[];
  onValueChange: (value: string[]) => void;
  defaultValue?: never;
};

/**
 * Props for `ToggleGroup.Root`. Combines the shared
 * {@link ToggleGroupRootBaseProps} with one mode-specific arm — single or
 * multiple, controlled or uncontrolled — so the `value` / `defaultValue` /
 * `onValueChange` shape is enforced per `type`.
 */
export type ToggleGroupRootProps = ToggleGroupRootBaseProps &
  (
    | SingleUncontrolledProps
    | SingleControlledProps
    | MultipleUncontrolledProps
    | MultipleControlledProps
  );

/**
 * Props for `ToggleGroup.Item` — a pressable toggle button. `value`
 * identifies the item within the group; `asChild` merges the behaviour
 * onto a custom child element.
 */
export type ToggleGroupItemProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> & {
  value: string;
  disabled?: boolean;
  asChild?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

/**
 * Context shared from `ToggleGroup.Root` to its items — the pressed
 * values, the toggle action, item registration for roving tabindex, and
 * the resolved orientation / direction.
 */
export type ToggleGroupContextValue = {
  value: string[];
  toggle: (itemValue: string) => void;
  registerItem: (
    itemValue: string,
    element: HTMLButtonElement | null,
    disabled?: boolean,
  ) => void;
  itemValues: string[];
  disabledValues: Set<string>;
  focusItem: (itemValue: string) => void;
  focusedValue: string | undefined;
  setFocusedValue: (itemValue: string) => void;
  orientation: "horizontal" | "vertical";
  dir: "ltr" | "rtl";
};
