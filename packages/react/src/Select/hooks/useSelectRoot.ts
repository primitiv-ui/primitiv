import {
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

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
}: UseSelectRootArgs): {
  contextValue: SelectContextValue;
  value: string;
  itemValues: string[];
} {
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
      // Stryker disable next-line OptionalChaining: unreachable — the trigger is always mounted when an item is selected (selection happens inside the open Content).
      triggerRef.current?.focus();
    },
    [setValue, setOpenBase],
  );

  // Item registry — lets Select.Value mirror the selected item's content
  // (written once on the Item). Children live in a ref (updated silently
  // every render, no re-render churn); `itemVersion` bumps only when the set
  // of registered values changes (mount/unmount), so Value re-renders when
  // items appear or disappear. See the react-component-patterns skill.
  const itemChildrenRef = useRef<Map<string, ReactNode>>(new Map());
  const [itemVersion, setItemVersion] = useState(0);

  const registerItem = useCallback((itemValue: string, node: ReactNode) => {
    const isNew = !itemChildrenRef.current.has(itemValue);
    itemChildrenRef.current.set(itemValue, node);
    // Stryker disable next-line ArithmeticOperator: equivalent — the version is an opaque re-render trigger; any change has the same effect.
    if (isNew) setItemVersion((v) => v + 1);
  }, []);

  const unregisterItem = useCallback((itemValue: string) => {
    itemChildrenRef.current.delete(itemValue);
    // Stryker disable next-line ArithmeticOperator: equivalent — the version is an opaque re-render trigger; any change has the same effect.
    setItemVersion((v) => v + 1);
  }, []);

  const getItemChildren = useCallback(
    (itemValue: string) => itemChildrenRef.current.get(itemValue),
    [],
  );

  // Registered values, recomputed whenever items mount/unmount, so Root can
  // render a matching <option> in the hidden form <select>.
  const itemValues = useMemo(
    () => Array.from(itemChildrenRef.current.keys()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemVersion],
  );

  const contextValue = useMemo(
    () => ({
      open,
      setOpen,
      value,
      select,
      registerItem,
      unregisterItem,
      getItemChildren,
      contentId,
      triggerId,
      triggerRef,
    }),
    // itemVersion is intentionally in the dep list (not the value) so the
    // context identity changes when items mount/unmount, re-rendering
    // Select.Value even though the callbacks are stable.
    [
      open,
      setOpen,
      value,
      select,
      registerItem,
      unregisterItem,
      getItemChildren,
      contentId,
      triggerId,
      itemVersion,
    ],
  );

  return { contextValue, value, itemValues };
}
