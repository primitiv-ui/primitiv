import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from "react";

import { useCollection, useRovingTabindex } from "../hooks/index.ts";
import { deriveId } from "../utils/index.ts";

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
  // The label of the committed value, kept so Escape can put the text back
  // after the user has typed over it (D1: the field never keeps a stale query).
  const [committedLabel, setCommittedLabel] = useState("");
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
      setCommittedLabel(label);
      setOpen(false);
      onValueChange?.(nextValue);
    },
    [onValueChange],
  );

  // The cursor. Null until the user asks for one with an arrow key — an
  // unopened combobox must not imply a pre-made choice.
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const { register: registerItem, keys: itemValues } = useCollection<string, HTMLElement>();
  const getItemId = useCallback(
    (itemValue: string) => deriveId(comboboxId, "option", itemValue),
    [comboboxId],
  );

  // Keys only — no tabIndex is manipulated anywhere, because DOM focus never
  // leaves the input. Same use of this hook as NavigationMenu.
  // `string | null`: unlike NavigationMenu's roving tabstop there is
  // legitimately no cursor until the user asks for one, so null is a real
  // state rather than an absence to be defaulted away.
  const { handleKeyDown: handleArrowKeys } = useRovingTabindex<string | null>({
    orientation: "vertical",
    navigable: itemValues,
    currentKey: activeValue,
    includeHomeEnd: true,
    onNavigate: (target) => {
      setActiveValue(target);
    },
  });

  const dismiss = useCallback(() => {
    setOpen(false);
    setQueryState(committedLabel);
    setActiveValue(null);
  }, [committedLabel]);

  // useRovingTabindex deliberately refuses to move `next`/`prev` when there is
  // no current key (RadioGroup's disabled-current contract), so seeding the
  // first cursor is this component's job: per APG, ArrowDown takes the first
  // item and ArrowUp the last.
  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Escape") {
        dismiss();
        return;
      }

      if (activeValue === null && itemValues.length > 0) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setActiveValue(itemValues[0]);
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setActiveValue(itemValues[itemValues.length - 1]);
          return;
        }
      }

      handleArrowKeys(event);
    },
    [dismiss, activeValue, itemValues, handleArrowKeys],
  );

  const contextValue = useMemo(
    () => ({
      open,
      listboxId,
      query,
      setQuery,
      value,
      select,
      handleInputKeyDown,
      activeValue,
      getItemId,
      registerItem,
    }),
    [
      open,
      listboxId,
      query,
      setQuery,
      value,
      select,
      handleInputKeyDown,
      activeValue,
      getItemId,
      registerItem,
    ],
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
  const { open, listboxId, query, setQuery, activeValue, getItemId, handleInputKeyDown } =
    useComboboxContext();

  return (
    <input
      role="combobox"
      aria-expanded={open}
      aria-controls={listboxId}
      aria-autocomplete="list"
      value={query}
      aria-activedescendant={activeValue === null ? undefined : getItemId(activeValue)}
      onChange={(event) => setQuery(event.target.value)}
      onKeyDown={handleInputKeyDown}
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
  const { value, select, activeValue, getItemId, registerItem } = useComboboxContext();
  const selected = value === itemValue;
  const highlighted = activeValue === itemValue;

  const localRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    registerItem(itemValue, localRef.current);
    return () => registerItem(itemValue, null);
  }, [itemValue, registerItem]);

  return (
    <div
      role="option"
      id={getItemId(itemValue)}
      ref={localRef}
      aria-selected={selected}
      data-highlighted={highlighted ? "" : undefined}
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
