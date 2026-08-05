import { useCallback, useMemo } from "react";

import { useControllableState } from "../../hooks/index.ts";

type UseListboxRootArgs = {
  defaultValue: string | undefined;
  value: string | undefined;
  onValueChange: ((value: string) => void) | undefined;
};

/**
 * Owns the Listbox's selection state. Normalises the single-selection
 * `value` into the array shape the context exposes, so options only ever
 * ask "am I in the selected set?".
 */
export function useListboxRoot({
  defaultValue,
  value: controlledValue,
  onValueChange,
}: UseListboxRootArgs): {
  selectedValues: string[];
  select: (optionValue: string) => void;
} {
  const [value, setValue] = useControllableState<string>(
    controlledValue,
    defaultValue,
    onValueChange,
  );

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

  return { selectedValues, select };
}
