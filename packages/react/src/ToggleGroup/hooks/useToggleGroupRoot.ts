import { useCallback, useMemo, useState } from "react";

import { ToggleGroupController } from "@primitiv-ui/web";

import { useCollection, useControllableState, useHostedController } from "../../hooks/index.ts";

type ItemMeta = { element: HTMLButtonElement; disabled: boolean };

type UseToggleGroupRootArgs = {
  type: "single" | "multiple";
  defaultValue?: string | string[];
  value?: string | string[] | undefined;
  onValueChange?: ((v: string | undefined) => void) | ((v: string[]) => void);
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

  const [value, setValue] = useControllableState<string[]>(normalizedControlled, normalizedDefault);

  const { register: registerBase, itemsRef, keys: itemValues } = useCollection<string, ItemMeta>();

  const registerItem = useCallback(
    (itemValue: string, element: HTMLButtonElement | null, disabled = false) => {
      registerBase(itemValue, element ? { element, disabled } : null);
    },
    // `registerBase` is a stable useCollection callback (its own deps never
    // change), so emptying this array yields the identical memoised function.
    // Stryker disable next-line ArrayDeclaration: equivalent — stable dependency.
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

  // The clicks and keys run in the shared ToggleGroupController
  // (@primitiv-ui/web, RFC 0033 D30); React keeps the state and answers it.
  const rootRef = useHostedController(
    { value, type, orientation, dir, setValue, onValueChange },
    (root, latest) =>
      new ToggleGroupController(root, {
        state: () => {
          const { value, type, orientation, dir } = latest();
          return { pressed: value, multiple: type === "multiple", orientation, dir };
        },
        change: (next) => {
          const { type, setValue, onValueChange } = latest();
          setValue(next);
          if (type === "single") (onValueChange as ((v: string | undefined) => void) | undefined)?.(next[0]);
          else (onValueChange as ((v: string[]) => void) | undefined)?.(next);
        },
      }),
    { itemsRef, keys: itemValues },
  );

  // Tracks which item holds the tabstop. Initialises to the first pressed
  // value so the selected item is immediately tabbable. Updated via the
  // onFocus handler in each Item so the tabstop follows actual focus.
  const [focusedValue, setFocusedValue] = useState<string | undefined>(() => value[0]);

  return {
    rootRef,
    value,
    registerItem,
    itemValues,
    disabledValues,
    focusedValue,
    setFocusedValue,
  };
}
