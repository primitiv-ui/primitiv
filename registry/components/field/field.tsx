/*
 * Field — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/field/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { Field as FieldPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { field, fieldLabel, fieldDescription, fieldErrorText } from "./field.recipe";

/**
 * A form-field wrapper — coordinates a label, control, description, and error message and cascades id / validity / disabled / required to the control it wraps.
 *
 * @see https://primitiv-ui.dev/docs/components/field
 */
export type FieldProps = ComponentPropsWithRef<typeof FieldPrimitive.Root>;

export function Field({ className, ...props }: FieldProps) {
  return <FieldPrimitive.Root className={[field(), className].filter(Boolean).join(" ")} {...props} />;
}

export type FieldLabelProps = ComponentPropsWithRef<typeof FieldPrimitive.Label>;

export function FieldLabel({ className, ...props }: FieldLabelProps) {
  return <FieldPrimitive.Label className={[fieldLabel(), className].filter(Boolean).join(" ")} {...props} />;
}

export type FieldDescriptionProps = ComponentPropsWithRef<typeof FieldPrimitive.Description>;

export function FieldDescription({ className, ...props }: FieldDescriptionProps) {
  return <FieldPrimitive.Description className={[fieldDescription(), className].filter(Boolean).join(" ")} {...props} />;
}

export type FieldErrorTextProps = ComponentPropsWithRef<typeof FieldPrimitive.ErrorText>;

export function FieldErrorText({ className, ...props }: FieldErrorTextProps) {
  return <FieldPrimitive.ErrorText className={[fieldErrorText(), className].filter(Boolean).join(" ")} {...props} />;
}
