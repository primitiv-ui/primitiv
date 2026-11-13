import type { ReactElement } from "react";

/** Props for {@link FormValues}. */
export type FormValuesProps = {
  /** The name to submit under. Without one, nothing is rendered. */
  name: string | undefined;
  /** The values to submit, one hidden input each. */
  values: readonly string[];
};

/**
 * Hidden inputs that let a group take part in its form the way same-named
 * native controls do: a radio group submits its one value, a set of checkboxes
 * one entry each. Rendered beside the root rather than inside it, so a root
 * rendered `asChild` keeps its single child. Nothing without a `name`.
 */
export function FormValues({ name, values }: FormValuesProps): ReactElement | null {
  if (name === undefined) return null;
  return (
    <>
      {values.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}
    </>
  );
}
