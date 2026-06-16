import { useCallback } from "react";

import { useControllableState } from "../../hooks/index.ts";

import { CheckedState } from "../types";

type UseCheckboxRootArgs = {
  defaultChecked?: CheckedState;
  checked?: CheckedState;
  onCheckedChange?: (checked: boolean) => void;
};

export function useCheckboxRoot({
  defaultChecked,
  checked: controlledChecked,
  onCheckedChange,
}: UseCheckboxRootArgs) {
  const [checked, setChecked] = useControllableState<CheckedState>(
    controlledChecked,
    defaultChecked ?? false,
  );

  const toggle = useCallback(() => {
    // Indeterminate resolves to checked per the WAI-ARIA tri-state
    // convention; boolean flips.
    const next = checked === "indeterminate" ? true : !checked;
    setChecked(next);
    onCheckedChange?.(next);
  }, [checked, setChecked, onCheckedChange]);

  return { checked, toggle };
}
