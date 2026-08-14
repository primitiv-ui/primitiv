import { useCallback, useId, useMemo, useState, type ReactElement } from "react";

import { ComboboxProvider, useComboboxContext } from "./ComboboxContext";
import type {
  ComboboxContentProps,
  ComboboxInputProps,
  ComboboxItemProps,
  ComboboxRootProps,
} from "./types";

/** The root of a Combobox — owns the open state and wraps the input and popup. */
export function ComboboxRoot({
  defaultOpen = false,
  onQueryChange,
  onValueChange,
  children,
  ...rest
}: ComboboxRootProps): ReactElement {
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQueryState] = useState("");
  const [value, setValue] = useState("");
  // One listbox per combobox, so this is a fixed suffix rather than a
  // `deriveId` per-item id — there is no per-item value to discriminate on.
  const comboboxId = useId();
  const listboxId = `${comboboxId}-listbox`;
  // Typing always opens the popup: the user is narrowing a list, so the list
  // has to be on screen to be narrowed.
  const setQuery = useCallback(
    (next: string) => {
      setQueryState(next);
      setOpen(true);
      onQueryChange?.(next);
    },
    [onQueryChange],
  );

  // D1: committing a choice closes the popup and resets the text FROM THE
  // VALUE, so the field never sits showing a half-typed query that is not the
  // value. The label comes from the item because the value alone cannot say
  // how it should read.
  const select = useCallback(
    (nextValue: string, label: string) => {
      setValue(nextValue);
      setQueryState(label);
      setOpen(false);
      onValueChange?.(nextValue);
    },
    [onValueChange],
  );

  const contextValue = useMemo(
    () => ({ open, listboxId, query, setQuery, value, select }),
    [open, listboxId, query, setQuery, value, select],
  );

  return (
    <ComboboxProvider value={contextValue}>
      <div {...rest}>{children}</div>
    </ComboboxProvider>
  );
}

// Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
ComboboxRoot.displayName = "ComboboxRoot";

/** The editable text field, carrying `role="combobox"` per the ARIA 1.2 pattern. */
export function ComboboxInput({ ...rest }: ComboboxInputProps): ReactElement {
  const { open, listboxId, query, setQuery } = useComboboxContext();

  return (
    <input
      role="combobox"
      aria-expanded={open}
      aria-controls={listboxId}
      aria-autocomplete="list"
      value={query}
      onChange={(event) => setQuery(event.target.value)}
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

/** One selectable option in the popup listbox. */
export function ComboboxItem({
  value: itemValue,
  children,
  ...rest
}: ComboboxItemProps): ReactElement {
  const { value, select } = useComboboxContext();
  const selected = value === itemValue;

  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={() => {
        // An item is commonly an icon plus a label, so children are not always
        // a string. There is no reliable way to read a label out of arbitrary
        // JSX, so the value stands in — consumers wanting a nicer closed-state
        // label should pass string children.
        select(itemValue, typeof children === "string" ? children : itemValue);
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

// Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
ComboboxItem.displayName = "ComboboxItem";

/**
 * The shape of the exported `Combobox` value — callable as `Combobox.Root` and
 * carrying its sub-components as static properties.
 */
export type TComboboxCompound = typeof ComboboxRoot & {
  Root: typeof ComboboxRoot;
  Input: typeof ComboboxInput;
  Content: typeof ComboboxContent;
  Item: typeof ComboboxItem;
};

const ComboboxCompound: TComboboxCompound = Object.assign(ComboboxRoot, {
  Root: ComboboxRoot,
  Input: ComboboxInput,
  Content: ComboboxContent,
  Item: ComboboxItem,
});

// Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
ComboboxCompound.displayName = "Combobox";

export { ComboboxCompound as Combobox };
