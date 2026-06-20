import { useCallback } from "react";

import { useControllableState } from "../../hooks/index.ts";

type UseRadioRootArgs = {
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function useRadioRoot({
  defaultChecked,
  checked: controlledChecked,
  onCheckedChange,
}: UseRadioRootArgs) {
  const [checked, setChecked] = useControllableState<boolean>(
    controlledChecked,
    defaultChecked ?? false,
  );

  const select = useCallback(() => {
    // A radio only ever moves *into* the selected state — re-clicking the
    // already-selected radio is a no-op (no toggle-off), per the WAI-ARIA
    // radio convention. De-selection happens when a sibling is chosen, which
    // is the grouping consumer's concern, not this lone control's.
    if (checked) return;
    setChecked(true);
    onCheckedChange?.(true);
  }, [checked, setChecked, onCheckedChange]);

  return { checked, select };
}
