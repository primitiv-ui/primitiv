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
    orientation,
    dir,
    activationMode,
    defaultValue,
    value,
    onValueChange,
    onChange,
    lazyMount,
  }: // `TabsRoot` always resolves these four before calling the hook, so they
  // are required here (a default would be dead code the tests never reach).
  Omit<TabsRootProps, "className"> &
    Required<
      Pick<
        TabsRootProps,
        "orientation" | "dir" | "activationMode" | "lazyMount"
      >
    >,
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
      // The default is only reached by the cleanup call `registerTrigger(value,
      // null)`, where `element` is null and `disabled` is discarded — so its
      // value is never observable.
      // Stryker disable next-line BooleanLiteral
      disabled = false,
    ) => {
      registerTriggerBase(
        triggerValue,
        element ? { element, disabled } : null,
      );
    },
    // `registerTriggerBase` is a stable useCollection callback, so emptying this
    // array yields the identical memoised function.
    // Stryker disable next-line ArrayDeclaration: equivalent — stable dependency.
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
      // `triggerValue` is always sourced from the navigable set (registered
      // triggers), so a value that reaches here has a live entry.
      // Stryker disable next-line OptionalChaining: unreachable given that invariant.
      triggersRef.current.get(triggerValue)?.element.focus();
    },
    // `triggersRef` is a stable RefObject, so emptying this array yields the
    // identical memoised function.
    // Stryker disable next-line ArrayDeclaration: equivalent — stable dependency.
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
          // Controlled mode requires `onValueChange` (discriminated-union prop
          // type), so the optional call can never no-op in valid usage.
          // Stryker disable next-line OptionalChaining: unreachable — controlled requires onValueChange.
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
