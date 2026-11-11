import { useCallback, useMemo } from "react";

import { SegmentedControlController } from "@primitiv-ui/web";

import { useCollection, useControllableState, useHostedController } from "../../hooks/index.ts";

type UseSegmentedControlRootArgs = {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation: "horizontal" | "vertical";
  dir: "ltr" | "rtl";
  disabled: boolean;
};

type ItemMeta = {
  element: HTMLButtonElement;
  disabled: boolean;
};

export function useSegmentedControlRoot({
  defaultValue,
  value: controlledValue,
  onValueChange,
  orientation,
  dir,
  disabled,
}: UseSegmentedControlRootArgs) {
  const [value, setValue] = useControllableState<string>(controlledValue, defaultValue, onValueChange);

  // Track registered item metadata in a ref and their ordered values as state —
  // required for the roving-tabindex home base. Disabled values are derived per
  // render from itemsRef; any change that affects the set (mount, unmount,
  // disabled toggle) re-runs the registrar effect, which updates the keys state
  // and forces the recompute.
  const { register: registerItemBase, itemsRef, keys: itemValues } = useCollection<string, ItemMeta>();

  const registerItem = useCallback(
    (itemValue: string, element: HTMLButtonElement | null, itemDisabled = false) => {
      registerItemBase(itemValue, element ? { element, disabled: itemDisabled } : null);
    },
    // `registerItemBase` is a stable useCollection callback (its own deps never
    // change), so emptying this array yields the identical memoised function.
    // Stryker disable next-line ArrayDeclaration: equivalent — stable dependency.
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

  // The clicks and keys run in the shared SegmentedControlController
  // (@primitiv-ui/web, RFC 0033 D30); React keeps the state and answers it.
  const rootRef = useHostedController(
    { value, orientation, dir, disabled, setValue },
    (root, latest) =>
      new SegmentedControlController(root, {
        state: () => {
          const { value, orientation, dir, disabled } = latest();
          return { selected: value, disabled, orientation, dir };
        },
        change: (next) => latest().setValue(next),
      }),
    { itemsRef, keys: itemValues },
  );

  return { rootRef, value, registerItem, itemValues, disabledValues };
}
