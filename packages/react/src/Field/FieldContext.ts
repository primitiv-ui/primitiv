import { createStrictContext } from "../utils";

export type FieldContextValue = {
  /** Stable id for the control wired to this field. */
  id: string;
  /** Id of the {@link Field.Description} element, when rendered. */
  descriptionId: string;
  /** Id of the {@link Field.ErrorText} element, when rendered. */
  errorId: string;
  /** Whether the field is in an invalid state. */
  invalid: boolean;
  /** Whether the field is disabled. */
  disabled: boolean;
  /** Whether the field is required. */
  required: boolean;
};

export const [FieldContext, useFieldContext] =
  createStrictContext<FieldContextValue>(
    "Field sub-components must be rendered inside a <Field.Root>.",
    "FieldContext",
  );
