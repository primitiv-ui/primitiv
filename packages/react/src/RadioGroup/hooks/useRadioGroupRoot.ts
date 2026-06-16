import { useCallback, useMemo } from "react";

import { useCollection, useControllableState } from "../../hooks/index.ts";

type UseRadioGroupRootArgs = {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
};

type ItemMeta = {
  element: HTMLButtonElement;
  disabled: boolean;
};

export function useRadioGroupRoot({
  defaultValue,
  value: controlledValue,
  onValueChange,
}: UseRadioGroupRootArgs) {
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

  // Track registered item metadata in a ref (for focus handling) and
  // their ordered values as state — required for the roving-tabindex
  // home base. Disabled values are derived per render from itemsRef:
  // any change that affects the set (mount, unmount, disabled toggle)
  // already re-runs the registrar effect, which updates the keys state
  // and forces the re-render that recomputes the memo.
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
    // itemValues is a fresh array on every register call (new identity even
    // when the keys are the same), so the memo re-runs whenever any item
    // mounts, unmounts, or toggles disabled — which is exactly the trigger
    // we want for re-deriving disabledValues.
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
