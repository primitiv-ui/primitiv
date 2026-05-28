import { useId, useMemo } from "react";

import { FieldContext } from "./FieldContext";
import { useFieldContext } from "./hooks";
import {
  FieldDescriptionProps,
  FieldErrorTextProps,
  FieldLabelProps,
  FieldRootProps,
} from "./types";

/**
 * The root of a Field — provides {@link FieldContext} (stable id plus
 * derived `descriptionId` / `errorId`, and the cascaded `invalid` /
 * `disabled` / `required` flags) and renders a `<div data-field>`
 * wrapper.
 *
 * **ID propagation.** If `id` is passed, it's used directly; otherwise
 * a stable id is auto-generated via React's `useId`. The
 * `descriptionId` and `errorId` are derived from the field id
 * (`<id>-description` / `<id>-error`) and are exposed via context to
 * any sub-component or context-aware control (e.g. `Input`).
 *
 * **State cascade.** `invalid`, `disabled`, and `required` cascade via
 * context to any control reading {@link FieldContext} — `Input`
 * inherits them automatically when nested inside a `<Field.Root>` and
 * the consumer hasn't passed an explicit override. The wrapper also
 * carries `data-field-invalid` / `data-field-disabled` /
 * `data-field-required` attributes when the corresponding flag is
 * truthy, so CSS can style the whole field group on a single selector.
 *
 * @example
 * ```tsx
 * <Field.Root id="email" invalid={!!errors.email}>
 *   <Field.Label>Email</Field.Label>
 *   <Input type="email" {...register("email")} />
 *   <Field.Description>We won't share it.</Field.Description>
 *   <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
 * </Field.Root>
 * ```
 */
function FieldRoot({
  id: idProp,
  invalid = false,
  disabled = false,
  required = false,
  children,
  ...rest
}: FieldRootProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  const value = useMemo(
    () => ({ id, descriptionId, errorId, invalid, disabled, required }),
    [id, descriptionId, errorId, invalid, disabled, required],
  );

  return (
    <FieldContext.Provider value={value}>
      <div
        {...rest}
        data-field=""
        data-field-invalid={invalid ? "" : undefined}
        data-field-disabled={disabled ? "" : undefined}
        data-field-required={required ? "" : undefined}
      >
        {children}
      </div>
    </FieldContext.Provider>
  );
}

FieldRoot.displayName = "FieldRoot";

/**
 * Renders a `<label>` wired to the field's id via `htmlFor` — clicking
 * the label focuses the associated control.
 *
 * @throws If rendered outside a `<Field.Root>`.
 */
function FieldLabel({ children, ...rest }: FieldLabelProps) {
  const { id } = useFieldContext();
  return (
    <label htmlFor={id} {...rest}>
      {children}
    </label>
  );
}

FieldLabel.displayName = "FieldLabel";

/**
 * Renders a `<div>` carrying the field's `descriptionId`. Reference it
 * from your control via `aria-describedby` for assistive technology to
 * announce it alongside the label — `Input` does this automatically
 * when nested inside a `<Field.Root>`.
 *
 * @throws If rendered outside a `<Field.Root>`.
 */
function FieldDescription({ children, ...rest }: FieldDescriptionProps) {
  const { descriptionId } = useFieldContext();
  return (
    <div id={descriptionId} {...rest}>
      {children}
    </div>
  );
}

FieldDescription.displayName = "FieldDescription";

/**
 * Renders a `<div role="alert">` carrying the field's `errorId` — only
 * when the field is in an invalid state. Returns `null` otherwise, so
 * consumers can render it unconditionally and rely on the field to gate
 * visibility.
 *
 * @example
 * ```tsx
 * <Field.Root invalid={!!errors.email}>
 *   <Field.ErrorText>{errors.email?.message ?? "Required"}</Field.ErrorText>
 * </Field.Root>
 * ```
 *
 * @throws If rendered outside a `<Field.Root>`.
 */
function FieldErrorText({ children, ...rest }: FieldErrorTextProps) {
  const { errorId, invalid } = useFieldContext();
  if (!invalid) return null;
  return (
    <div id={errorId} role="alert" {...rest}>
      {children}
    </div>
  );
}

FieldErrorText.displayName = "FieldErrorText";

type TFieldCompound = typeof FieldRoot & {
  Root: typeof FieldRoot;
  Label: typeof FieldLabel;
  Description: typeof FieldDescription;
  ErrorText: typeof FieldErrorText;
};

/**
 * Headless, accessible **Field** — a coordinator compound that owns the
 * `id`, `aria-describedby`, and `invalid` / `disabled` / `required`
 * wiring for a single form control plus its label, description, and
 * error message. Zero styles ship.
 *
 * `Field` does not render the control itself — it sits *around* an
 * existing control (`Input`, `InputGroup` wrapping an `Input`, a future
 * `Textarea`, etc.). The control opts into {@link FieldContext} to
 * inherit the wiring; the sub-components below render the
 * label / description / error UI.
 *
 * `Field` is callable (alias of `Field.Root`) and carries its
 * sub-components as static properties:
 *
 * - {@link FieldRoot | `Field.Root`} — provides context, renders the
 *   `<div data-field>` wrapper.
 * - {@link FieldLabel | `Field.Label`} — `<label htmlFor>` wired to the
 *   field id.
 * - {@link FieldDescription | `Field.Description`} — `<div id>` for
 *   help text, referenced via `aria-describedby`.
 * - {@link FieldErrorText | `Field.ErrorText`} — `<div role="alert">`
 *   rendered only when invalid.
 *
 * @example Basic
 * ```tsx
 * import { Field, Input } from "@primitiv/react";
 *
 * <Field.Root>
 *   <Field.Label>Email</Field.Label>
 *   <Input type="email" required />
 *   <Field.Description>We won't share it.</Field.Description>
 * </Field.Root>
 * ```
 *
 * @example With error and InputGroup adornments
 * ```tsx
 * <Field.Root id="email" invalid={!!errors.email}>
 *   <Field.Label>Email</Field.Label>
 *   <InputGroup>
 *     <InputGroup.LeadingAdornment><MailIcon aria-hidden="true" /></InputGroup.LeadingAdornment>
 *     <Input type="email" {...register("email")} />
 *   </InputGroup>
 *   <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
 * </Field.Root>
 * ```
 *
 * @see {@link FieldContext} — the context shape that controls can opt into.
 */
const FieldCompound: TFieldCompound = Object.assign(FieldRoot, {
  Root: FieldRoot,
  Label: FieldLabel,
  Description: FieldDescription,
  ErrorText: FieldErrorText,
});

FieldCompound.displayName = "Field";

export { FieldCompound as Field };
