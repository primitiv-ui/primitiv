import { useCallback, useId, useMemo } from "react";

import { useControllableState } from "../../hooks/index.ts";

export function useCollapsibleRoot(
  controlledOpen: boolean | undefined,
  defaultOpen: boolean,
  onOpenChange: ((open: boolean) => void) | undefined,
  disabled: boolean,
) {
  const collapsibleId = useId();
  const [open, setOpen] = useControllableState<boolean>(
    controlledOpen,
    defaultOpen,
    onOpenChange,
  );

  const toggle = useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  const contextValue = useMemo(
    () => ({
      open,
      disabled,
      toggle,
      triggerId: `${collapsibleId}-trigger`,
      contentId: `${collapsibleId}-content`,
    }),
    [open, disabled, toggle, collapsibleId],
  );

  return { contextValue };
}
