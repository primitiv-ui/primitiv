import { ChangeEventHandler, ComponentProps, ReactNode, Ref } from "react";

type SelectRootBaseProps = Omit<
  ComponentProps<"select">,
  "value" | "defaultValue" | "multiple" | "onChange"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLSelectElement>;
  /**
   * Native `change` handler. Fires alongside `onValueChange` whenever the
   * user picks a different option. Use this when you want the raw
   * `ChangeEvent` (e.g. to inspect `event.target.validity`).
   */
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  /**
   * When `true`, Root delegates to a single consumer-supplied element
   * (expected to render a `<select>`) and merges its own props onto it
   * via the {@link Slot} pattern. The placeholder-detection inside Root
   * walks direct children only, so placeholder + `asChild` requires the
   * consumer to set `defaultValue=""` explicitly.
   */
  asChild?: boolean;
};

type SelectRootUncontrolledProps = SelectRootBaseProps & {
  defaultValue?: string;
  value?: never;
  onValueChange?: (value: string) => void;
};

type SelectRootControlledProps = SelectRootBaseProps & {
  defaultValue?: never;
  value: string;
  onValueChange: (value: string) => void;
};

/**
 * Props for {@link Select.Root}.
 *
 * Two state modes are statically discriminated at the type level so only
 * one shape is accepted by TypeScript:
 *
 * - **Uncontrolled** — pass `defaultValue` (or omit it). The browser owns
 *   the selection state. `onValueChange` is optional.
 * - **Controlled** — pass `value` and `onValueChange` together. The
 *   parent owns the selection; the component defers every transition
 *   back through the callback.
 *
 * Native `multiple`-selection mode is not supported in v1.
 */
export type SelectRootProps =
  | SelectRootUncontrolledProps
  | SelectRootControlledProps;

/**
 * Props for {@link Select.Option} — all `OptionHTMLAttributes` on the
 * underlying `<option>` element, plus a typed `ref`.
 */
export type SelectOptionProps = ComponentProps<"option"> & {
  children?: ReactNode;
  ref?: Ref<HTMLOptionElement>;
};

/**
 * Props for {@link Select.Group} — all `OptgroupHTMLAttributes` on the
 * underlying `<optgroup>` element, plus a typed `ref`. `label` is
 * required by the native element and is what assistive technology
 * announces for the group.
 */
export type SelectGroupProps = ComponentProps<"optgroup"> & {
  label: string;
  children?: ReactNode;
  ref?: Ref<HTMLOptGroupElement>;
};

/**
 * Props for {@link Select.Placeholder}.
 *
 * `value`, `disabled`, and `hidden` are owned by the component — the
 * placeholder always has `value=""`, is always disabled, and is always
 * hidden from the dropdown — so they can't be set by the consumer.
 */
export type SelectPlaceholderProps = Omit<
  ComponentProps<"option">,
  "value" | "disabled" | "hidden"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLOptionElement>;
};
