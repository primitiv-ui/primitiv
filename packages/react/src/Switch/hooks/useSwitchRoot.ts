import { useCallback } from "react";

import { useControllableState } from "../../hooks/index.ts";

type UseSwitchRootArgs = {
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function useSwitchRoot({
  defaultChecked,
  checked: controlledChecked,
  onCheckedChange,
}: UseSwitchRootArgs) {
  const [checked, setChecked] = useControllableState<boolean>(
    controlledChecked,
    defaultChecked ?? false,
  );

  const toggle = useCallback(() => {
    const next = !checked;
    setChecked(next);
    onCheckedChange?.(next);
  }, [checked, setChecked, onCheckedChange]);

  return { checked, toggle };
}
