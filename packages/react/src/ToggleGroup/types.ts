import { HTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from "react";

/**
 * Mode-independent props shared by every `ToggleGroup.Root` variant —
 * orientation, direction, `asChild`, children, and the ref. Combined with
 * a mode-specific arm to form {@link ToggleGroupRootProps}.
 */
export type ToggleGroupRootBaseProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "dir" | "defaultValue"
> & {
  /** Layout axis for keyboard navigation. `"horizontal"` binds
   * ArrowLeft/ArrowRight; `"vertical"` binds ArrowUp/ArrowDown. Surfaces as
   * `data-orientation` on the root for styling; it does not itself apply any
   * flex/grid layout.
   * @default "horizontal" */
  orientation?: "horizontal" | "vertical";
  /** Reading direction. In `"rtl"` the horizontal arrow keys are mirrored so
   * focus follows the visual order. Inherited from the nearest
   * {@link DirectionProvider} when omitted, falling back to `"ltr"`. */
  dir?: "ltr" | "rtl";
  /** Render a single consumer-supplied element in place of the native
   * `<div>`, with the group's `role="group"`, `data-orientation`, and `ref`
   * merged onto it via the {@link Slot} pattern.
   * @default false */
  asChild?: boolean;
  /** The {@link ToggleGroupItemProps | `ToggleGroup.Item`} elements that make
   * up the segmented control. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLDivElement`. */
  ref?: Ref<HTMLDivElement>;
};

/**
 * Single-selection mode, uncontrolled — at most one item pressed, with the
 * initial value supplied via `defaultValue`.
 */
export type SingleUncontrolledProps = {
  /** Selects single-selection semantics: at most one item pressed at a time,
   * and pressing the active item again clears the selection. */
  type: "single";
  /** Value of the item pressed on first render. Omit to start with nothing
   * pressed. */
  defaultValue?: string;
  /** Forbidden in uncontrolled mode — use `defaultValue`. */
  value?: never;
  /** Forbidden in uncontrolled mode. */
  onValueChange?: never;
};

/**
 * Single-selection mode, controlled — the pressed value is owned by the
 * caller via `value` / `onValueChange`.
 */
export type SingleControlledProps = {
  /** Selects single-selection semantics: at most one item pressed at a time,
   * and pressing the active item again clears the selection. */
  type: "single";
  /** The currently pressed item's value, or `undefined` when none is pressed.
   * Must be kept in sync by the caller via `onValueChange`. */
  value: string | undefined;
  /** Called with the requested next value — the pressed item's value, or
   * `undefined` when the active item is pressed again to deselect it. */
  onValueChange: (value: string | undefined) => void;
  /** Forbidden in controlled mode — use `value`. */
  defaultValue?: never;
};

/**
 * Multiple-selection mode, uncontrolled — items toggle independently, with
 * the initial set supplied via `defaultValue`.
 */
export type MultipleUncontrolledProps = {
  /** Selects multiple-selection semantics: any number of items can be pressed
   * simultaneously and each toggles independently. */
  type: "multiple";
  /** Values of the items pressed on first render. Omit to start with nothing
   * pressed. */
  defaultValue?: string[];
  /** Forbidden in uncontrolled mode — use `defaultValue`. */
  value?: never;
  /** Forbidden in uncontrolled mode. */
  onValueChange?: never;
};

/**
 * Multiple-selection mode, controlled — the set of pressed values is owned
 * by the caller via `value` / `onValueChange`.
 */
export type MultipleControlledProps = {
  /** Selects multiple-selection semantics: any number of items can be pressed
   * simultaneously and each toggles independently. */
  type: "multiple";
  /** The full set of currently pressed item values. Must be kept in sync by
   * the caller via `onValueChange`. */
  value: string[];
  /** Called with the complete next array of pressed values whenever the user
   * toggles any item. */
  onValueChange: (value: string[]) => void;
  /** Forbidden in controlled mode — use `value`. */
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
  "type" | "value"
> & {
  /** Identifies this item within the group. It is this string — not the
   * visible label — that is compared against the group's pressed
   * `value` / `defaultValue`; use `children` for the label. */
  value: string;
  /** Forwards the native `disabled` attribute and removes the item from the
   * roving tab order so arrow-key navigation skips it. Also sets
   * `data-disabled=""` for CSS targeting.
   * @default false */
  disabled?: boolean;
  /** Render a single consumer-supplied element in place of the native
   * `<button>`, with the item's `aria-pressed`, `data-state`, `tabIndex`, and
   * event handlers merged onto it via the {@link Slot} pattern.
   * @default false */
  asChild?: boolean;
  /** Forwarded to the underlying `HTMLButtonElement`. */
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
