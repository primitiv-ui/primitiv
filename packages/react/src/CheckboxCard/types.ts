import { ComponentProps, ReactNode, Ref } from "react";
import type { CheckedState } from "../Checkbox/types";

/** Props for `CheckboxCard.Indicator` — the visual marker shown when the card
 * is checked. By default it renders only while checked; set `forceMount` to
 * keep it mounted for exit transitions. */
export type CheckboxCardIndicatorProps = ComponentProps<"span"> & {
  children?: ReactNode;
  forceMount?: boolean;
  asChild?: boolean;
};

/** Props shared by both controlled and uncontrolled `CheckboxCard.Root` usage.
 * Extends the native `<button>` props (minus the checkbox-managed ones). */
export type CheckboxCardRootBaseProps = Omit<
  ComponentProps<"button">,
  "type" | "role" | "aria-checked" | "defaultChecked"
> & {
  /** Render the child element instead of the default `<button>`. */
  asChild?: boolean;
  /** Ref to the rendered element. */
  ref?: Ref<HTMLButtonElement>;
};

/** Uncontrolled `CheckboxCard.Root` props: the component owns the checked
 * state, seeded by an optional `defaultChecked`. */
export type CheckboxCardRootUncontrolledProps = CheckboxCardRootBaseProps & {
  /** Checked state on first render. */
  defaultChecked?: CheckedState;
  checked?: never;
  /** Called with the new boolean checked state when it changes. */
  onCheckedChange?: (checked: boolean) => void;
};

/** Controlled `CheckboxCard.Root` props: the caller owns the checked state via
 * `checked` and is notified through the required `onCheckedChange`. */
export type CheckboxCardRootControlledProps = CheckboxCardRootBaseProps & {
  defaultChecked?: never;
  /** Current checked state. */
  checked: CheckedState;
  /** Called with the new boolean checked state when the user toggles. */
  onCheckedChange: (checked: boolean) => void;
};

/** Props for `CheckboxCard.Root` — resolves to either the controlled or
 * uncontrolled prop shape. */
export type CheckboxCardRootProps =
  | CheckboxCardRootUncontrolledProps
  | CheckboxCardRootControlledProps;
