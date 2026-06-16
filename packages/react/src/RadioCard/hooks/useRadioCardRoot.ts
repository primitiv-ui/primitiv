import { useCallback, useMemo } from "react";

import { useCollection, useControllableState } from "../../hooks/index.ts";

type UseRadioCardRootArgs = {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
};

type ItemMeta = {
  element: HTMLButtonElement;
  disabled: boolean;
};

export function useRadioCardRoot({
  defaultValue,
  value: controlledValue,
  onValueChange,
}: UseRadioCardRootArgs) {
  const [value, setValue] = useControllableState<string>(
    controlledValue,
    defaultValue,
    onValueChange,
  );

  const select = useCallback(
    (next: string) => {
      if (value === next) return;
      setValue(next);
    },
    [value, setValue],
  );

  const {
    register: registerItemBase,
    itemsRef,
    keys: itemValues,
  } = useCollection<string, ItemMeta>();

  const registerItem = useCallback(
    (
      itemValue: string,
      element: HTMLButtonElement | null,
      disabled = false,
    ) => {
      registerItemBase(itemValue, element ? { element, disabled } : null);
    },
    [registerItemBase],
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

  return {
    value,
    select,
    registerItem,
    itemValues,
    disabledValues,
    focusItem,
  };
}
