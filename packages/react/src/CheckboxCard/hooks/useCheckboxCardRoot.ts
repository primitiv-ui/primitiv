import { useCallback } from "react";

import { useControllableState } from "../../hooks/index.ts";

import type { CheckedState } from "../../Checkbox/types";

type UseCheckboxCardRootArgs = {
  defaultChecked?: CheckedState;
  checked?: CheckedState;
  onCheckedChange?: (checked: boolean) => void;
};

export function useCheckboxCardRoot({
  defaultChecked,
  checked: controlledChecked,
  onCheckedChange,
}: UseCheckboxCardRootArgs) {
  const [checked, setChecked] = useControllableState<CheckedState>(
    controlledChecked,
    defaultChecked ?? false,
  );

  const toggle = useCallback(() => {
    const next = checked === "indeterminate" ? true : !checked;
    setChecked(next);
    onCheckedChange?.(next);
  }, [checked, setChecked, onCheckedChange]);

  return { checked, toggle };
}
