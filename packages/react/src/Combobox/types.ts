import type { ComponentProps } from "react";

/** The value carried from `Combobox.Root` to its parts. */
export interface ComboboxContextValue {
  /** Whether the popup listbox is open. */
  open: boolean;
  /** DOM id of the popup listbox, wired to the input's `aria-controls`. */
  listboxId: string;
}

/** Props for `Combobox.Root` — the wrapper that owns the combobox's state. */
export interface ComboboxRootProps extends ComponentProps<"div"> {
  /**
   * Whether the popup is open on first render, for the uncontrolled case.
   *
   * @default false
   */
  defaultOpen?: boolean;
}

/** Props for `Combobox.Input` — the editable text field. */
export type ComboboxInputProps = ComponentProps<"input">;

/** Props for `Combobox.Content` — the popup listbox. */
export type ComboboxContentProps = ComponentProps<"div">;
