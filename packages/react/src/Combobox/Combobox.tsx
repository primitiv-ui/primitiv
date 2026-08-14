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

import { useCollection, useControllableState, useRovingTabindex } from "../hooks/index.ts";
import { Slot, composeEventHandlers } from "../Slot/index.ts";
import { deriveId } from "../utils/index.ts";

import { ComboboxProvider, useComboboxContext } from "./ComboboxContext";
import type {
  ComboboxContentProps,
  ComboboxEmptyProps,
  ComboboxItemMeta,
  ComboboxInputProps,
  ComboboxItemProps,
  ComboboxRootProps,
} from "./types";

/** The root of a Combobox — owns the open state and wraps the input and popup. */
export function ComboboxRoot({
  asChild = false,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  defaultValue = "",
  value: valueProp,
  onQueryChange,
  onValueChange,
  children,
  ...rest
}: ComboboxRootProps): ReactElement {
  const [open, setOpen] = useControllableState(openProp, defaultOpen, onOpenChange);
  const [query, setQueryState] = useState("");
  const [value, setValue] = useControllableState(valueProp, defaultValue, onValueChange);
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
    [onQueryChange, setOpen],
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
    },
    [setValue, setOpen],
  );

  // The cursor. Null until the user asks for one with an arrow key — an
  // unopened combobox must not imply a pre-made choice.
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const {
    register: registerItem,
    keys: itemValues,
    itemsRef,
  } = useCollection<string, ComboboxItemMeta>();
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
  }, [committedLabel, setOpen]);

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

      if (event.key === "Enter") {
        if (activeValue === null) return;
        event.preventDefault();
        // Enter resolves the label from the registry so it agrees with what a
        // click on the same item would commit. The cursor can only ever hold a
        // value the registry put there, so the lookup cannot miss — asserted
        // rather than branched, as Listbox does for the same registry.
        select(activeValue, itemsRef.current.get(activeValue)!.label);
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
    [dismiss, activeValue, itemValues, handleArrowKeys, select, itemsRef],
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

  const Root = asChild ? Slot : "div";

  return (
    <ComboboxProvider value={contextValue}>
      <Root {...rest}>{children}</Root>
    </ComboboxProvider>
  );
}

// Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
ComboboxRoot.displayName = "ComboboxRoot";

/** The editable text field, carrying `role="combobox"` per the ARIA 1.2 pattern. */
export function ComboboxInput({
  asChild = false,
  onChange,
  onKeyDown,
  ...rest
}: ComboboxInputProps): ReactElement {
  const { open, listboxId, query, setQuery, activeValue, getItemId, handleInputKeyDown } =
    useComboboxContext();

  const Input = asChild ? Slot : "input";

  return (
    <Input
      role="combobox"
      aria-expanded={open}
      aria-controls={listboxId}
      aria-autocomplete="list"
      value={query}
      aria-activedescendant={activeValue === null ? undefined : getItemId(activeValue)}
      onChange={composeEventHandlers(onChange, (event) => setQuery(event.target.value))}
      onKeyDown={composeEventHandlers(onKeyDown, handleInputKeyDown)}
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
export function ComboboxContent({
  asChild = false,
  children,
  ...rest
}: ComboboxContentProps): ReactElement | null {
  const { open, listboxId } = useComboboxContext();

  if (!open) return null;

  const Content = asChild ? Slot : "div";

  return (
    <Content role="listbox" id={listboxId} {...rest}>
      {children}
    </Content>
  );
}

// Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
ComboboxContent.displayName = "ComboboxContent";

/** One selectable option in the popup listbox. */
export function ComboboxItem({
  asChild = false,
  value: itemValue,
  children,
  onClick,
  ...rest
}: ComboboxItemProps): ReactElement {
  const { value, select, activeValue, getItemId, registerItem } = useComboboxContext();
  const selected = value === itemValue;
  const highlighted = activeValue === itemValue;

  // An item is commonly an icon plus a label, so children are not always a
  // string. There is no reliable way to read a label out of arbitrary JSX, so
  // the value stands in — consumers wanting a nicer closed-state label should
  // pass string children. Registered here so click and Enter agree.
  const label = typeof children === "string" ? children : itemValue;

  const localRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    registerItem(itemValue, { element: localRef.current, label });
    return () => registerItem(itemValue, null);
  }, [itemValue, label, registerItem]);

  const Item = asChild ? Slot : "div";

  return (
    <Item
      role="option"
      id={getItemId(itemValue)}
      ref={localRef}
      aria-selected={selected}
      data-highlighted={highlighted ? "" : undefined}
      onClick={composeEventHandlers(onClick, () => {
        select(itemValue, label);
      })}
      {...rest}
    >
      {children}
    </Item>
  );
}

// Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
ComboboxItem.displayName = "ComboboxItem";

/**
 * The no-results message shown inside the popup while the filtered list is
 * empty. `role="presentation"` so it is not announced as an option and the
 * cursor has nothing to land on — the panel stays open at a stable height so
 * the user can keep typing. Rendering it is the consumer's call, since
 * filtering is consumer-owned.
 */
export function ComboboxEmpty({
  asChild = false,
  children,
  ...rest
}: ComboboxEmptyProps): ReactElement {
  const Empty = asChild ? Slot : "div";

  return (
    <Empty role="presentation" {...rest}>
      {children}
    </Empty>
  );
}

// Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
ComboboxEmpty.displayName = "ComboboxEmpty";

/**
 * The shape of the exported `Combobox` value — callable as `Combobox.Root` and
 * carrying its sub-components as static properties.
 */
export type TComboboxCompound = typeof ComboboxRoot & {
  Root: typeof ComboboxRoot;
  Input: typeof ComboboxInput;
  Content: typeof ComboboxContent;
  Item: typeof ComboboxItem;
  Empty: typeof ComboboxEmpty;
};

const ComboboxCompound: TComboboxCompound = Object.assign(ComboboxRoot, {
  Root: ComboboxRoot,
  Input: ComboboxInput,
  Content: ComboboxContent,
  Item: ComboboxItem,
  Empty: ComboboxEmpty,
});

// Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
ComboboxCompound.displayName = "Combobox";

export { ComboboxCompound as Combobox };
