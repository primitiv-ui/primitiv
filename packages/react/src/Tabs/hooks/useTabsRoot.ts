import {
  useCallback,
  useId,
  useEffect,
  useImperativeHandle,
  useMemo,
  Ref,
} from "react";

import { useCollection, useControllableState } from "../../hooks/index.ts";

import type { TabsRootProps, TabsImperativeApi } from "../types";

type TriggerMeta = {
  element: HTMLButtonElement;
  disabled: boolean;
};

export function useTabsRoot(
  {
    orientation = "horizontal",
    dir = "ltr",
    activationMode = "automatic",
    defaultValue,
    value,
    onValueChange,
    onChange,
    lazyMount = false,
  }: Omit<TabsRootProps, "className">,
  ref: Ref<TabsImperativeApi>,
) {
  const tabsId = useId();
  // Tabs intentionally does NOT pass onValueChange to useControllableState:
  // in uncontrolled mode the existing public contract fires only `onChange`
  // (with the {index, name} payload), not `onValueChange`. Tabs.Trigger
  // therefore branches on isControlled and calls onValueChange directly in
  // the controlled path; the hook's setter is the uncontrolled-mode setState.
  const [activeValue, setActiveValue, isControlled] =
    useControllableState<string>(value, defaultValue);
  const {
    register: registerTriggerBase,
    itemsRef: triggersRef,
    keys: triggerValues,
  } = useCollection<string, TriggerMeta>();

  const registerTrigger = useCallback(
    (
      triggerValue: string,
      element: HTMLButtonElement | null,
      disabled = false,
    ) => {
      registerTriggerBase(
        triggerValue,
        element ? { element, disabled } : null,
      );
    },
    [registerTriggerBase],
  );

  const disabledTriggerValues = useMemo(
    () =>
      new Set(
        Array.from(triggersRef.current.entries())
          .filter(([, meta]) => meta.disabled)
          .map(([v]) => v),
      ),
    // triggerValues is a fresh array on every register call, so the memo
    // re-runs whenever any trigger mounts, unmounts, or toggles disabled.
    [triggerValues, triggersRef],
  );

  const focusTrigger = useCallback(
    (triggerValue: string) => {
      triggersRef.current.get(triggerValue)?.element.focus();
    },
    [triggersRef],
  );

  useEffect(() => {
    if (
      triggerValues.length > 0 &&
      activeValue !== undefined &&
      !triggerValues.includes(activeValue)
    ) {
      throw new Error(
        `Invalid active tab value: "${activeValue}". Valid values are: [${triggerValues.join(
          ", ",
        )}]`,
      );
    }
  }, [activeValue, triggerValues]);

  // Imperative API
  useImperativeHandle(
    ref,
    () => ({
      setActiveTab: (newValue: string) => {
        if (!triggerValues.includes(newValue)) {
          throw new Error(`Invalid tab value: ${newValue}`);
        }

        if (isControlled) {
          onValueChange?.(newValue);
        } else {
          setActiveValue(newValue);
        }
      },
    }),
    [isControlled, setActiveValue, onValueChange, triggerValues],
  );

  const contextValue = useMemo(
    () => ({
      orientation,
      dir,
      activationMode,
      tabsId,
      activeValue,
      isControlled,
      setActiveValue,
      onValueChange,
      onChange,
      lazyMount,
      registerTrigger,
      triggerValues,
      disabledTriggerValues,
      focusTrigger,
    }),
    [
      orientation,
      dir,
      activationMode,
      tabsId,
      activeValue,
      isControlled,
      setActiveValue,
      onValueChange,
      onChange,
      lazyMount,
      registerTrigger,
      triggerValues,
      disabledTriggerValues,
      focusTrigger,
    ],
  );

  return { contextValue };
}
