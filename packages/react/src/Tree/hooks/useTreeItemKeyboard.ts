import type { KeyboardEvent } from "react";

import { useRovingTabindex } from "../../hooks/index.ts";
import { useTreeContext } from "../TreeContext";

type TreeItemKeyboardOptions = {
  isBranch: boolean;
  parentValue: string | null;
  disabled: boolean;
};

/**
 * Combined keyboard handler for every Tree treeitem. Layers the tree's
 * own ArrowRight / ArrowLeft semantics — expand, collapse, focus first
 * child, focus parent — on top of the vertical roving-tabindex
 * navigation, with Enter/Space activation routed through Item-vs-Branch
 * behaviour. Disabled items short-circuit branch keys and activation
 * but pass through Home/End so a user can escape them.
 */
export function useTreeItemKeyboard(
  value: string,
  { isBranch, parentValue, disabled }: TreeItemKeyboardOptions,
) {
  const ctx = useTreeContext();
  const navigable = ctx
    .getVisibleOrder()
    .filter((candidate) => !ctx.isNodeDisabled(candidate));

  const { handleKeyDown: rovingHandleKeyDown } = useRovingTabindex<string>({
    orientation: "vertical",
    navigable,
    currentKey: value,
    includeHomeEnd: true,
    includeActivate: true,
    onNavigate: (target, action) => {
      if (action === "activate") {
        if (disabled) {
          return;
        }
        if (isBranch) {
          ctx.toggleExpanded(value);
        }
        ctx.select(value);
        return;
      }
      ctx.focusItem(target);
    },
  });

  return function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowRight") {
      if (!isBranch || disabled) {
        return;
      }
      event.preventDefault();
      if (!ctx.isExpanded(value)) {
        ctx.toggleExpanded(value);
        return;
      }
      const order = ctx.getVisibleOrder();
      const next = order[order.indexOf(value) + 1];
      if (next !== undefined) {
        ctx.focusItem(next);
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      if (disabled) {
        return;
      }
      if (isBranch && ctx.isExpanded(value)) {
        event.preventDefault();
        ctx.toggleExpanded(value);
        return;
      }
      if (parentValue !== null) {
        event.preventDefault();
        ctx.focusItem(parentValue);
      }
      return;
    }

    rovingHandleKeyDown(event);
  };
}
