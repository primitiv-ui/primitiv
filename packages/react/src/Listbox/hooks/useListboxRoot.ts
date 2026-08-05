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
import { deriveId } from "../../utils/index.ts";

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

  const { handleKeyDown } = useRovingTabindex<string>({
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
      moveCursor(target);
      if (selectionFollowsFocus) select(target);
    },
  });

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
