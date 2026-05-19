import { useCallback } from "react";

import { useControllableState } from "../../hooks";

import type {
  SelectionMode,
  TreeContextValue,
  TreeSelectModifiers,
} from "../types";

export type UseTreeRootOptions = {
  expandedValues: string[] | undefined;
  defaultExpandedValues: string[] | undefined;
  onExpandedChange: ((values: string[]) => void) | undefined;
  selectionMode: SelectionMode;
  selectedValue: string | null | undefined;
  defaultSelectedValue: string | null | undefined;
  onSelectedValueChange: ((value: string | null) => void) | undefined;
  selectedValues: string[] | undefined;
  defaultSelectedValues: string[] | undefined;
  onSelectedValuesChange: ((values: string[]) => void) | undefined;
};

function singleToArray(value: string | null | undefined): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  return value === null ? [] : [value];
}

/**
 * Owns the Tree's expansion and selection state, exposing the
 * read/toggle/select surface shared with every sub-component via
 * `TreeContext`. Selection is normalised to a single string[] internally
 * regardless of mode.
 */
export function useTreeRoot(options: UseTreeRootOptions): TreeContextValue {
  const [expandedValues, setExpandedValues] = useControllableState<string[]>(
    options.expandedValues,
    options.defaultExpandedValues ?? [],
    options.onExpandedChange,
  );

  const normalisedSelectedValues =
    options.selectionMode === "multiple"
      ? options.selectedValues
      : singleToArray(options.selectedValue);

  const normalisedDefaultSelectedValues =
    options.selectionMode === "multiple"
      ? (options.defaultSelectedValues ?? [])
      : (singleToArray(options.defaultSelectedValue) ?? []);

  const handleSelectedValuesChange = useCallback(
    (next: string[]) => {
      if (options.selectionMode === "multiple") {
        options.onSelectedValuesChange?.(next);
      } else {
        options.onSelectedValueChange?.(next[0] ?? null);
      }
    },
    [
      options.selectionMode,
      options.onSelectedValueChange,
      options.onSelectedValuesChange,
    ],
  );

  const [selectedValues, setSelectedValues] = useControllableState<string[]>(
    normalisedSelectedValues,
    normalisedDefaultSelectedValues,
    handleSelectedValuesChange,
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

  const isSelected = useCallback(
    (value: string) => selectedValues.includes(value),
    [selectedValues],
  );

  const select = useCallback(
    (value: string, modifiers?: TreeSelectModifiers) => {
      if (options.selectionMode === "single") {
        if (selectedValues[0] === value) {
          return;
        }
        setSelectedValues([value]);
        return;
      }

      const additive = modifiers?.meta === true || modifiers?.ctrl === true;
      const alreadySelected = selectedValues.includes(value);

      if (additive) {
        setSelectedValues(
          alreadySelected
            ? selectedValues.filter((current) => current !== value)
            : [...selectedValues, value],
        );
        return;
      }

      if (selectedValues.length === 1 && alreadySelected) {
        return;
      }
      setSelectedValues([value]);
    },
    [options.selectionMode, selectedValues, setSelectedValues],
  );

  return {
    selectionMode: options.selectionMode,
    isExpanded,
    toggleExpanded,
    isSelected,
    select,
  };
}
