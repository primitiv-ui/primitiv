import { useCallback, useMemo, useState } from "react";

import { useCollection, useControllableState } from "../../hooks/index.ts";

type ItemMeta = { element: HTMLButtonElement; disabled: boolean };

type UseToggleGroupRootArgs = {
  type: "single" | "multiple";
  defaultValue?: string | string[];
  value?: string | string[] | undefined;
  onValueChange?:
    | ((v: string | undefined) => void)
    | ((v: string[]) => void);
  orientation: "horizontal" | "vertical";
  dir: "ltr" | "rtl";
};

function toArray(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  if (typeof v === "string") return [v];
  return v;
}

export function useToggleGroupRoot({
  type,
  defaultValue,
  value: rawControlled,
  onValueChange,
  orientation,
  dir,
}: UseToggleGroupRootArgs) {
  const isControlled = onValueChange !== undefined;
  const normalizedControlled = isControlled ? toArray(rawControlled) : undefined;
  const normalizedDefault = toArray(defaultValue);

  const [value, setValue] = useControllableState<string[]>(
    normalizedControlled,
    normalizedDefault,
  );

  const toggle = useCallback(
    (itemValue: string) => {
      const isSelected = value.includes(itemValue);
      if (type === "single") {
        const next = isSelected ? [] : [itemValue];
        setValue(next);
        (onValueChange as ((v: string | undefined) => void) | undefined)?.(
          isSelected ? undefined : itemValue,
        );
      } else {
        const next = isSelected
          ? value.filter((v) => v !== itemValue)
          : [...value, itemValue];
        setValue(next);
        (onValueChange as ((v: string[]) => void) | undefined)?.(next);
      }
    },
    [type, value, setValue, onValueChange],
  );

  const {
    register: registerBase,
    itemsRef,
    keys: itemValues,
  } = useCollection<string, ItemMeta>();

  const registerItem = useCallback(
    (itemValue: string, element: HTMLButtonElement | null, disabled = false) => {
      registerBase(itemValue, element ? { element, disabled } : null);
    },
    [registerBase],
  );

  const disabledValues = useMemo(
    () =>
      new Set(
        Array.from(itemsRef.current.entries())
          .filter(([, meta]) => meta.disabled)
          .map(([v]) => v),
      ),
    [itemValues, itemsRef],
  );

  const focusItem = useCallback(
    (itemValue: string) => {
      itemsRef.current.get(itemValue)?.element.focus();
    },
    [itemsRef],
  );

  // Tracks which item holds the tabstop. Initialises to the first pressed
  // value so the selected item is immediately tabbable. Updated via the
  // onFocus handler in each Item so the tabstop follows actual focus.
  const [focusedValue, setFocusedValue] = useState<string | undefined>(
    () => value[0],
  );

  return {
    value,
    toggle,
    registerItem,
    itemValues,
    disabledValues,
    focusItem,
    focusedValue,
    setFocusedValue,
    orientation,
    dir,
  };
}
