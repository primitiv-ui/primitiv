import { useEffect, useMemo, useRef, type ReactElement } from "react";

import { useDirection } from "../DirectionProvider/index.ts";
import { Slot, composeEventHandlers, composeRefs } from "../Slot/index.ts";

import { ListboxProvider, useListboxContext } from "./ListboxContext";
import { useListboxRoot } from "./hooks/index.ts";
import type {
  ListboxGroupProps,
  ListboxOptionProps,
  ListboxRootProps,
} from "./types";

/**
 * The root of a Listbox — a `<div role="listbox">` that owns the selection,
 * holds the single tab stop, and provides {@link ListboxContext} to its
 * descendant {@link ListboxOption | `Listbox.Option`}s.
 *
 * **Virtual focus, not roving tabindex.** This is the distinguishing choice.
 * Real DOM focus stays on the root; the visually-focused option is published
 * as `aria-activedescendant` and marked `data-highlighted`. Options are never
 * given a `tabIndex` and are never `focus()`ed. That is what lets a text input
 * elsewhere keep DOM focus while driving this list — the combobox / command
 * palette case — which a roving tabstop cannot do. Per APG, the cursor is
 * seeded when the root takes focus (onto the first selected option, or the
 * first enabled one) and the active option is scrolled into view as it moves.
 *
 * Two type modes, statically discriminated at the type level:
 *
 * - **`type="single"`** — at most one option selected. Re-selecting the current
 *   option is a no-op, not a deselect. Controlled via `value: string` +
 *   `onValueChange: (value: string) => void`.
 * - **`type="multiple"`** — options toggle independently, and the root carries
 *   `aria-multiselectable`. Controlled via `value: string[]` +
 *   `onValueChange: (value: string[]) => void`.
 *
 * Each mode supports **uncontrolled** (`defaultValue`, or omit for an empty
 * selection) and **controlled** (`value` + `onValueChange`) shapes.
 *
 * **Keyboard.** Arrow keys move the cursor along the
 * {@link ListboxRootBaseProps.orientation | orientation} axis, wrapping at
 * both ends; Home/End jump to the first/last option; Enter and Space select
 * (single) or toggle (multiple) the cursor option; printable characters run a
 * prefix typeahead. Selection is manual by default — set
 * {@link ListboxRootBaseProps.selectionFollowsFocus | `selectionFollowsFocus`}
 * for the APG example's select-as-you-arrow behaviour.
 *
 * **ARIA.** `role="listbox"` on the root, plus `aria-activedescendant`,
 * `aria-multiselectable` (multiple mode only) and `aria-orientation`
 * (horizontal only — vertical is the ARIA default). The root needs an
 * accessible name: pass `aria-label` or `aria-labelledby`.
 *
 * **Styling hooks.** `data-orientation="horizontal" | "vertical"` on the root.
 *
 * @extends HTMLDivElement
 *
 * @example Single selection
 * ```tsx
 * <Listbox.Root type="single" defaultValue="apple" aria-label="Fruit">
 *   <Listbox.Option value="apple">Apple</Listbox.Option>
 *   <Listbox.Option value="banana">Banana</Listbox.Option>
 * </Listbox.Root>
 * ```
 *
 * @example Multiple selection, controlled
 * ```tsx
 * const [value, setValue] = useState<string[]>([]);
 *
 * <Listbox.Root type="multiple" value={value} onValueChange={setValue} aria-label="Toppings">
 *   <Listbox.Option value="cheese">Cheese</Listbox.Option>
 *   <Listbox.Option value="olives">Olives</Listbox.Option>
 * </Listbox.Root>
 * ```
 *
 * @example As a semantic list
 * ```tsx
 * <Listbox.Root type="single" asChild aria-label="Fruit">
 *   <ul>
 *     <Listbox.Option value="apple" asChild>
 *       <li>Apple</li>
 *     </Listbox.Option>
 *   </ul>
 * </Listbox.Root>
 * ```
 */
export function ListboxRoot({
  type,
  defaultValue,
  value: controlledValue,
  onValueChange,
  selectionFollowsFocus = false,
  orientation = "vertical",
  dir,
  asChild = false,
  onFocus,
  onBlur,
  onKeyDown,
  children,
  ref,
  ...rest
}: ListboxRootProps): ReactElement {
  const resolvedDir = dir ?? useDirection();
  const {
    selectedValues,
    select,
    activeValue,
    registerOption,
    getOptionId,
    seedActiveValue,
    clearActiveValue,
    handleKeyDown,
  } = useListboxRoot({
    type,
    defaultValue,
    value: controlledValue,
    onValueChange,
    selectionFollowsFocus,
    orientation,
    dir: resolvedDir,
  });

  const contextValue = useMemo(
    () => ({ selectedValues, select, activeValue, registerOption, getOptionId }),
    [selectedValues, select, activeValue, registerOption, getOptionId],
  );

  const rootProps = {
    ...rest,
    ref,
    role: "listbox" as const,
    tabIndex: 0,
    "aria-multiselectable": type === "multiple" ? true : undefined,
    "aria-orientation":
      orientation === "horizontal" ? ("horizontal" as const) : undefined,
    "data-orientation": orientation,
    "aria-activedescendant":
      activeValue === undefined ? undefined : getOptionId(activeValue),
    onFocus: composeEventHandlers(onFocus, seedActiveValue),
    onBlur: composeEventHandlers(onBlur, clearActiveValue),
    onKeyDown: composeEventHandlers(onKeyDown, handleKeyDown),
  };

  return (
    <ListboxProvider value={contextValue}>
      {asChild ? (
        <Slot {...rootProps}>{children}</Slot>
      ) : (
        <div {...rootProps}>{children}</div>
      )}
    </ListboxProvider>
  );
}

/** @internal */
// Stryker disable next-line StringLiteral: overwritten by the compound alias — an equivalent mutant.
ListboxRoot.displayName = "ListboxRoot";

/**
 * A single choice inside a Listbox — a `<div role="option">` reporting its own
 * selected and highlighted state.
 *
 * **No tab stop, no DOM focus.** The option is never focusable; the root owns
 * focus and points at this element with `aria-activedescendant` when the
 * cursor reaches it. Style the cursor from `data-highlighted`, not `:focus`.
 *
 * **Selection.** Clicking an option selects it (single) or toggles it
 * (multiple), as does Enter / Space while the cursor is on it.
 *
 * **Disabled.** `disabled` sets `aria-disabled` and removes the option from
 * cursor navigation, focus seeding, and typeahead — it stays in the
 * accessibility tree and in the DOM. This is a house extension: APG's listbox
 * pattern does not itself specify disabled options.
 *
 * **Typeahead matching** reads the option's rendered text, so keep the label
 * in `children`.
 *
 * **Styling hooks.** `data-highlighted=""` when the cursor is on it,
 * `data-disabled=""` when disabled. Selection is read from `aria-selected`.
 *
 * @throws if rendered outside a `Listbox.Root`.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <Listbox.Option value="apple">Apple</Listbox.Option>
 * <Listbox.Option value="durian" disabled>Durian (out of stock)</Listbox.Option>
 * ```
 */
export function ListboxOption({
  value,
  disabled = false,
  asChild = false,
  onClick,
  children,
  ref,
  ...rest
}: ListboxOptionProps): ReactElement {
  const { selectedValues, select, activeValue, registerOption, getOptionId } =
    useListboxContext();
  const selected = selectedValues.includes(value);

  const localRef = useRef<HTMLDivElement | null>(null);
  const setRef = useMemo(() => composeRefs(localRef, ref), [ref]);

  useEffect(() => {
    registerOption(value, localRef.current, disabled);
    return () => registerOption(value, null);
  }, [value, disabled, registerOption]);

  const optionProps = {
    ...rest,
    ref: setRef,
    id: getOptionId(value),
    role: "option" as const,
    "aria-selected": selected,
    "aria-disabled": disabled || undefined,
    "data-disabled": disabled ? "" : undefined,
    "data-highlighted": activeValue === value ? "" : undefined,
    onClick: composeEventHandlers(onClick, () => {
      if (disabled) return;
      select(value);
    }),
  };

  return asChild ? (
    <Slot {...optionProps}>{children}</Slot>
  ) : (
    <div {...optionProps}>{children}</div>
  );
}

/** @internal */
ListboxOption.displayName = "ListboxOption";

/**
 * A titled cluster of options — a `<div role="group">` carrying the accessible
 * name APG requires on every option group.
 *
 * Grouping is presentational only: the cursor still walks every option in DOM
 * order, crossing group boundaries without stopping, and typeahead searches
 * the whole list.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <Listbox.Root type="single" aria-label="Fruit">
 *   <Listbox.Group label="Citrus">
 *     <Listbox.Option value="lemon">Lemon</Listbox.Option>
 *   </Listbox.Group>
 *   <Listbox.Group label="Berries">
 *     <Listbox.Option value="fig">Fig</Listbox.Option>
 *   </Listbox.Group>
 * </Listbox.Root>
 * ```
 */
export function ListboxGroup({
  label,
  asChild = false,
  children,
  ref,
  ...rest
}: ListboxGroupProps): ReactElement {
  const groupProps = {
    ...rest,
    ref,
    role: "group" as const,
    "aria-label": label,
  };

  return asChild ? (
    <Slot {...groupProps}>{children}</Slot>
  ) : (
    <div {...groupProps}>{children}</div>
  );
}

/** @internal */
ListboxGroup.displayName = "ListboxGroup";

/**
 * The shape of the exported `Listbox` value — callable as `Listbox.Root` and
 * carrying `Root`, `Option` and `Group` as static properties.
 */
export type TListboxCompound = typeof ListboxRoot & {
  Root: typeof ListboxRoot;
  Option: typeof ListboxOption;
  Group: typeof ListboxGroup;
};

/**
 * Headless, accessible **Listbox** — a persistently-visible list of options
 * implementing the WAI-ARIA APG listbox pattern with a virtual-focus cursor.
 *
 * Unlike `Select`, nothing here opens or closes: there is no trigger and no
 * popup layer. And unlike every roving-tabindex collection in this library,
 * DOM focus never moves to an option — the root keeps it and publishes
 * `aria-activedescendant`, so an external control (a search input, a command
 * palette) can hold focus and drive the list.
 *
 * `Listbox` is both callable (an alias of {@link ListboxRoot | `Listbox.Root`})
 * and carries its sub-components as static properties.
 *
 * - {@link ListboxRoot | `Listbox.Root`} — state owner, context provider, tab
 *   stop, `<div role="listbox">` wrapper.
 * - {@link ListboxOption | `Listbox.Option`} — one selectable choice.
 * - {@link ListboxGroup | `Listbox.Group`} — a named cluster of options.
 *
 * @example
 * ```tsx
 * import { Listbox } from "@primitiv-ui/react";
 *
 * <Listbox.Root type="single" defaultValue="apple" aria-label="Fruit">
 *   <Listbox.Option value="apple">Apple</Listbox.Option>
 *   <Listbox.Option value="banana">Banana</Listbox.Option>
 * </Listbox.Root>;
 * ```
 *
 * @see {@link ListboxRoot} for selection modes, keyboard, and ARIA.
 * @see {@link ListboxOption} for per-option state and disabling.
 * @see {@link ListboxGroup} for grouping.
 */
const ListboxCompound: TListboxCompound = Object.assign(ListboxRoot, {
  Root: ListboxRoot,
  Option: ListboxOption,
  Group: ListboxGroup,
});

ListboxCompound.displayName = "Listbox";

export { ListboxCompound as Listbox };
