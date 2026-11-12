import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactElement } from "react";

import { useCollection, useControllableState } from "../hooks/index.ts";
import { Slot, composeRefs } from "../Slot/index.ts";
import { deriveId } from "../utils/index.ts";

import { ComboboxProvider, useComboboxContext } from "./ComboboxContext";
import { useComboboxRoot } from "./hooks";
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
 * **One behaviour, two surfaces.** The keyboard, typing, choosing by click,
 * the popup's top layer and its light dismiss all run in `@primitiv-ui/web`'s
 * `ComboboxController` — the code `<primitiv-combobox>` runs (RFC 0033 D30) —
 * hosted on this root element, which is why the root always renders one.
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
  ref,
  ...rest
}: ComboboxRootProps): ReactElement {
  const [open, setOpen] = useControllableState(openProp, defaultOpen, onOpenChange);
  const [query, setQuery] = useState("");
  const [value, setValue] = useControllableState(valueProp, defaultValue, onValueChange);
  // The label of the committed value, kept so Escape can put the text back
  // after the user has typed over it (D1: the field never keeps a stale query).
  const [committedLabel, setCommittedLabel] = useState("");
  // The cursor. Null until the user asks for one with an arrow key — an
  // unopened combobox must not imply a pre-made choice.
  const [activeValue, setActiveValue] = useState<string | null>(null);
  // One listbox per combobox, so this is a fixed suffix rather than a
  // `deriveId` per-item id — there is no per-item value to discriminate on.
  const comboboxId = useId();
  const listboxId = `${comboboxId}-listbox`;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const { register: registerItem, keys, itemsRef } = useCollection<string, ComboboxItemMeta>();
  const getItemId = useCallback(
    (itemValue: string) => deriveId(comboboxId, "option", itemValue),
    // Stryker disable next-line ArrayDeclaration: equivalent — useId is stable for the root's lifetime, so the deps never change however they are spelled.
    [comboboxId],
  );

  const rootRef = useComboboxRoot({
    open,
    itemsRef,
    keys,
    inputRef,
    contentRef,
    snapshot: {
      state: () => ({ open, value, active: activeValue ?? undefined }),
      change: setOpen,
      query: (text) => {
        setQuery(text);
        onQueryChange?.(text);
      },
      // D1: committing a choice closes the popup and resets the text FROM THE
      // VALUE, so the field never sits showing a half-typed query that is not
      // the value.
      select: (nextValue, label) => {
        setValue(nextValue);
        setQuery(label);
        setCommittedLabel(label);
        setOpen(false);
      },
      // Emptying the field is a DESELECT: Escape then leaves it empty rather
      // than putting the deleted label straight back.
      clear: () => {
        setValue("");
        setCommittedLabel("");
      },
      dismiss: () => {
        setOpen(false);
        setQuery(committedLabel);
        setActiveValue(null);
      },
      moveCursor: (next) => setActiveValue(next ?? null),
    },
  });
  const setRootRef = useMemo(() => composeRefs(rootRef, ref), [rootRef, ref]);

  const contextValue = useMemo(
    () => ({ open, listboxId, query, value, activeValue, getItemId, registerItem, inputRef, contentRef }),
    [open, listboxId, query, value, activeValue, getItemId, registerItem],
  );

  const Root = asChild ? Slot : "div";

  return (
    <ComboboxProvider value={contextValue}>
      <Root {...rest} ref={setRootRef}>
        {children}
      </Root>
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
 * Owns the whole keyboard model: ArrowDown/ArrowUp open the popup while it is
 * closed, then move the cursor (entering at the first/last item when there is
 * none); Home/End jump to the ends, Enter commits the cursor item, and Escape
 * closes and restores the committed label. A consumer's `onKeyDown` and
 * `onChange` run beside it.
 *
 * @extends HTMLInputElement
 */
export function ComboboxInput({
  asChild = false,
  onChange,
  ref,
  ...rest
}: ComboboxInputProps): ReactElement {
  const { open, listboxId, query, activeValue, getItemId, inputRef } = useComboboxContext();
  const setRef = useMemo(() => composeRefs(inputRef, ref), [inputRef, ref]);

  const Input = asChild ? Slot : "input";

  return (
    <Input
      role="combobox"
      aria-expanded={open}
      aria-controls={listboxId}
      aria-autocomplete="list"
      value={query}
      aria-activedescendant={activeValue === null ? undefined : getItemId(activeValue)}
      // The typing itself is the controller's, which hears the native `input`
      // event; React still needs a handler on a controlled field.
      onChange={onChange ?? noop}
      {...rest}
      ref={setRef}
    />
  );
}

/** The change handler a controlled field needs when the consumer passes none. */
function noop(): void {}

// Stryker disable next-line StringLiteral: equivalent — a DevTools label, asserted by no behaviour.
ComboboxInput.displayName = "ComboboxInput";

/**
 * The popup listbox. **Unmounted while closed**, so a closed combobox has no
 * list in the accessibility tree at all — not a hidden one.
 *
 * Rendered as a `popover="auto"` element and shown with `showPopover()` on
 * open, which buys two things no amount of CSS can: the **top layer**, so nothing
 * on the page can paint over the panel, and the browser's own **light dismiss**,
 * so clicking outside closes it. There is deliberately no hand-rolled
 * pointerdown-outside listener — the browser already does that detection, and it
 * reports the result back as a `toggle` event, which the shared controller hears.
 *
 * A light dismiss runs the full dismissal, not just a close, so clicking away
 * and pressing Escape leave the field in the same state rather than one of them
 * stranding a half-typed query on screen.
 *
 * @extends HTMLDivElement
 */
export function ComboboxContent({
  asChild = false,
  children,
  ref,
  ...rest
}: ComboboxContentProps): ReactElement | null {
  const { open, listboxId, contentRef } = useComboboxContext();
  // Composed, not overwritten: the controller shows the popup through
  // `contentRef`, so a consumer ref replacing it would silently take out both
  // the top layer and light dismiss.
  const setRef = useMemo(() => composeRefs(contentRef, ref), [contentRef, ref]);

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
  ref,
  ...rest
}: ComboboxItemProps): ReactElement {
  const { value, activeValue, getItemId, registerItem } = useComboboxContext();
  const selected = value === itemValue;
  const highlighted = activeValue === itemValue;

  // An item is commonly an icon plus a label, so children are not always a
  // string. There is no reliable way to read a label out of arbitrary JSX, so
  // the value stands in — consumers wanting a nicer closed-state label should
  // pass string children. Registered here so click and Enter agree.
  const label = typeof children === "string" ? children : itemValue;

  const localRef = useRef<HTMLDivElement | null>(null);
  // Composed, not overwritten. Spreading `ref={localRef}` ahead of `{...rest}`
  // would let a consumer ref replace it, registering `element: null` — and the
  // controller clicks, scrolls and orders items through that element.
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
