import {
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

import { composeRefs } from "../../Slot/index.ts";

import type {
  MillerColumnsItemContextValue,
  MillerColumnsItemProps,
} from "../types";

import { useMillerColumnsContext } from "./useMillerColumnsContext";
import { useMillerColumnsColumnContext } from "./useMillerColumnsColumnContext";

export function useMillerColumnsItem(
  {
    value,
    ref,
    onClick,
    onKeyDown,
    onFocus,
    disabled = false,
    ...rest
  }: Omit<MillerColumnsItemProps, "children">,
  hasChildren: boolean,
) {
  const { activePath, registerItem, controller, tabStop, setActiveItem } =
    useMillerColumnsContext();
  const { depth } = useMillerColumnsColumnContext();

  const selected = activePath[depth] === value;
  // The deepest selected item — the one the user actually landed on, as
  // opposed to the ancestors its path passes through. Nothing else in the
  // DOM distinguishes the two, and styling them alike loses the depth cue.
  const terminal = selected && depth === activePath.length - 1;

  const itemRef = useRef<HTMLDivElement>(null);
  const composedRef = ref ? composeRefs(itemRef, ref) : itemRef;

  // Registration is a *layout* effect so the resulting state update lands
  // before paint. As a passive effect, a populated column would paint one
  // frame with `data-empty` before its items registered.
  useLayoutEffect(() => {
    registerItem(depth, value, itemRef.current, disabled, hasChildren);
    return () => registerItem(depth, value, null, disabled, hasChildren);
  }, [depth, value, disabled, hasChildren, registerItem]);

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }
    onClick?.(event);
    controller.click({ depth, value });
  }

  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    onFocus?.(event);
    setActiveItem({ depth, value });
  }

  // Exactly one item in the whole tree is the Tab stop: the controller's
  // rule — the last-focused item, else the deepest selected item, else the
  // first enabled root item.
  const isTabStop = tabStop?.depth === depth && tabStop.value === value;

  // The keymap (step in and out, the column's arrows, Enter / Space) and
  // typeahead are the controller's; a consumer's handler runs first.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    controller.keydown({ depth, value }, event);
  }

  const itemProps = {
    ref: composedRef,
    role: "treeitem",
    tabIndex: isTabStop ? 0 : -1,
    "aria-selected": selected,
    "aria-level": depth + 1,
    ...(hasChildren ? { "aria-expanded": selected } : {}),
    "data-state": selected ? "selected" : "unselected",
    ...(terminal ? { "data-terminal": "" } : {}),
    "data-depth": depth,
    ...(hasChildren ? { "data-has-children": "" } : {}),
    ...(disabled ? { "aria-disabled": true, "data-disabled": "" } : {}),
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    onFocus: handleFocus,
    ...rest,
  };

  const itemContextValue = useMemo<MillerColumnsItemContextValue>(
    () => ({ selected, hasChildren }),
    [selected, hasChildren],
  );

  return { itemProps, selected, itemContextValue };
}
