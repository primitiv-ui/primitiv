import { useContext } from "react";

import { FieldContext } from "../FieldContext";

type FieldAwareProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?:
    | boolean
    | "true"
    | "false"
    | "grammar"
    | "spelling"
    | undefined;
  disabled?: boolean;
  required?: boolean;
};

/**
 * Merges consumer-supplied props with any {@link FieldContext} available
 * higher in the tree. Use it inside form controls (Input, Textarea,
 * Select, ...) so they automatically inherit the field's id, aria
 * wiring, and `disabled` / `required` cascade when nested inside
 * `<Field.Root>`.
 *
 * **Merge rules**
 * - `id`, `disabled`, `required`, `aria-invalid`: consumer wins; the
 *   field provides the fallback.
 * - `aria-describedby`: composes — consumer-supplied ids come first,
 *   then the field's `descriptionId`, then the `errorId` when invalid.
 *
 * When no FieldContext is in scope the consumer props are returned
 * unchanged, so existing usage outside a `<Field.Root>` is unaffected.
 */
export function useFieldProps<P extends FieldAwareProps>(consumerProps: P): P {
  const field = useContext(FieldContext);
  if (!field) return consumerProps;

  const composedDescribedBy =
    [
      consumerProps["aria-describedby"],
      field.descriptionId,
      field.invalid ? field.errorId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  return {
    ...consumerProps,
    id: consumerProps.id ?? field.id,
    disabled: consumerProps.disabled ?? field.disabled,
    required: consumerProps.required ?? field.required,
    "aria-invalid":
      consumerProps["aria-invalid"] ?? (field.invalid || undefined),
    "aria-describedby": composedDescribedBy,
  };
}
