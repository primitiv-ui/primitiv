import { ReactNode, RefObject } from "react";

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
  /** Register (or refresh) a rich item's content for value-mirroring. */
  registerItem: (value: string, children: ReactNode) => void;
  /** Remove a rich item's registration on unmount. */
  unregisterItem: (value: string) => void;
  /** Read the registered content for a value (used by Select.Value). */
  getItemChildren: (value: string) => ReactNode | undefined;
  /** `id` of the listbox content, wired to the trigger's `aria-controls`. */
  contentId: string;
  /** `id` of the trigger, available for labelling. */
  triggerId: string;
  /** Ref to the trigger button so focus can return to it on close. */
  triggerRef: RefObject<HTMLButtonElement | null>;
  /** Register a mounted option's element (or `null` on unmount), for the controller to map a click to its value. */
  registerOption: (value: string, option: { element: HTMLElement; disabled: boolean } | null) => void;
  /** The registered options, as `useCollection` keeps them. */
  optionsRef: RefObject<Map<string, { element: HTMLElement; disabled: boolean }>>;
  /** The registered options' values; a fresh array whenever one registers or leaves. */
  optionKeys: readonly string[];
};

export const [SelectContext, useSelectContext] =
  createStrictContext<SelectContextValue>(
    "Select rich sub-components (Trigger, Value, Content, Item) must be rendered inside a <Select.Root>.",
  );
