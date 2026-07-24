import { createStrictContext } from "../utils/index.ts";

/**
 * Context published by a rich {@link SelectItem} to its
 * {@link SelectItemIndicator} child, carrying whether the item is currently
 * selected so the indicator can render (and expose `data-state`).
 */
export type SelectItemIndicatorContextValue = {
  /** Whether the enclosing item is the selected one. */
  selected: boolean;
};

export const [SelectItemIndicatorContext, useSelectItemIndicatorContext] =
  createStrictContext<SelectItemIndicatorContextValue>(
    "Select.ItemIndicator must be rendered inside a <Select.Item>.",
  );
