import { useCallback } from "react";

import { useControllableState } from "../../hooks";

import type { TreeContextValue } from "../types";

/**
 * Owns the Tree's expansion state and exposes the read/toggle surface
 * shared with every branch via `TreeContext`.
 */
export function useTreeRoot(
  controlledExpandedValues: string[] | undefined,
  defaultExpandedValues: string[] | undefined,
  onExpandedChange: ((values: string[]) => void) | undefined,
): TreeContextValue {
  const [expandedValues, setExpandedValues] = useControllableState<string[]>(
    controlledExpandedValues,
    defaultExpandedValues ?? [],
    onExpandedChange,
  );

  const isExpanded = useCallback(
    (value: string) => expandedValues.includes(value),
    [expandedValues],
  );

  const toggleExpanded = useCallback(
    (value: string, next?: boolean) => {
      const open = expandedValues.includes(value);
      const shouldOpen = next ?? !open;
      if (shouldOpen === open) {
        return;
      }
      setExpandedValues(
        shouldOpen
          ? [...expandedValues, value]
          : expandedValues.filter((current) => current !== value),
      );
    },
    [expandedValues, setExpandedValues],
  );

  return { isExpanded, toggleExpanded };
}
