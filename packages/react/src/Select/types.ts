import { ChangeEventHandler, ComponentProps, ReactNode, Ref } from "react";

/**
 * Shared base for both {@link SelectRootProps} variants — the native
 * `<select>` attributes (minus the state-owning and multiple-selection
 * ones), the `asChild` escape hatch, and the raw `onChange` passthrough.
 */
export type SelectRootBaseProps = Omit<
  ComponentProps<"select">,
  "value" | "defaultValue" | "multiple" | "onChange"
> & {
  /** Content of the select — typically {@link SelectOption}, {@link SelectGroup},
   * and optionally a leading {@link SelectPlaceholder}. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLSelectElement`. */
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
   * via the {@link Slot} pattern. Placeholder-detection inside Root
   * walks direct children only in this mode, so the `asChild` +
   * placeholder combination requires the consumer to set
   * `defaultValue=""` explicitly.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Uncontrolled variant of {@link SelectRootProps}: the browser owns the
 * selection. Pass `defaultValue` (or omit it); `onValueChange` is optional
 * and `value` is forbidden.
 */
export type SelectRootUncontrolledProps = SelectRootBaseProps & {
  /** Value of the option selected on first render. When omitted and a
   * {@link SelectPlaceholder} is present among Root's direct children,
   * Root infers `""` automatically so the placeholder is the initial
   * selection. */
  defaultValue?: string;
  /** Forbidden in uncontrolled mode — use `defaultValue` instead. */
  value?: never;
  /** Called with the new option value whenever the user changes the
   * selection. Optional in uncontrolled mode. */
  onValueChange?: (value: string) => void;
};

/**
 * Controlled variant of {@link SelectRootProps}: the parent owns the
 * selection. Pass `value` and `onValueChange` together; `defaultValue` is
 * forbidden.
 */
export type SelectRootControlledProps = SelectRootBaseProps & {
  /** Forbidden in controlled mode — use `value` instead. */
  defaultValue?: never;
  /** The currently selected option value. Must be kept in sync by the
   * parent via `onValueChange`. */
  value: string;
  /** Called with the new option value whenever the user changes the
   * selection. Required in controlled mode. */
  onValueChange: (value: string) => void;
};

/**
 * Props for {@link SelectRoot | `Select.Root`}.
 *
 * Resolves to either {@link SelectRootUncontrolledProps} or
 * {@link SelectRootControlledProps} — only one shape is accepted by
 * TypeScript at a time. Native `multiple`-selection mode is not supported
 * in v1.
 */
export type SelectRootProps =
  | SelectRootUncontrolledProps
  | SelectRootControlledProps;

/**
 * Props for {@link SelectOption | `Select.Option`} — all
 * `OptionHTMLAttributes` on the underlying `<option>` element, plus a
 * typed `ref`.
 */
export type SelectOptionProps = ComponentProps<"option"> & {
  /** The option label, rendered as the visible text inside the dropdown. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLOptionElement`. */
  ref?: Ref<HTMLOptionElement>;
};

/**
 * Props for {@link SelectGroup | `Select.Group`} — all
 * `OptgroupHTMLAttributes` on the underlying `<optgroup>` element (with
 * `label` narrowed to a required `string`), plus a typed `ref`.
 */
export type SelectGroupProps = Omit<ComponentProps<"optgroup">, "label"> & {
  /**
   * The group heading shown by the browser as a non-selectable label above
   * the grouped options. Announced as the group's accessible name by
   * assistive technology. Required — an `<optgroup>` without a label is
   * inaccessible.
   */
  label: string;
  /** The {@link SelectOption} / {@link SelectPlaceholder} elements belonging
   * to this group. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLOptGroupElement`. */
  ref?: Ref<HTMLOptGroupElement>;
};

/**
 * Props for {@link SelectPlaceholder | `Select.Placeholder`}.
 *
 * `value`, `disabled`, and `hidden` are owned by the component —
 * the placeholder always renders with `value=""`, `disabled`, and `hidden`
 * — so they are excluded from this type and cannot be set by the consumer.
 */
export type SelectPlaceholderProps = Omit<
  ComponentProps<"option">,
  "value" | "disabled" | "hidden"
> & {
  /** The placeholder hint text shown in the closed select before the user
   * makes a selection (e.g. `"Choose a fruit…"`). */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLOptionElement`. */
  ref?: Ref<HTMLOptionElement>;
};
