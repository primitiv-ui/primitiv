import {
  useCallback,
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
} from "react";

import {
  useCollection,
  useControllableState,
  useRovingTabindex,
} from "../../hooks/index.ts";
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
 * `useRovingTabindex` supplies the keymap only. No `tabIndex` is moved
 * between options: the root is the single tab stop, and navigation just
 * repoints the cursor.
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
  const {
    register: registerBase,
    itemsRef,
    keys: optionValues,
  } = useCollection<string, OptionMeta>();

  const registerOption = useCallback(
    (optionValue: string, element: HTMLElement | null, disabled = false) => {
      registerBase(optionValue, element ? { element, disabled } : null);
    },
    [registerBase],
  );

  // Disabled options stay in the DOM and in the a11y tree, but drop out of
  // every navigable list: cursor movement and focus seeding both skip them.
  const enabledValues = useMemo(
    () => optionValues.filter((key) => !itemsRef.current.get(key)?.disabled),
    [optionValues, itemsRef],
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
    [setSelectedValues, onValueChange],
  );

  // APG: Ctrl+A selects all, or deselects if everything is already selected.
  // Disabled options are not selectable, so they are not part of "all".
  const toggleSelectAll = useCallback(() => {
    const allSelected =
      enabledValues.length > 0 &&
      enabledValues.every((key) => selectedValues.includes(key));
    commitSelection(allSelected ? [] : enabledValues);
  }, [enabledValues, selectedValues, commitSelection]);

  const getOptionId = useCallback(
    (optionValue: string) => deriveId(rootId, "option", optionValue),
    [rootId],
  );

  // APG: when the referenced option is not fully visible, scroll it into view.
  const moveCursor = useCallback(
    (optionValue: string) => {
      setActiveValue(optionValue);
      itemsRef.current
        .get(optionValue)
        ?.element.scrollIntoView({ block: "nearest" });
    },
    [itemsRef],
  );

  // APG: when the listbox receives focus, the first selected option takes
  // the cursor; with nothing selected, the first option does.
  const seedActiveValue = useCallback(() => {
    setActiveValue(
      (current) =>
        current ??
        enabledValues.find((key) => selectedValues.includes(key)) ??
        enabledValues[0],
    );
  }, [enabledValues, selectedValues]);

  const clearActiveValue = useCallback(() => setActiveValue(undefined), []);

  // One navigation path for both the arrow keymap and typeahead, so
  // `selectionFollowsFocus` applies identically to each.
  const navigateTo = useCallback(
    (target: string) => {
      moveCursor(target);
      if (selectionFollowsFocus) select(target);
    },
    [moveCursor, selectionFollowsFocus, select],
  );

  // APG: Shift+Arrow "moves focus and selects" the option it lands on. Unlike
  // the plain arrows this deliberately does not wrap — extending a range off
  // the end and round to the top would select options never travelled past.
  const extendSelection = useCallback(
    (direction: "next" | "prev") => {
      const currentIndex =
        activeValue === undefined ? -1 : enabledValues.indexOf(activeValue);
      if (currentIndex === -1) return;

      const targetIndex =
        direction === "next" ? currentIndex + 1 : currentIndex - 1;
      if (targetIndex < 0 || targetIndex >= enabledValues.length) return;

      const target = enabledValues[targetIndex];
      moveCursor(target);
      if (!selectedValues.includes(target)) {
        commitSelection([...selectedValues, target]);
      }
    },
    [activeValue, enabledValues, moveCursor, selectedValues, commitSelection],
  );

  const { handleKeyDown: handleRovingKeyDown } = useRovingTabindex<string>({
    orientation,
    dir,
    navigable: enabledValues,
    currentKey: activeValue ?? "",
    includeHomeEnd: true,
    includeActivate: true,
    onNavigate: (target, action) => {
      if (action === "activate") {
        select(target);
        return;
      }
      navigateTo(target);
    },
  });

  // `optionValue` is always drawn from `navigable` (the enabled subset of the
  // registered keys), and useCollection writes `itemsRef` and the keys state
  // together — so the entry, and an element with textContent, always exist.
  const getLabel = useCallback(
    (optionValue: string) => itemsRef.current.get(optionValue)!.element.textContent!,
    [itemsRef],
  );

  const { handleTypeahead } = useListboxTypeahead({
    navigable: enabledValues,
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

      handleRovingKeyDown(event);
      if (event.defaultPrevented) return;
      handleTypeahead(event);
    },
    [
      type,
      orientation,
      dir,
      toggleSelectAll,
      extendSelection,
      handleRovingKeyDown,
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
