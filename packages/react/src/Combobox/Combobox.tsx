import type { ReactElement } from "react";

import type { ComboboxInputProps, ComboboxRootProps } from "./types";

/** The root of a Combobox — wraps the input and its popup listbox. */
export function ComboboxRoot({ children, ...rest }: ComboboxRootProps): ReactElement {
  return <div {...rest}>{children}</div>;
}

// Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
ComboboxRoot.displayName = "ComboboxRoot";

/** The editable text field, carrying `role="combobox"` per the ARIA 1.2 pattern. */
export function ComboboxInput({ ...rest }: ComboboxInputProps): ReactElement {
  return <input role="combobox" {...rest} />;
}

// Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
ComboboxInput.displayName = "ComboboxInput";

/**
 * The shape of the exported `Combobox` value — callable as `Combobox.Root` and
 * carrying its sub-components as static properties.
 */
export type TComboboxCompound = typeof ComboboxRoot & {
  Root: typeof ComboboxRoot;
  Input: typeof ComboboxInput;
};

const ComboboxCompound: TComboboxCompound = Object.assign(ComboboxRoot, {
  Root: ComboboxRoot,
  Input: ComboboxInput,
});

// Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
ComboboxCompound.displayName = "Combobox";

export { ComboboxCompound as Combobox };
