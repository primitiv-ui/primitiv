import {
  useRef,
  useEffect,
  useCallback,
  MouseEvent,
} from "react";

import { useRovingTabindex } from "../../hooks/index.ts";

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
  // When no tab is active (no defaultValue/value provided), the first registered
  // trigger acts as the roving-tabindex home base so the tablist stays reachable
  // via keyboard Tab navigation.
  const isFirst = triggerValues[0] === value;
  const tabIndex = isActive || (activeValue === undefined && isFirst) ? 0 : -1;

  useEffect(() => {
    registerTrigger(value, buttonRef.current, disabled);
    return () => registerTrigger(value, null);
  }, [value, disabled, registerTrigger]);

  const activateTab = useCallback(
    (newValue: string, index: number) => {
      if (activeValue === newValue) return;
      if (isControlled) {
        onValueChange?.(newValue);
      } else {
        setActiveValue(newValue);
      }
      onChange?.({ index, name: newValue });
    },
    [activeValue, isControlled, onValueChange, setActiveValue, onChange],
  );

  // Note: this composition is deliberately bespoke and does NOT use the
  // shared composeEventHandlers from ../../Slot. It runs the library's
  // activation BEFORE the consumer's onClick, and offers no preventDefault
  // veto path — both differ from the shared util's contract. Switching to
  // composeEventHandlers here would be an observable behaviour change for
  // consumers (handler ordering and preventDefault semantics).
  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    const index = triggerValues.indexOf(value);
    if (!disabled) {
      activateTab(value, index);
    }
    onClick?.(e);
  }

  // Tabs deliberately leaves disabled values in `navigable` so arrow keys
  // *land* on disabled tabs (focus moves there) without activating them —
  // that's the Tabs-specific keyboard contract, distinct from RadioGroup
  // and Accordion which both skip disabled siblings entirely.
  const { handleKeyDown } = useRovingTabindex<string>({
    orientation,
    dir,
    navigable: triggerValues,
    currentKey: value,
    includeHomeEnd: true,
    includeActivate: true,
    onNavigate: (targetValue, action) => {
      const isDisabled = disabledTriggerValues.has(targetValue);
      const shouldActivate =
        !isDisabled &&
        (activationMode === "automatic" ||
          (activationMode === "manual" && action === "activate"));
      if (shouldActivate) {
        activateTab(targetValue, triggerValues.indexOf(targetValue));
      }
      focusTrigger(targetValue);
    },
  });
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
