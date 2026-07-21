import { ComponentProps, ReactNode } from "react";

/**
 * Props for {@link FieldRoot | `Field.Root`} — the wrapper that owns the
 * shared field id, derived `descriptionId` / `errorId`, and the
 * `invalid` / `disabled` / `required` cascade. Extends the native
 * `<div>` props; `id` is redeclared purely to document its role as the
 * field-wide id (its type is unchanged from the native attribute).
 */
export type FieldRootProps = ComponentProps<"div"> & {
  /** Stable id for the field. Wired to the control via
   * {@link FieldLabel | `Field.Label`}'s `htmlFor`, and used to derive
   * the `descriptionId` (`<id>-description`) and `errorId`
   * (`<id>-error`) exposed through {@link FieldContext}. Auto-generated
   * via React's `useId` when omitted. */
  id?: string;
  /** Marks the field invalid. Cascades to a context-aware control (e.g.
   * `Input`) as `aria-invalid`, sets `data-field-invalid` on the
   * wrapper, and gates {@link FieldErrorText | `Field.ErrorText`}
   * rendering.
   * @default false */
  invalid?: boolean;
  /** Disables the field. Cascades to the control's `disabled` prop and
   * sets `data-field-disabled` on the wrapper.
   * @default false */
  disabled?: boolean;
  /** Marks the field required. Cascades to the control's `required` prop
   * and sets `data-field-required` on the wrapper.
   * @default false */
  required?: boolean;
  /** Render the consumer's element instead of `<div>` via the
   * {@link Slot} pattern — e.g. a semantic `<fieldset>`. The
   * `data-field-*` hooks and context provider are preserved.
   * @default false */
  asChild?: boolean;
  /** The label, control, description, and error sub-components composed
   * inside the field. */
  children?: ReactNode;
};

/**
 * Props for {@link FieldLabel | `Field.Label`} — the field's `<label>`,
 * wired to the field id via `htmlFor`. Extends the native `<label>`
 * props.
 */
export type FieldLabelProps = ComponentProps<"label"> & {
  /** Render the consumer's element instead of `<label>` via the
   * {@link Slot} pattern, with `htmlFor` merged on.
   * @default false */
  asChild?: boolean;
  /** The label text. */
  children?: ReactNode;
};

/**
 * Props for {@link FieldDescription | `Field.Description`} — the field's
 * supporting helper text, carrying the field's `descriptionId` so a
 * context-aware control can reference it via `aria-describedby`. Extends
 * the native `<div>` props.
 */
export type FieldDescriptionProps = ComponentProps<"div"> & {
  /** Render the consumer's element instead of `<div>` via the
   * {@link Slot} pattern (e.g. a `<p>` or `<span>`), with the derived
   * `id` merged on.
   * @default false */
  asChild?: boolean;
  /** The helper text. */
  children?: ReactNode;
};

/**
 * Props for {@link FieldErrorText | `Field.ErrorText`} — the error
 * message shown only when the field is
 * {@link FieldRootProps.invalid | invalid}. Renders `role="alert"` and
 * carries the field's `errorId`. Extends the native `<div>` props.
 */
export type FieldErrorTextProps = ComponentProps<"div"> & {
  /** Render the consumer's element instead of `<div>` via the
   * {@link Slot} pattern, with the derived `id` and `role="alert"`
   * merged on.
   * @default false */
  asChild?: boolean;
  /** The error message. */
  children?: ReactNode;
};
