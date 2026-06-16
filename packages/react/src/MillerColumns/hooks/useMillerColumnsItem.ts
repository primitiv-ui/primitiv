import {
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { useRovingTabindex } from "../../hooks/index.ts";
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
  const {
    activePath,
    select,
    registerItem,
    getColumnItems,
    focusItem,
    focusFirstInColumn,
    requestColumnFocus,
    activeItem,
    setActiveItem,
  } = useMillerColumnsContext();
  const { depth } = useMillerColumnsColumnContext();

  const selected = activePath[depth] === value;

  const itemRef = useRef<HTMLDivElement>(null);
  const composedRef = ref ? composeRefs(itemRef, ref) : itemRef;

  useEffect(() => {
    registerItem(depth, value, itemRef.current, disabled);
    return () => registerItem(depth, value, null, disabled);
  }, [depth, value, disabled, registerItem]);

  const enabledValues = getColumnItems(depth)
    .filter((item) => !item.disabled)
    .map((item) => item.value);

  const { handleKeyDown: rovingKeyDown } = useRovingTabindex<string>({
    orientation: "vertical",
    navigable: enabledValues,
    currentKey: value,
    includeHomeEnd: true,
    includeActivate: true,
    onNavigate: (target, action) => {
      if (action === "activate") {
        if (!disabled) {
          select(depth, value);
        }
        return;
      }
      focusItem(depth, target);
    },
  });

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }
    onClick?.(event);
    select(depth, value);
  }

  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    onFocus?.(event);
    setActiveItem({ depth, value });
  }

  // Exactly one item in the whole tree is the Tab stop. It follows the
  // last-focused item; before any focus it defaults to the deepest
  // selected item, falling back to the first enabled root item.
  const tabStop =
    activeItem ??
    (activePath.length > 0
      ? { depth: activePath.length - 1, value: activePath[activePath.length - 1] }
      : null);
  const isTabStop = tabStop
    ? tabStop.depth === depth && tabStop.value === value
    : depth === 0 &&
      getColumnItems(0).find((item) => !item.disabled)?.value === value;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);

    if (event.key === "ArrowRight") {
      if (!hasChildren || disabled) {
        return;
      }
      event.preventDefault();
      if (selected) {
        focusFirstInColumn(depth + 1);
      } else {
        requestColumnFocus(depth + 1);
        select(depth, value);
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      if (depth === 0) {
        return;
      }
      event.preventDefault();
      // A column at depth > 0 exists only because its parent item is
      // selected, so activePath[depth - 1] is always defined here.
      focusItem(depth - 1, activePath[depth - 1]);
      return;
    }

    rovingKeyDown(event);
  }

  const itemProps = {
    ref: composedRef,
    role: "treeitem",
    tabIndex: isTabStop ? 0 : -1,
    "aria-selected": selected,
    "aria-level": depth + 1,
    ...(hasChildren ? { "aria-expanded": selected } : {}),
    "data-state": selected ? "selected" : "unselected",
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
