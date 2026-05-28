import { ComponentProps, ReactNode } from "react";

export type FieldRootProps = ComponentProps<"div"> & {
  /** Stable id wired to the control via {@link FieldLabel}'s `htmlFor`. Auto-generated via `useId` when omitted. */
  id?: string;
  /** Marks the field as invalid; cascades to the control via context. */
  invalid?: boolean;
  /** Disables the field; cascades to the control via context. */
  disabled?: boolean;
  /** Marks the field as required; cascades to the control via context. */
  required?: boolean;
  children?: ReactNode;
};

export type FieldLabelProps = ComponentProps<"label"> & {
  children?: ReactNode;
};

export type FieldDescriptionProps = ComponentProps<"div"> & {
  children?: ReactNode;
};

export type FieldErrorTextProps = ComponentProps<"div"> & {
  children?: ReactNode;
};
