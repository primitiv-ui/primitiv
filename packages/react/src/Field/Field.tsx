import { useId, useMemo } from "react";
import type { ReactElement } from "react";

import { Slot } from "../Slot/index.ts";
import { FieldContext } from "./FieldContext";
import { useFieldContext } from "./hooks/index.ts";
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
 * **`asChild` composition.** Pass `asChild` to render the consumer's
 * element instead of `<div>` — e.g. a semantic `<fieldset>` or
 * `<section>`. The `data-field-*` hooks and context provider stay
 * intact.
 *
 * **Styling hooks.** `data-field=""` always; `data-field-invalid` /
 * `data-field-disabled` / `data-field-required` present (empty string)
 * only when the corresponding flag is truthy.
 *
 * @extends HTMLDivElement
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
export function FieldRoot({
  id: idProp,
  invalid = false,
  disabled = false,
  required = false,
  asChild = false,
  children,
  ...rest
}: FieldRootProps): ReactElement {
  const autoId = useId();
  const id = idProp ?? autoId;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  const value = useMemo(
    () => ({ id, descriptionId, errorId, invalid, disabled, required }),
    [id, descriptionId, errorId, invalid, disabled, required],
  );

  const rootProps = {
    ...rest,
    "data-field": "",
    "data-field-invalid": invalid ? "" : undefined,
    "data-field-disabled": disabled ? "" : undefined,
    "data-field-required": required ? "" : undefined,
  };

  return (
    <FieldContext.Provider value={value}>
      {asChild ? (
        <Slot {...rootProps}>{children}</Slot>
      ) : (
        <div {...rootProps}>{children}</div>
      )}
    </FieldContext.Provider>
  );
}

/** @internal */
// Stryker disable next-line StringLiteral: overwritten by the compound alias — an equivalent mutant.
FieldRoot.displayName = "FieldRoot";

/**
 * Renders a `<label>` wired to the field's id via `htmlFor` — clicking
 * the label focuses the associated control.
 *
 * **`asChild` composition.** Pass `asChild` to render any consumer
 * element with the `htmlFor` attribute merged on.
 *
 * @throws If rendered outside a `<Field.Root>`.
 *
 * @extends HTMLLabelElement
 *
 * @example
 * ```tsx
 * <Field.Label>Email address</Field.Label>
 * ```
 */
export function FieldLabel({
  asChild = false,
  children,
  ...rest
}: FieldLabelProps): ReactElement {
  const { id } = useFieldContext();
  const labelProps = { ...rest, htmlFor: id };

  if (asChild) {
    return <Slot {...labelProps}>{children}</Slot>;
  }
  return <label {...labelProps}>{children}</label>;
}

/** @internal */
FieldLabel.displayName = "FieldLabel";

/**
 * Renders a `<div>` carrying the field's `descriptionId`. Reference it
 * from your control via `aria-describedby` for assistive technology to
 * announce it alongside the label — `Input` does this automatically
 * when nested inside a `<Field.Root>`.
 *
 * **`asChild` composition.** Pass `asChild` to render a `<p>`,
 * `<span>`, or any other element with the `id` merged on.
 *
 * @throws If rendered outside a `<Field.Root>`.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <Field.Description>We'll only use this to sign you in.</Field.Description>
 * ```
 */
export function FieldDescription({
  asChild = false,
  children,
  ...rest
}: FieldDescriptionProps): ReactElement {
  const { descriptionId } = useFieldContext();
  const descriptionProps = { ...rest, id: descriptionId };

  if (asChild) {
    return <Slot {...descriptionProps}>{children}</Slot>;
  }
  return <div {...descriptionProps}>{children}</div>;
}

/** @internal */
FieldDescription.displayName = "FieldDescription";

/**
 * Renders a `<div role="alert">` carrying the field's `errorId` — only
 * when the field is in an invalid state. Returns `null` otherwise, so
 * consumers can render it unconditionally and rely on the field to gate
 * visibility.
 *
 * **`asChild` composition.** Pass `asChild` to render the consumer's
 * element with the `id` and `role="alert"` merged on.
 *
 * @extends HTMLDivElement
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
export function FieldErrorText({
  asChild = false,
  children,
  ...rest
}: FieldErrorTextProps): ReactElement | null {
  const { errorId, invalid } = useFieldContext();
  if (!invalid) return null;
  const errorProps = { ...rest, id: errorId, role: "alert" as const };

  if (asChild) {
    return <Slot {...errorProps}>{children}</Slot>;
  }
  return <div {...errorProps}>{children}</div>;
}

/** @internal */
FieldErrorText.displayName = "FieldErrorText";

/** Type of the {@link Field} compound — the Root callable plus its sub-components. */
export type TFieldCompound = typeof FieldRoot & {
  /** The wrapper that owns shared field state and context. */
  Root: typeof FieldRoot;
  /** The field's label. */
  Label: typeof FieldLabel;
  /** The field's supporting helper text. */
  Description: typeof FieldDescription;
  /** The error message shown when invalid. */
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
 *   `<div data-field>` wrapper (or any element via `asChild`).
 * - {@link FieldLabel | `Field.Label`} — `<label htmlFor>` wired to the
 *   field id.
 * - {@link FieldDescription | `Field.Description`} — `<div id>` for
 *   help text, referenced via `aria-describedby`.
 * - {@link FieldErrorText | `Field.ErrorText`} — `<div role="alert">`
 *   rendered only when invalid.
 *
 * Every part supports `asChild` for the consumer to swap in their own
 * element while keeping the wiring.
 *
 * @example Basic
 * ```tsx
 * import { Field, Input } from "@primitiv-ui/react";
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
