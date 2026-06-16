import { ComponentProps, ReactNode, Ref } from "react";

/**
 * Which arrow keys navigate the group. `"both"` (default) accepts all
 * four; `"horizontal"` only Arrow Left/Right; `"vertical"` only Arrow
 * Up/Down.
 */
export type RadioCardOrientation = "horizontal" | "vertical" | "both";

/** Reading direction — swaps the horizontal arrow pair when `"rtl"`. */
export type RadioCardReadingDirection = "ltr" | "rtl";

/** Props shared by both controlled and uncontrolled `RadioCard.Root` usage.
 * Extends the native `<div>` props (minus `role`). */
export type RadioCardRootBaseProps = Omit<ComponentProps<"div">, "role"> & {
  children?: ReactNode;
  /** Ref to the rendered root element. */
  ref?: Ref<HTMLDivElement>;
  /** Render the child element instead of the default `<div>`. */
  asChild?: boolean;
  /** Which arrow keys navigate the group. */
  orientation?: RadioCardOrientation;
  /** Reading direction for horizontal arrow navigation. */
  dir?: RadioCardReadingDirection;
};

/** Uncontrolled `RadioCard.Root` props: the component owns the selection,
 * seeded by an optional `defaultValue`. */
export type RadioCardRootUncontrolledProps = RadioCardRootBaseProps & {
  /** Value selected on first render. */
  defaultValue?: string;
  value?: never;
  /** Called with the value when the selection changes. */
  onValueChange?: (value: string) => void;
};

/** Controlled `RadioCard.Root` props: the caller owns the selection via
 * `value` and is notified through the required `onValueChange`. */
export type RadioCardRootControlledProps = RadioCardRootBaseProps & {
  defaultValue?: never;
  /** Value of the currently selected card. */
  value: string;
  /** Called with the value when the user selects a card. */
  onValueChange: (value: string) => void;
};

/** Props for `RadioCard.Root` — resolves to either the controlled or
 * uncontrolled prop shape. */
export type RadioCardRootProps =
  | RadioCardRootUncontrolledProps
  | RadioCardRootControlledProps;

/** Props for `RadioCard.Item` — a selectable card rendered as a
 * `role="radio"` button, identified by its required `value`. */
export type RadioCardItemProps = Omit<
  ComponentProps<"button">,
  "type" | "role" | "aria-checked" | "value"
> & {
  value: string;
  children?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
  asChild?: boolean;
};

/** Props for `RadioCard.Indicator` — the visual marker rendered inside the
 * selected item. By default it renders only when its item is checked; set
 * `forceMount` to keep it mounted for exit transitions. */
export type RadioCardIndicatorProps = ComponentProps<"span"> & {
  children?: ReactNode;
  forceMount?: boolean;
  asChild?: boolean;
};
