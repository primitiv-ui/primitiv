import { useCallback, useEffect, useId, useMemo, useRef } from "react";

import { useControllableState } from "../../hooks/index.ts";
import type { SelectContextValue } from "../SelectContext";

type UseSelectRootArgs = {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

/**
 * State owner for the rich (non-`native`) Select. Manages the open/close
 * state of the listbox popover — controlled (`open` + `onOpenChange`) or
 * uncontrolled (`defaultOpen`) — and derives the trigger/content ids.
 * Mirrors {@link useDropdownRoot}, including the `openRef` de-dupe so a
 * single light-dismiss that fires both a `toggle` event and our own close
 * does not double-notify `onOpenChange`.
 */
export function useSelectRoot({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  value: controlledValue,
  defaultValue,
  onValueChange,
}: UseSelectRootArgs): { contextValue: SelectContextValue } {
  const contentId = useId();
  const triggerId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpenBase] = useControllableState<boolean>(
    controlledOpen,
    defaultOpen,
    onOpenChange,
  );
  const [value, setValue] = useControllableState<string>(
    controlledValue,
    defaultValue ?? "",
    onValueChange,
  );

  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  });

  const setOpen = useCallback(
    (next: boolean) => {
      if (openRef.current === next) return;
      openRef.current = next;
      setOpenBase(next);
    },
    [setOpenBase],
  );

  // Commit a selection: update the value, close the listbox, and return
  // focus to the trigger (the standard listbox close-on-select behaviour).
  const select = useCallback(
    (next: string) => {
      setValue(next);
      setOpenBase(false);
      openRef.current = false;
      triggerRef.current?.focus();
    },
    [setValue, setOpenBase],
  );

  const contextValue = useMemo(
    () => ({ open, setOpen, value, select, contentId, triggerId, triggerRef }),
    [open, setOpen, value, select, contentId, triggerId],
  );

  return { contextValue };
}
