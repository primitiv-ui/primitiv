import { ButtonHTMLAttributes, ReactNode, Ref } from "react";

/**
 * Uncontrolled {@link Toggle} props: seed the initial pressed state with
 * `defaultPressed`; `pressed` and `onPressedChange` are disallowed in this
 * mode. The component owns the pressed value internally.
 */
export type UncontrolledToggleProps = {
  /**
   * The pressed state on first render. Omit to start unpressed.
   * Mutually exclusive with {@link ControlledToggleProps.pressed | `pressed`}.
   * @default false
   */
  defaultPressed?: boolean;
  pressed?: never;
  onPressedChange?: never;
};

/**
 * Controlled {@link Toggle} props: drive the pressed state with `pressed` and
 * respond to toggle requests via `onPressedChange`; `defaultPressed` is
 * disallowed in this mode. The parent owns the value.
 */
export type ControlledToggleProps = {
  /**
   * The current pressed state, owned by the caller. Every click fires
   * {@link ControlledToggleProps.onPressedChange | `onPressedChange`} with the
   * next value — the component does not update state itself.
   */
  pressed: boolean;
  /**
   * Called with the next pressed value when the user clicks the toggle.
   * The caller is responsible for updating the `pressed` prop accordingly.
   */
  onPressedChange: (pressed: boolean) => void;
  defaultPressed?: never;
};

/**
 * Props common to both controlled and uncontrolled {@link Toggle} modes:
 * `disabled`, `asChild`, `children`, `ref`, and all native `<button>`
 * attributes except `type` (which is fixed to `"button"` by the component).
 */
export type ToggleBaseProps = {
  /**
   * When `true`, sets the native `disabled` attribute (removing the button
   * from the tab order and suppressing clicks) and adds `data-disabled=""`
   * so CSS can target `[data-disabled]` without relying on `:disabled`.
   */
  disabled?: boolean;
  /**
   * Renders the child element instead of the default `<button>`, merging
   * `aria-pressed`, `data-state`, the composed `onClick`, and `ref` onto
   * it via {@link Slot}. The child must be focusable (e.g. carry
   * `tabIndex={0}` and `role="button"`).
   * @default false
   */
  asChild?: boolean;
  /** Toggle content — text, icons, or any React node. */
  children?: ReactNode;
  /**
   * Forwarded to the underlying `HTMLButtonElement`, or — under
   * `asChild` — merged onto the rendered child element.
   */
  ref?: Ref<HTMLButtonElement>;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type">;

/**
 * Props for the {@link Toggle} button — {@link ToggleBaseProps} combined with
 * the controlled/uncontrolled discriminated union
 * ({@link ControlledToggleProps} | {@link UncontrolledToggleProps}).
 *
 * TypeScript statically rejects mixing controlled and uncontrolled props
 * (e.g. passing both `pressed` and `defaultPressed`).
 */
export type ToggleProps = ToggleBaseProps &
  (UncontrolledToggleProps | ControlledToggleProps);
