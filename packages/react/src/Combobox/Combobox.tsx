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
import { Slot, composeEventHandlers, composeRefs } from "../Slot/index.ts";
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

/**
 * The root of a Combobox — owns the open state, the selected value, the live
 * query and the virtual-focus cursor, and provides {@link ComboboxContextValue}
 * to its parts.
 *
 * **Filtering is consumer-owned.** There is deliberately no `filter` prop: the
 * root reports keystrokes through
 * {@link ComboboxRootProps.onQueryChange | `onQueryChange`} and you render the
 * options you want. That keeps async loading, fuzzy matching and sorting where
 * the data lives.
 *
 * **Query versus value.** While the popup is open the input holds whatever the
 * user typed; committing a choice or pressing Escape resets the text from the
 * selected value, so the field never sits showing a half-typed query that is
 * not the value.
 *
 * **Virtual focus, not a roving tabstop.** DOM focus never leaves the input.
 * The cursor is published as `aria-activedescendant` on the input and
 * `data-highlighted` on the item, which is what lets the input keep focus while
 * driving the list.
 *
 * @extends HTMLDivElement
 */
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
      // Emptying the field is a DESELECT. D1 resets the text from the value on
      // close, which taken alone made a cleared field un-clearable — Escape put
      // the deleted label straight back. Clearing the value too keeps D1's
      // invariant (the field never shows text that is not the value: here both
      // are empty) while letting the gesture mean what the user intended.
      // Guarded on there being something to clear, so an already-empty field
      // never reports a change the consumer did not cause.
      if (next === "" && value !== "") {
        setValue("");
        setCommittedLabel("");
      }
    },
    [onQueryChange, setOpen, setValue, value],
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

  // APG: when the referenced option is not fully visible, scroll it into view.
  // Every cursor move goes through here rather than calling setActiveValue
  // directly, so no path can move the cursor without bringing it on screen —
  // which matters because the styled panel scrolls (18rem by default), so an
  // unscrolled cursor simply walks off the bottom of a filtered list. Mirrors
  // Listbox's own `moveCursor`, down to `block: "nearest"` — the option that
  // does nothing when the item is already visible, so ordinary arrowing does not
  // jerk the list about.
  const moveCursor = useCallback(
    (target: string) => {
      setActiveValue(target);
      // The cursor only ever holds a value the registry put there, so the lookup
      // cannot miss — the same assertion the Enter branch below relies on.
      itemsRef.current.get(target)!.element.scrollIntoView({ block: "nearest" });
    },
    [itemsRef],
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
      // The hook is instantiated with `string | null` so that `currentKey` can be
      // null (no cursor yet), which widens `target` to match — but null is only
      // ever a *current* key, never a navigable one: `navigable` is itemValues,
      // which holds strings only. So a navigation target is always a real value.
      moveCursor(target!);
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
          moveCursor(itemValues[0]);
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          moveCursor(itemValues[itemValues.length - 1]);
          return;
        }
      }

      handleArrowKeys(event);
    },
    [dismiss, activeValue, itemValues, handleArrowKeys, moveCursor, select, itemsRef],
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
      dismiss,
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
      dismiss,
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

/**
 * The editable text field. Carries `role="combobox"`, `aria-expanded`,
 * `aria-controls`, `aria-autocomplete="list"` and — once the user asks for a
 * cursor — `aria-activedescendant`, per the ARIA 1.2 combobox pattern.
 *
 * Owns the whole keyboard model: ArrowDown/ArrowUp move the cursor (seeding the
 * first/last item when there is none), Home/End jump to the ends, Enter commits
 * the cursor item, and Escape closes and restores the committed label.
 *
 * @extends HTMLInputElement
 */
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
 * The popup listbox. **Unmounted while closed**, so a closed combobox has no
 * list in the accessibility tree at all — not a hidden one.
 *
 * Rendered as a `popover="auto"` element and promoted with `showPopover()` on
 * open, which buys two things no amount of CSS can: the **top layer**, so nothing
 * on the page can paint over the panel, and the browser's own **light dismiss**,
 * so clicking outside closes it. There is deliberately no hand-rolled
 * pointerdown-outside listener — the browser already does that detection, and it
 * reports the result back as a `toggle` event, which is the only way React hears
 * about a close it did not initiate. Same construction as `Select.Content`.
 *
 * A light dismiss runs the full {@link ComboboxContextValue.dismiss | `dismiss`},
 * not just a close, so clicking away and pressing Escape leave the field in the
 * same state rather than one of them stranding a half-typed query on screen.
 *
 * @extends HTMLDivElement
 */
export function ComboboxContent({
  asChild = false,
  children,
  ref,
  ...rest
}: ComboboxContentProps): ReactElement | null {
  const { open, listboxId, dismiss } = useComboboxContext();
  const localRef = useRef<HTMLDivElement | null>(null);
  // Composed, not overwritten: the popover machinery needs `localRef` to call
  // showPopover() on, so a consumer ref replacing it would silently take out both
  // the top layer and light dismiss.
  const setRef = useMemo(() => composeRefs(localRef, ref), [ref]);

  // Promote into the top layer. Keyed on `open` rather than mount, because this
  // component stays mounted across opens and only its DOM output comes and goes —
  // and because `open` is a boolean, the element can never already be showing
  // when this runs, so showPopover() cannot throw InvalidStateError.
  useEffect(() => {
    if (!open) return;
    localRef.current!.showPopover();
  }, [open]);

  // The browser's report that it closed the popup behind React's back.
  useEffect(() => {
    if (!open) return;
    const element = localRef.current!;
    const handleToggle = (event: Event) => {
      // Only a close is news. A toggle to "open" is this component's own
      // showPopover() echoing back, and acting on it would thrash state.
      if ((event as ToggleEvent).newState === "closed") dismiss();
    };
    element.addEventListener("toggle", handleToggle);
    return () => element.removeEventListener("toggle", handleToggle);
  }, [open, dismiss]);

  if (!open) return null;

  const Content = asChild ? Slot : "div";

  return (
    <Content role="listbox" id={listboxId} popover="auto" {...rest} ref={setRef}>
      {children}
    </Content>
  );
}

// Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
ComboboxContent.displayName = "ComboboxContent";

/**
 * One selectable option in the popup listbox. Renders `role="option"` with
 * `aria-selected`, plus `data-highlighted` while the cursor sits on it.
 *
 * Registers itself with the root so the arrow keys know the DOM order and Enter
 * resolves the same label a click would.
 *
 * @extends HTMLDivElement
 */
export function ComboboxItem({
  asChild = false,
  value: itemValue,
  children,
  onClick,
  ref,
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
  // Composed, not overwritten. Spreading `ref={localRef}` ahead of `{...rest}`
  // would let a consumer ref replace it, registering `element: null` — the same
  // shape of bug that silently disabled Content's whole popover. Harmless today
  // because nothing reads `element` yet, which is precisely why it would have gone
  // unnoticed until the first feature that does (scroll-into-view).
  const setRef = useMemo(() => composeRefs(localRef, ref), [ref]);
  useEffect(() => {
    // Non-null by construction: this effect runs after React has attached the
    // ref, so an item is never registered without its element (see
    // ComboboxItemMeta.element).
    registerItem(itemValue, { element: localRef.current!, label });
    return () => registerItem(itemValue, null);
  }, [itemValue, label, registerItem]);

  const Item = asChild ? Slot : "div";

  return (
    <Item
      role="option"
      id={getItemId(itemValue)}
      aria-selected={selected}
      data-highlighted={highlighted ? "" : undefined}
      onClick={composeEventHandlers(onClick, () => {
        select(itemValue, label);
      })}
      {...rest}
      ref={setRef}
    >
      {children}
    </Item>
  );
}

// Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
ComboboxItem.displayName = "ComboboxItem";

/**
 * The no-results message shown inside the popup while the filtered list is
 * empty. `role="presentation"`, so it is never announced as an option and the
 * cursor has nothing to land on — the panel simply keeps its height while the
 * user carries on typing. Rendering it is your call, since filtering is
 * consumer-owned.
 *
 * @extends HTMLDivElement
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
 * The shape of the exported `Combobox` value — callable as
 * {@link ComboboxRoot | `Combobox.Root`} and carrying its sub-components as
 * static properties.
 */
export type TComboboxCompound = typeof ComboboxRoot & {
  Root: typeof ComboboxRoot;
  Input: typeof ComboboxInput;
  Content: typeof ComboboxContent;
  Item: typeof ComboboxItem;
  Empty: typeof ComboboxEmpty;
};

/**
 * Headless, accessible **Combobox** — an editable text field with a filtered
 * popup listbox, implementing the
 * {@link https://www.w3.org/WAI/ARIA/apg/patterns/combobox/ | WAI-ARIA APG combobox pattern}.
 *
 * `Combobox` is both callable (an alias of {@link ComboboxRoot | `Combobox.Root`})
 * and carries its sub-components as static properties.
 *
 * - {@link ComboboxRoot | `Combobox.Root`} — state owner and context provider.
 * - {@link ComboboxInput | `Combobox.Input`} — the editable field and the whole
 *   keyboard model.
 * - {@link ComboboxContent | `Combobox.Content`} — the popup listbox.
 * - {@link ComboboxItem | `Combobox.Item`} — one selectable option.
 * - {@link ComboboxEmpty | `Combobox.Empty`} — the no-results message.
 *
 * v1 is **single-select with consumer-owned filtering**. Multi-select, async
 * option loading and virtualization are deliberately out of scope.
 *
 * @example Filtering is yours to do
 * ```tsx
 * import { Combobox } from "@primitiv-ui/react";
 *
 * const [query, setQuery] = useState("");
 * const matches = FRAMEWORKS.filter((f) =>
 *   f.label.toLowerCase().includes(query.toLowerCase()),
 * );
 *
 * <Combobox.Root onQueryChange={setQuery} onValueChange={setFramework}>
 *   <Combobox.Input aria-label="Framework" />
 *   <Combobox.Content aria-label="Frameworks">
 *     {matches.map((f) => (
 *       <Combobox.Item key={f.value} value={f.value}>
 *         {f.label}
 *       </Combobox.Item>
 *     ))}
 *     {matches.length === 0 && <Combobox.Empty>No matches</Combobox.Empty>}
 *   </Combobox.Content>
 * </Combobox.Root>;
 * ```
 *
 * @see {@link ComboboxRoot} for the state model and the query/value split.
 * @see {@link ComboboxInput} for the keyboard model and ARIA wiring.
 */
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
