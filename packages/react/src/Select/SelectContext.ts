import { RefObject } from "react";

import { createStrictContext } from "../utils/index.ts";

/**
 * Context shared by the rich (non-`native`) Select sub-components —
 * {@link SelectTrigger}, {@link SelectContent}, and (in later cycles)
 * {@link SelectValue} / {@link SelectItem}. Provided by the rich render
 * path of {@link SelectRoot}. The `native` path does not provide it, so
 * the strict hook throwing outside a rich `<Select.Root>` is correct.
 */
export type SelectContextValue = {
  /** Whether the listbox popover is open. */
  open: boolean;
  /** Open/close the listbox. De-dupes repeat transitions. */
  setOpen: (open: boolean) => void;
  /** The currently selected item value (`""` when nothing is selected). */
  value: string;
  /** Commit a selection: sets the value, closes the listbox, focuses the trigger. */
  select: (value: string) => void;
  /** `id` of the listbox content, wired to the trigger's `aria-controls`. */
  contentId: string;
  /** `id` of the trigger, available for labelling. */
  triggerId: string;
  /** Ref to the trigger button so focus can return to it on close. */
  triggerRef: RefObject<HTMLButtonElement | null>;
};

export const [SelectContext, useSelectContext] =
  createStrictContext<SelectContextValue>(
    "Select rich sub-components (Trigger, Value, Content, Item) must be rendered inside a <Select.Root>.",
  );
