import { ComponentProps, ReactNode } from "react";

/** Props for `Field.Root`, the wrapper that owns shared field state. */
export type FieldRootProps = ComponentProps<"div"> & {
  /** Stable id wired to the control via {@link FieldLabel}'s `htmlFor`. Auto-generated via `useId` when omitted. */
  id?: string;
  /** Marks the field as invalid; cascades to the control via context. */
  invalid?: boolean;
  /** Disables the field; cascades to the control via context. */
  disabled?: boolean;
  /** Marks the field as required; cascades to the control via context. */
  required?: boolean;
  /** Renders the consumer element instead of `<div>` via Slot. */
  asChild?: boolean;
  children?: ReactNode;
};

/** Props for `Field.Label`, the field's `<label>`. */
export type FieldLabelProps = ComponentProps<"label"> & {
  /** Renders the consumer element instead of `<label>` via Slot. */
  asChild?: boolean;
  children?: ReactNode;
};

/** Props for `Field.Description`, the field's supporting helper text. */
export type FieldDescriptionProps = ComponentProps<"div"> & {
  /** Renders the consumer element instead of `<div>` via Slot. */
  asChild?: boolean;
  children?: ReactNode;
};

/** Props for `Field.ErrorText`, the error message shown when invalid. */
export type FieldErrorTextProps = ComponentProps<"div"> & {
  /** Renders the consumer element instead of `<div>` via Slot. */
  asChild?: boolean;
  children?: ReactNode;
};
