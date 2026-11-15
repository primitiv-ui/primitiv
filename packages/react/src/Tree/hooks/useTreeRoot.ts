import { useCallback, useId, useRef, useState } from "react";

import { treePath } from "@primitiv-ui/core";
import { TreeController } from "@primitiv-ui/web";

import { useCollection, useControllableState } from "../../hooks/index.ts";

import type {
  SelectionMode,
  TreeContextValue,
  TreeNodeMeta,
  TreePathSegment,
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
    (value: string): TreePathSegment[] =>
      treePath((candidate) => {
        const meta = pathMetaRef.current.get(candidate);
        return meta && { ...meta, parent: meta.parentValue };
      }, value).map(({ value: segment, label, isBranch, disabled, depth }) => ({
        value: segment,
        label,
        isBranch,
        disabled,
        depth,
      })),
    // `pathMetaVersion` bumps whenever the persistent map mutates,
    // forcing context-value identity to change so consumers re-render
    // and re-evaluate `getPath`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathMetaVersion],
  );

  const [activeValue, setActiveValue] = useState<string | null>(null);

  const isExpanded = useCallback(
    (value: string) => expandedValues.includes(value),
    [expandedValues],
  );

  const isSelected = useCallback(
    (value: string) => selectedValues.includes(value),
    [selectedValues],
  );

  // ── The adapter (RFC 0033 §3.4, D28) ────────────────────────────────────
  // Selection (single, Shift ranges, Ctrl / Meta toggles), expanding and
  // collapsing, and the keyboard run in the web implementation's
  // TreeController, the same code the <primitiv-tree> elements run. React keeps
  // wiring each treeitem's and row's events, composed with its consumers'
  // handlers, and keeps the state; the controller reads it through `latest`.
  const snapshot = {
    mode: options.selectionMode,
    selectedValues,
    expandedValues,
    keys,
    setSelectedValues,
    setExpandedValues,
  };
  const latest = useRef(snapshot);
  latest.current = snapshot;
  const controllerRef = useRef<TreeController | null>(null);
  controllerRef.current ??= new TreeController({
    state: () => ({
      mode: latest.current.mode,
      selected: latest.current.selectedValues,
      expanded: latest.current.expandedValues,
    }),
    // Siblings in registration order, which is mount order — the order the
    // tree has always walked them in.
    nodes: () =>
      latest.current.keys.map((key) => {
        const meta = itemsRef.current.get(key)!;
        return {
          value: meta.value,
          parent: meta.parentValue,
          isBranch: meta.isBranch,
          disabled: meta.disabled,
        };
      }),
    element: (value) => itemsRef.current.get(value)!.element,
    select: (next) => latest.current.setSelectedValues(next),
    expand: (next) => latest.current.setExpandedValues(next),
  });
  const controller = controllerRef.current;

  return {
    rootId,
    selectionMode: options.selectionMode,
    isExpanded,
    isSelected,
    controller,
    registerNode,
    tabStop: controller.tabStop(activeValue),
    setActiveValue,
    getPath,
    selectedOrder: selectedValues,
  };
}
