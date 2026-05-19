import type { KeyboardEvent } from "react";

import { useRovingTabindex } from "../../hooks";
import { useTreeContext } from "../TreeContext";

type TreeItemKeyboardOptions = {
  isBranch: boolean;
  parentValue: string | null;
};

/**
 * Combined keyboard handler for every Tree treeitem. Layers the tree's
 * own ArrowRight / ArrowLeft semantics — expand, collapse, focus first
 * child, focus parent — on top of the vertical roving-tabindex
 * navigation, with Enter/Space activation routed through Item-vs-Branch
 * behaviour.
 */
export function useTreeItemKeyboard(
  value: string,
  { isBranch, parentValue }: TreeItemKeyboardOptions,
) {
  const ctx = useTreeContext();
  const navigable = ctx.getVisibleOrder();

  const { handleKeyDown: rovingHandleKeyDown } = useRovingTabindex<string>({
    orientation: "vertical",
    navigable,
    currentKey: value,
    includeHomeEnd: true,
    includeActivate: true,
    onNavigate: (target, action) => {
      if (action === "activate") {
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
      if (!isBranch) {
        return;
      }
      event.preventDefault();
      if (!ctx.isExpanded(value)) {
        ctx.toggleExpanded(value, true);
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
      if (isBranch && ctx.isExpanded(value)) {
        event.preventDefault();
        ctx.toggleExpanded(value, false);
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
