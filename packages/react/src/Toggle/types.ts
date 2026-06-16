import { ButtonHTMLAttributes, ReactNode, Ref } from "react";

/** Uncontrolled `Toggle` props: seed with `defaultPressed`; `pressed`/`onPressedChange` are disallowed. */
export type UncontrolledToggleProps = {
  defaultPressed?: boolean;
  pressed?: never;
  onPressedChange?: never;
};

/** Controlled `Toggle` props: drive with `pressed` and `onPressedChange`; `defaultPressed` is disallowed. */
export type ControlledToggleProps = {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  defaultPressed?: never;
};

/** Props common to both `Toggle` modes: `disabled`, `asChild`, `children`, `ref`, and the native `<button>` attributes (minus `type`). */
export type ToggleBaseProps = {
  disabled?: boolean;
  asChild?: boolean;
  children?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type">;

/** Props for the `Toggle` button — base props combined with the controlled/uncontrolled discriminated union. */
export type ToggleProps = ToggleBaseProps &
  (UncontrolledToggleProps | ControlledToggleProps);
