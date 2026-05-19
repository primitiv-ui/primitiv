import { useTreeContext } from "../TreeContext";
import { useRovingTabindex } from "../../hooks";

/**
 * The vertical roving-tabindex keydown handler shared by every Tree
 * treeitem — Item and Branch alike. Arrow Up/Down/Home/End navigate
 * between the visible items; branch-specific keys are layered on top
 * by `useTreeBranchKeyboard`.
 */
export function useTreeItemKeyboard(value: string) {
  const { getVisibleOrder, focusItem } = useTreeContext();
  const navigable = getVisibleOrder();

  const { handleKeyDown } = useRovingTabindex<string>({
    orientation: "vertical",
    navigable,
    currentKey: value,
    includeHomeEnd: true,
    onNavigate: (target) => {
      focusItem(target);
    },
  });

  return handleKeyDown;
}
