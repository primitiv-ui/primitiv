import { useCallback, useId, useRef, useState } from "react";

import { useCollection, useControllableState } from "../../hooks";

import type {
  SelectionMode,
  TreeContextValue,
  TreeNodeMeta,
  TreePathSegment,
  TreeSelectModifiers,
} from "../types";

/** Defensive cap to short-circuit a cycle in `parentValue` pointers. */
const MAX_PATH_DEPTH = 64;

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
 * Owns the Tree's expansion and selection state, the item collection
 * used to compute the visible DFS order, and the anchor that pins
 * Shift+click range selection.
 */
export function useTreeRoot(options: UseTreeRootOptions): TreeContextValue {
  const rootId = useId();

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
        options.onSelectedValueChange?.(next[0]!);
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

  const {
    register: registerCollectionNode,
    itemsRef,
    keys,
  } = useCollection<string, TreeNodeMeta>();

  // Durable copy of every node meta ever registered. Unlike the
  // collection above (which deletes on unmount so visible-order /
  // focus reflect mounted state) this map keeps the last-seen entry
  // for each value so `getPath` resolves ancestry even when an
  // ancestor branch has collapsed without `forceMount` and its
  // descendants have unmounted.
  const pathMetaRef = useRef<Map<string, TreeNodeMeta>>(new Map());
  const [pathMetaVersion, setPathMetaVersion] = useState(0);

  const registerNode = useCallback(
    (value: string, meta: TreeNodeMeta | null) => {
      if (meta !== null) {
        pathMetaRef.current.set(value, meta);
        setPathMetaVersion((current) => current + 1);
      }
      registerCollectionNode(value, meta);
    },
    [registerCollectionNode],
  );

  const getPath = useCallback(
    (value: string): TreePathSegment[] => {
      const segments: TreePathSegment[] = [];
      let cursor: string | null = value;
      let hops = 0;
      while (cursor !== null && hops < MAX_PATH_DEPTH) {
        const meta = pathMetaRef.current.get(cursor);
        if (meta === undefined) {
          return [];
        }
        segments.unshift({
          value: meta.value,
          label: meta.label,
          isBranch: meta.isBranch,
          disabled: meta.disabled,
          depth: meta.depth,
        });
        cursor = meta.parentValue;
        hops += 1;
      }
      return segments;
    },
    // `pathMetaVersion` bumps whenever the persistent map mutates,
    // forcing context-value identity to change so consumers re-render
    // and re-evaluate `getPath`.
    [pathMetaVersion],
  );

  const anchorRef = useRef<string | null>(null);
  const [activeValue, setActiveValue] = useState<string | null>(null);

  const focusItem = useCallback(
    (value: string) => {
      itemsRef.current.get(value)?.element.focus();
    },
    [itemsRef],
  );

  const isNodeDisabled = useCallback(
    (value: string) => itemsRef.current.get(value)?.disabled === true,
    [itemsRef],
  );

  const isExpanded = useCallback(
    (value: string) => expandedValues.includes(value),
    [expandedValues],
  );

  const toggleExpanded = useCallback(
    (value: string) => {
      const open = expandedValues.includes(value);
      setExpandedValues(
        open
          ? expandedValues.filter((current) => current !== value)
          : [...expandedValues, value],
      );
    },
    [expandedValues, setExpandedValues],
  );

  const isSelected = useCallback(
    (value: string) => selectedValues.includes(value),
    [selectedValues],
  );

  const getVisibleOrder = useCallback((): string[] => {
    const childrenByParent = new Map<string | null, string[]>();
    for (const key of keys) {
      const meta = itemsRef.current.get(key)!;
      const bucket = childrenByParent.get(meta.parentValue) ?? [];
      bucket.push(meta.value);
      childrenByParent.set(meta.parentValue, bucket);
    }

    const result: string[] = [];
    const visit = (parent: string | null): void => {
      for (const value of childrenByParent.get(parent) ?? []) {
        result.push(value);
        const meta = itemsRef.current.get(value);
        if (meta?.isBranch && expandedValues.includes(value)) {
          visit(value);
        }
      }
    };
    visit(null);
    return result;
  }, [keys, itemsRef, expandedValues]);

  const select = useCallback(
    (value: string, modifiers?: TreeSelectModifiers) => {
      if (options.selectionMode === "single") {
        if (selectedValues[0] === value) {
          return;
        }
        setSelectedValues([value]);
        anchorRef.current = value;
        return;
      }

      const shift = modifiers?.shift === true;
      const additive = modifiers?.meta === true || modifiers?.ctrl === true;
      const alreadySelected = selectedValues.includes(value);

      if (shift) {
        const anchor = anchorRef.current ?? value;
        const order = getVisibleOrder();
        const anchorIndex = order.indexOf(anchor);
        const valueIndex = order.indexOf(value);
        if (anchorIndex === -1 || valueIndex === -1) {
          setSelectedValues([value]);
          return;
        }
        const [start, end] =
          anchorIndex <= valueIndex
            ? [anchorIndex, valueIndex]
            : [valueIndex, anchorIndex];
        const range = order
          .slice(start, end + 1)
          .filter((candidate) => !isNodeDisabled(candidate));
        setSelectedValues(range);
        return;
      }

      if (additive) {
        setSelectedValues(
          alreadySelected
            ? selectedValues.filter((current) => current !== value)
            : [...selectedValues, value],
        );
        anchorRef.current = value;
        return;
      }

      if (selectedValues.length === 1 && alreadySelected) {
        return;
      }
      setSelectedValues([value]);
      anchorRef.current = value;
    },
    [
      options.selectionMode,
      selectedValues,
      setSelectedValues,
      getVisibleOrder,
      isNodeDisabled,
    ],
  );

  const visibleOrder = getVisibleOrder();
  const defaultTabStop =
    visibleOrder.find((candidate) => !isNodeDisabled(candidate)) ?? null;
  const tabStop =
    activeValue !== null && visibleOrder.includes(activeValue)
      ? activeValue
      : defaultTabStop;

  return {
    rootId,
    selectionMode: options.selectionMode,
    isExpanded,
    toggleExpanded,
    isSelected,
    select,
    registerNode,
    getVisibleOrder,
    isNodeDisabled,
    tabStop,
    setActiveValue,
    focusItem,
    getPath,
    selectedOrder: selectedValues,
  };
}
