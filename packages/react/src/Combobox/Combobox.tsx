import { useId, useMemo, useState, type ReactElement } from "react";

import { ComboboxProvider, useComboboxContext } from "./ComboboxContext";
import type {
  ComboboxContentProps,
  ComboboxInputProps,
  ComboboxRootProps,
} from "./types";

/** The root of a Combobox — owns the open state and wraps the input and popup. */
export function ComboboxRoot({
  defaultOpen = false,
  children,
  ...rest
}: ComboboxRootProps): ReactElement {
  const [open] = useState(defaultOpen);
  // One listbox per combobox, so this is a fixed suffix rather than a
  // `deriveId` per-item id — there is no per-item value to discriminate on.
  const comboboxId = useId();
  const listboxId = `${comboboxId}-listbox`;
  const value = useMemo(() => ({ open, listboxId }), [open, listboxId]);

  return (
    <ComboboxProvider value={value}>
      <div {...rest}>{children}</div>
    </ComboboxProvider>
  );
}

// Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
ComboboxRoot.displayName = "ComboboxRoot";

/** The editable text field, carrying `role="combobox"` per the ARIA 1.2 pattern. */
export function ComboboxInput({ ...rest }: ComboboxInputProps): ReactElement {
  const { open, listboxId } = useComboboxContext();

  return (
    <input
      role="combobox"
      aria-expanded={open}
      aria-controls={listboxId}
      aria-autocomplete="list"
      {...rest}
    />
  );
}

// Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
ComboboxInput.displayName = "ComboboxInput";

/**
 * The popup listbox. Unmounted while closed — the closed combobox has no list
 * in the accessibility tree at all.
 */
export function ComboboxContent({ children, ...rest }: ComboboxContentProps): ReactElement | null {
  const { open, listboxId } = useComboboxContext();

  if (!open) return null;

  return (
    <div role="listbox" id={listboxId} {...rest}>
      {children}
    </div>
  );
}

// Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
ComboboxContent.displayName = "ComboboxContent";

/**
 * The shape of the exported `Combobox` value — callable as `Combobox.Root` and
 * carrying its sub-components as static properties.
 */
export type TComboboxCompound = typeof ComboboxRoot & {
  Root: typeof ComboboxRoot;
  Input: typeof ComboboxInput;
  Content: typeof ComboboxContent;
};

const ComboboxCompound: TComboboxCompound = Object.assign(ComboboxRoot, {
  Root: ComboboxRoot,
  Input: ComboboxInput,
  Content: ComboboxContent,
});

// Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
ComboboxCompound.displayName = "Combobox";

export { ComboboxCompound as Combobox };
