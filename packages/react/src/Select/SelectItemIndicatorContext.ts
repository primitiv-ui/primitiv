import { createStrictContext } from "../utils/index.ts";

/**
 * Context published by a rich {@link SelectItem} to its
 * {@link SelectItemIndicator} child, carrying whether the item is currently
 * selected so the indicator can render (and expose `data-state`).
 */
export type SelectItemIndicatorContextValue = {
  /** Whether the enclosing item is the selected one. */
  selected: boolean;
  /**
   * `true` while the subtree is being rendered by {@link SelectValue} as the
   * mirrored copy of the selected item's content, rather than inside the item
   * itself. Indicators render nothing there: the mark answers "which row is
   * selected", which is redundant on the trigger it already represents.
   *
   * The mirror cannot identify indicators by element type — a styled layer
   * wraps `Select.ItemIndicator` in its own component (the registry does), and
   * any such wrapper is opaque to a `child.type` test. Publishing the intent
   * through context instead lets the indicator opt itself out at any nesting
   * depth.
   */
  mirrored: boolean;
};

export const [SelectItemIndicatorContext, useSelectItemIndicatorContext] =
  createStrictContext<SelectItemIndicatorContextValue>(
    "Select.ItemIndicator must be rendered inside a <Select.Item>.",
  );
