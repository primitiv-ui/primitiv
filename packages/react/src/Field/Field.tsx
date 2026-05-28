import { useId, useMemo } from "react";

import { FieldContext } from "./FieldContext";
import { useFieldContext } from "./hooks";
import {
  FieldDescriptionProps,
  FieldErrorTextProps,
  FieldLabelProps,
  FieldRootProps,
} from "./types";

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

function FieldLabel({ children, ...rest }: FieldLabelProps) {
  const { id } = useFieldContext();
  return (
    <label htmlFor={id} {...rest}>
      {children}
    </label>
  );
}

FieldLabel.displayName = "FieldLabel";

function FieldDescription({ children, ...rest }: FieldDescriptionProps) {
  const { descriptionId } = useFieldContext();
  return (
    <div id={descriptionId} {...rest}>
      {children}
    </div>
  );
}

FieldDescription.displayName = "FieldDescription";

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

const FieldCompound: TFieldCompound = Object.assign(FieldRoot, {
  Root: FieldRoot,
  Label: FieldLabel,
  Description: FieldDescription,
  ErrorText: FieldErrorText,
});

FieldCompound.displayName = "Field";

export { FieldCompound as Field };
