import { useCallback, useId, useMemo, useState } from "react";

import { useCollection, useControllableState } from "../../hooks/index.ts";
import { deriveId } from "../../utils/index.ts";

type UseListboxRootArgs = {
  defaultValue: string | undefined;
  value: string | undefined;
  onValueChange: ((value: string) => void) | undefined;
};

/**
 * Owns the Listbox's selection state and its virtual-focus cursor.
 *
 * Selection is normalised into an array so options only ever ask "am I in
 * the selected set?". The cursor (`activeValue`) is the option
 * `aria-activedescendant` points at — real DOM focus stays on the root, so
 * the cursor is seeded when the root takes focus and cleared when it loses
 * it.
 */
export function useListboxRoot({
  defaultValue,
  value: controlledValue,
  onValueChange,
}: UseListboxRootArgs): {
  selectedValues: string[];
  select: (optionValue: string) => void;
  activeValue: string | undefined;
  registerOption: (optionValue: string, element: HTMLElement | null) => void;
  getOptionId: (optionValue: string) => string;
  seedActiveValue: () => void;
  clearActiveValue: () => void;
} {
  const rootId = useId();
  const [value, setValue] = useControllableState<string>(
    controlledValue,
    defaultValue,
    onValueChange,
  );
  const [activeValue, setActiveValue] = useState<string | undefined>(undefined);
  const { register: registerOption, keys: optionValues } = useCollection<
    string,
    HTMLElement
  >();

  const selectedValues = useMemo(
    () => (value === undefined ? [] : [value]),
    [value],
  );

  const select = useCallback(
    (optionValue: string) => {
      setValue(optionValue);
    },
    [setValue],
  );

  const getOptionId = useCallback(
    (optionValue: string) => deriveId(rootId, "option", optionValue),
    [rootId],
  );

  // APG: when the listbox receives focus, the first selected option takes
  // the cursor; with nothing selected, the first option does.
  const seedActiveValue = useCallback(() => {
    setActiveValue(
      (current) =>
        current ??
        optionValues.find((key) => selectedValues.includes(key)) ??
        optionValues[0],
    );
  }, [optionValues, selectedValues]);

  const clearActiveValue = useCallback(() => setActiveValue(undefined), []);

  return {
    selectedValues,
    select,
    activeValue,
    registerOption,
    getOptionId,
    seedActiveValue,
    clearActiveValue,
  };
}
