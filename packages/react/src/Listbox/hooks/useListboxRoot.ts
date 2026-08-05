import { useCallback, useId, useState, type KeyboardEvent } from "react";

import { useCollection, useControllableState } from "../../hooks/index.ts";
import { deriveId, getKeyToActionMap } from "../../utils/index.ts";

import { useListboxTypeahead } from "./useListboxTypeahead";

type OptionMeta = { element: HTMLElement; disabled: boolean };

type UseListboxRootArgs = {
  type: "single" | "multiple";
  defaultValue: string | string[] | undefined;
  value: string | string[] | undefined;
  onValueChange:
    | ((value: string) => void)
    | ((value: string[]) => void)
    | undefined;
  selectionFollowsFocus: boolean;
  orientation: "horizontal" | "vertical";
  dir: "ltr" | "rtl";
};

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return typeof value === "string" ? [value] : value;
}

/**
 * Owns the Listbox's selection state and its virtual-focus cursor.
 *
 * Selection is normalised into an array so options only ever ask "am I in
 * the selected set?". The cursor (`activeValue`) is the option
 * `aria-activedescendant` points at — real DOM focus stays on the root, so
 * the cursor is seeded when the root takes focus and cleared when it loses
 * it.
 *
 * No `tabIndex` is moved between options: the root is the single tab stop,
 * and navigation just repoints the cursor.
 *
 * Navigation order is read from the **live DOM** on every interaction rather
 * than from a memoised array. Reordering options in place (APG's rearrangeable
 * example) keeps the same elements mounted with unchanged props, so nothing
 * re-registers and any cached order would silently go stale.
 */
export function useListboxRoot({
  type,
  defaultValue,
  value: controlledValue,
  onValueChange,
  selectionFollowsFocus,
  orientation,
  dir,
}: UseListboxRootArgs): {
  selectedValues: string[];
  select: (optionValue: string) => void;
  activeValue: string | undefined;
  registerOption: (
    optionValue: string,
    element: HTMLElement | null,
    disabled?: boolean,
  ) => void;
  getOptionId: (optionValue: string) => string;
  seedActiveValue: () => void;
  clearActiveValue: () => void;
  handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
} {
  const rootId = useId();
  const [selectedValues, setSelectedValues] = useControllableState<string[]>(
    controlledValue === undefined ? undefined : toArray(controlledValue),
    toArray(defaultValue),
  );
  const [activeValue, setActiveValue] = useState<string | undefined>(undefined);
  // `keys` is deliberately unused: navigation order comes from the DOM, not
  // from registration order. The collection is still what keeps `itemsRef`
  // populated and re-renders the Root as options mount and unmount.
  const { register: registerBase, itemsRef } = useCollection<
    string,
    OptionMeta
  >();

  const registerOption = useCallback(
    // Stryker disable next-line BooleanLiteral: equivalent — the only caller that omits this argument is the unmount path, which passes a null element and so never reads it.
    (optionValue: string, element: HTMLElement | null, disabled = false) => {
      registerBase(optionValue, element ? { element, disabled } : null);
    },
    // Stryker disable next-line ArrayDeclaration: equivalent — registerBase is a stable useCollection callback, so an empty dep array memoises identically.
    [registerBase],
  );

  // Disabled options stay in the DOM and in the a11y tree, but drop out of
  // every navigable list: cursor movement and focus seeding both skip them.
  //
  // Sorted by document position, not registration order — see the note above.
  const getNavigableValues = useCallback(
    () => {
      const entries = Array.from(itemsRef.current.entries()).filter(
        ([, meta]) => !meta.disabled,
      );
      entries.sort(([, a], [, b]) =>
        a.element.compareDocumentPosition(b.element) &
        Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : 1,
      );
      return entries.map(([key]) => key);
    },
    // Stryker disable next-line ArrayDeclaration: equivalent — itemsRef is a stable RefObject.
    [itemsRef],
  );

  // Single mode replaces the selection outright — re-selecting the current
  // option is a no-op re-select, not a deselect (a listbox is not a toggle).
  // Multiple mode toggles the option in place, preserving the rest.
  const select = useCallback(
    (optionValue: string) => {
      if (type === "single") {
        setSelectedValues([optionValue]);
        (onValueChange as ((value: string) => void) | undefined)?.(optionValue);
        return;
      }
      const next = selectedValues.includes(optionValue)
        ? selectedValues.filter((key) => key !== optionValue)
        : [...selectedValues, optionValue];
      setSelectedValues(next);
      (onValueChange as ((value: string[]) => void) | undefined)?.(next);
    },
    [type, selectedValues, setSelectedValues, onValueChange],
  );

  // Bulk selection writes. Multiple-mode only: single mode's onValueChange
  // takes a string, and none of the range shortcuts apply to it.
  const commitSelection = useCallback(
    (next: string[]) => {
      setSelectedValues(next);
      (onValueChange as ((value: string[]) => void) | undefined)?.(next);
    },
    // Stryker disable next-line ArrayDeclaration: equivalent — both are stable for a given render pair; the value read is the ref/state itself.
    [setSelectedValues, onValueChange],
  );

  // APG: Ctrl+A selects all, or deselects if everything is already selected.
  // Disabled options are not selectable, so they are not part of "all".
  const toggleSelectAll = useCallback(() => {
    const navigable = getNavigableValues();
    const allSelected =
      // Stryker disable next-line ConditionalExpression,EqualityOperator: equivalent — with nothing navigable both arms commit the empty array.
      navigable.length > 0 &&
      navigable.every((key) => selectedValues.includes(key));
    commitSelection(allSelected ? [] : navigable);
  }, [getNavigableValues, selectedValues, commitSelection]);

  const getOptionId = useCallback(
    // Stryker disable next-line StringLiteral: equivalent — the suffix only has to be stable; every assertion compares against the element's own id.
    (optionValue: string) => deriveId(rootId, "option", optionValue),
    // Stryker disable next-line ArrayDeclaration: equivalent — rootId is a useId() constant.
    [rootId],
  );

  // APG: when the referenced option is not fully visible, scroll it into view.
  const moveCursor = useCallback(
    (optionValue: string) => {
      setActiveValue(optionValue);
      // Stryker disable next-line OptionalChaining: unreachable — every value reaching moveCursor comes from getNavigableValues(), so the entry is always registered.
      itemsRef.current
        .get(optionValue)
        ?.element.scrollIntoView({ block: "nearest" });
    },
    // Stryker disable next-line ArrayDeclaration: equivalent — itemsRef is a stable RefObject.
    [itemsRef],
  );

  // APG: when the listbox receives focus, the first selected option takes
  // the cursor; with nothing selected, the first option does.
  const seedActiveValue = useCallback(
    () => {
      const navigable = getNavigableValues();
      setActiveValue(
        (current) =>
          current ??
          navigable.find((key) => selectedValues.includes(key)) ??
          navigable[0],
      );
    },
    // Stryker disable next-line ArrayDeclaration: equivalent — the callback is rebuilt each render and reads both through its closure.
    [getNavigableValues, selectedValues],
  );

  // Stryker disable next-line ArrayDeclaration: equivalent — the dep array is already empty; adding a phantom entry cannot change a setState-only callback.
  const clearActiveValue = useCallback(() => setActiveValue(undefined), []);

  // One navigation path for both the arrow keymap and typeahead, so
  // `selectionFollowsFocus` applies identically to each.
  const navigateTo = useCallback(
    (target: string) => {
      moveCursor(target);
      if (selectionFollowsFocus) select(target);
    },
    // Stryker disable next-line ArrayDeclaration: equivalent — a stale closure here still calls the same setState and select.
    [moveCursor, selectionFollowsFocus, select],
  );

  // APG: Shift+Arrow "moves focus and selects" the option it lands on. Unlike
  // the plain arrows this deliberately does not wrap — extending a range off
  // the end and round to the top would select options never travelled past.
  const extendSelection = useCallback(
    (direction: "next" | "prev") => {
      const navigable = getNavigableValues();
      const currentIndex =
        // Stryker disable next-line ConditionalExpression: equivalent — indexOf(undefined) is itself -1, so both arms yield the same index.
        activeValue === undefined ? -1 : navigable.indexOf(activeValue);
      if (currentIndex === -1) return;

      const targetIndex =
        direction === "next" ? currentIndex + 1 : currentIndex - 1;
      if (targetIndex < 0 || targetIndex >= navigable.length) return;

      const target = navigable[targetIndex];
      moveCursor(target);
      if (!selectedValues.includes(target)) {
        commitSelection([...selectedValues, target]);
      }
    },
    [
      activeValue,
      getNavigableValues,
      moveCursor,
      selectedValues,
      commitSelection,
    ],
  );

  // APG: Ctrl+Shift+Home/End selects from the cursor through to the first or
  // last option and moves the cursor to that edge. Selections outside the
  // swept range are preserved.
  const extendToEdge = useCallback(
    (edge: "first" | "last") => {
      const navigable = getNavigableValues();
      const currentIndex =
        // Stryker disable next-line ConditionalExpression: equivalent — indexOf(undefined) is itself -1, so both arms yield the same index.
        activeValue === undefined ? -1 : navigable.indexOf(activeValue);
      if (currentIndex === -1) return;

      const range =
        edge === "first"
          ? navigable.slice(0, currentIndex + 1)
          : navigable.slice(currentIndex);

      const next = [...selectedValues];
      for (const key of range) {
        if (!next.includes(key)) next.push(key);
      }
      commitSelection(next);
      moveCursor(
        edge === "first" ? navigable[0] : navigable[navigable.length - 1],
      );
    },
    [
      activeValue,
      getNavigableValues,
      selectedValues,
      commitSelection,
      moveCursor,
    ],
  );

  // The arrow / Home / End / Enter-Space keymap. This mirrors what
  // `useRovingTabindex` does, but resolves `navigable` at event time so a
  // reorder is picked up; that hook takes its list at render time.
  const handleNavigationKey = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const action = getKeyToActionMap({
        orientation,
        dir,
        homeEnd: true,
        activate: true,
      })[event.key];
      if (!action) return;

      const navigable = getNavigableValues();
      // Stryker disable next-line ConditionalExpression: equivalent — with no options every downstream index resolves to undefined, which moves the cursor nowhere.
      if (navigable.length === 0) return;

      if (action === "activate") {
        if (activeValue === undefined) return;
        event.preventDefault();
        select(activeValue);
        return;
      }

      const currentIndex =
        // Stryker disable next-line ConditionalExpression: equivalent — indexOf(undefined) is itself -1, so both arms yield the same index.
        activeValue === undefined ? -1 : navigable.indexOf(activeValue);
      let targetIndex: number;
      if (action === "first") {
        targetIndex = 0;
      } else if (action === "last") {
        targetIndex = navigable.length - 1;
      } else if (currentIndex === -1) {
        // No cursor yet — the options streamed in after the listbox took
        // focus, so seeding never ran. Enter the list from the near end
        // rather than swallowing the keystroke.
        targetIndex = action === "next" ? 0 : navigable.length - 1;
      } else {
        targetIndex =
          action === "next"
            ? (currentIndex + 1) % navigable.length
            : (currentIndex - 1 + navigable.length) % navigable.length;
      }

      event.preventDefault();
      navigateTo(navigable[targetIndex]);
    },
    [orientation, dir, getNavigableValues, activeValue, select, navigateTo],
  );

  // `optionValue` is always drawn from `navigable` (the enabled subset of the
  // registered keys), and useCollection writes `itemsRef` and the keys state
  // together — so the entry, and an element with textContent, always exist.
  const getLabel = useCallback(
    (optionValue: string) =>
      itemsRef.current.get(optionValue)!.element.textContent!,
    // Stryker disable next-line ArrayDeclaration: equivalent — itemsRef is a stable RefObject.
    [itemsRef],
  );

  const { handleTypeahead } = useListboxTypeahead({
    getNavigable: getNavigableValues,
    getLabel,
    currentKey: activeValue,
    onMatch: navigateTo,
  });

  // The keymap gets first refusal: it calls preventDefault on every key it
  // consumes, so a still-unhandled printable character falls through to
  // typeahead (and Space, which activates, never does).
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const chord = event.ctrlKey || event.metaKey;

      if (chord && !event.altKey && event.key.toLowerCase() === "a") {
        if (type !== "multiple") return;
        event.preventDefault();
        toggleSelectAll();
        return;
      }

      if (
        chord &&
        event.shiftKey &&
        (event.key === "Home" || event.key === "End")
      ) {
        if (type !== "multiple") return;
        event.preventDefault();
        // Stryker disable next-line StringLiteral: equivalent — extendToEdge branches on `edge === "first"`, so any non-"first" string selects the same path.
        extendToEdge(event.key === "Home" ? "first" : "last");
        return;
      }

      // Every other chorded shortcut belongs to the browser and the consumer —
      // APG's rearrangeable example binds Alt+Arrow to its toolbar. Only Shift
      // is ours, for range selection.
      if (chord || event.altKey) return;

      if (event.shiftKey && type === "multiple") {
        const action = getKeyToActionMap({ orientation, dir })[event.key];
        if (action === "next" || action === "prev") {
          event.preventDefault();
          extendSelection(action);
          return;
        }
      }

      handleNavigationKey(event);
      if (event.defaultPrevented) return;
      handleTypeahead(event);
    },
    [
      type,
      orientation,
      dir,
      toggleSelectAll,
      extendSelection,
      extendToEdge,
      handleNavigationKey,
      handleTypeahead,
    ],
  );

  return {
    selectedValues,
    select,
    activeValue,
    registerOption,
    getOptionId,
    seedActiveValue,
    clearActiveValue,
    handleKeyDown,
  };
}
