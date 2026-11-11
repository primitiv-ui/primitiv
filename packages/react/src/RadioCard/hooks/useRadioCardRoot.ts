import { useCallback, useMemo } from "react";

import { RadioCardController } from "@primitiv-ui/web";

import { useCollection, useControllableState, useHostedController } from "../../hooks/index.ts";
import type { RadioCardOrientation, RadioCardReadingDirection } from "../types";

type UseRadioCardRootArgs = {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation: RadioCardOrientation;
  dir: RadioCardReadingDirection;
};

type ItemMeta = {
  element: HTMLButtonElement;
  disabled: boolean;
};

export function useRadioCardRoot({
  defaultValue,
  value: controlledValue,
  onValueChange,
  orientation,
  dir,
}: UseRadioCardRootArgs) {
  const [value, setValue] = useControllableState<string>(controlledValue, defaultValue, onValueChange);

  const { register: registerItemBase, itemsRef, keys: itemValues } = useCollection<string, ItemMeta>();

  const registerItem = useCallback(
    (itemValue: string, element: HTMLButtonElement | null, disabled = false) => {
      registerItemBase(itemValue, element ? { element, disabled } : null);
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
    [itemValues, itemsRef],
  );

  // The clicks and keys run in the shared RadioCardController
  // (@primitiv-ui/web, RFC 0033 D30); React keeps the state and answers it.
  const rootRef = useHostedController(
    { value, orientation, dir, setValue },
    (root, latest) =>
      new RadioCardController(root, {
        state: () => {
          const { value, orientation, dir } = latest();
          return { selected: value, orientation, dir };
        },
        change: (next) => latest().setValue(next),
      }),
    { itemsRef, keys: itemValues },
  );

  return { rootRef, value, registerItem, itemValues, disabledValues };
}
