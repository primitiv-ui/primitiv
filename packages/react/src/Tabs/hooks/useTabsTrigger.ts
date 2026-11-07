import {
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import { tabsClick, tabsKeydown, tabsTabStop } from "@primitiv-ui/core";

import { TabsTriggerProps } from "../types";
import { getTriggerAndPanelIds } from "../utils";

import { useTabsContext } from "./useTabsContext";

export function useTabsTrigger({
  value,
  onClick,
  disabled,
}: Pick<TabsTriggerProps, "value" | "onClick" | "disabled">) {
  const {
    orientation,
    dir,
    activationMode,
    activeValue,
    isControlled,
    setActiveValue,
    onValueChange,
    onChange,
    tabsId,
    registerTrigger,
    triggerValues,
    disabledTriggerValues,
    focusTrigger,
  } = useTabsContext();
  const isActive = activeValue === value;
  const { triggerId, panelId } = getTriggerAndPanelIds(tabsId, value);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const state = isActive ? "active" : "inactive";
  // The roving tab stop is Tabs policy, shared with every surface through
  // @primitiv-ui/core (RFC 0033 §3.1): the active tab, or the first registered
  // trigger while none is active, so the tablist stays reachable by keyboard.
  const tabIndex = tabsTabStop({ values: triggerValues, active: activeValue }) === value ? 0 : -1;

  useEffect(() => {
    registerTrigger(value, buttonRef.current, disabled);
    return () => registerTrigger(value, null);
  }, [value, disabled, registerTrigger]);

  const activateTab = useCallback(
    // Callers pass only a real change: the core policy never asks to activate
    // the tab that is already active.
    (newValue: string, index: number) => {
      if (isControlled) {
        // Controlled mode requires `onValueChange` (discriminated-union prop
        // type), so the optional call can never no-op in valid usage.
        // Stryker disable next-line OptionalChaining: unreachable — controlled requires onValueChange.
        onValueChange?.(newValue);
      } else {
        setActiveValue(newValue);
      }
      onChange?.({ index, name: newValue });
    },
    [isControlled, onValueChange, setActiveValue, onChange],
  );

  // Note: this composition is deliberately bespoke and does NOT use the
  // shared composeEventHandlers from ../../Slot. It runs the library's
  // activation BEFORE the consumer's onClick, and offers no preventDefault
  // veto path — both differ from the shared util's contract. Switching to
  // composeEventHandlers here would be an observable behaviour change for
  // consumers (handler ordering and preventDefault semantics).
  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    const target = tabsClick({ disabled: disabledTriggerValues, active: activeValue }, value);
    if (target !== null) {
      activateTab(target, triggerValues.indexOf(target));
    }
    onClick?.(e);
  }

  // Tabs' keyboard contract (arrows land on a disabled tab without activating
  // it; manual mode activates only on Enter / Space) is core policy, so the
  // web implementation follows exactly the same rules.
  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const outcome = tabsKeydown(
      {
        values: triggerValues,
        disabled: disabledTriggerValues,
        active: activeValue,
        orientation,
        dir,
        activationMode,
      },
      value,
      e.key,
    );
    if (!outcome) return;
    e.preventDefault();
    if (outcome.activate !== null) {
      activateTab(outcome.activate, triggerValues.indexOf(outcome.activate));
    }
    focusTrigger(outcome.focus);
  }

  return {
    buttonRef,
    triggerId,
    panelId,
    isActive,
    orientation,
    state,
    tabIndex,
    handleClick,
    handleKeyDown,
  };
}
