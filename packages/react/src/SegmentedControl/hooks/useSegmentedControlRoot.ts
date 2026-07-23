import { useCallback, useMemo } from "react";

import { useCollection, useControllableState } from "../../hooks/index.ts";

type UseSegmentedControlRootArgs = {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
};

type ItemMeta = {
  element: HTMLButtonElement;
  disabled: boolean;
};

export function useSegmentedControlRoot({
  defaultValue,
  value: controlledValue,
  onValueChange,
}: UseSegmentedControlRootArgs) {
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

  // Track registered item metadata in a ref (for focus handling) and their
  // ordered values as state — required for the roving-tabindex home base.
  // Disabled values are derived per render from itemsRef; any change that
  // affects the set (mount, unmount, disabled toggle) re-runs the registrar
  // effect, which updates the keys state and forces the recompute.
  const {
    register: registerItemBase,
    itemsRef,
    keys: itemValues,
  } = useCollection<string, ItemMeta>();

  const registerItem = useCallback(
    (itemValue: string, element: HTMLButtonElement | null, disabled = false) => {
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
    // when the keys are unchanged), so the memo re-runs whenever any item
    // mounts, unmounts, or toggles disabled — exactly the trigger we want.
    [itemValues, itemsRef],
  );

  const focusItem = useCallback(
    (itemValue: string) => {
      // `itemValue` is always sourced from `navigable` (the enabled subset of
      // `itemValues`), and useCollection's register() writes `itemsRef` and
      // the `itemValues` state together — so a value that appears here is
      // guaranteed to already have a live entry in the map.
      // Stryker disable next-line OptionalChaining: unreachable given that invariant.
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
