import type { ComponentProps } from "react";

/** The value carried from `Combobox.Root` to its parts. */
export interface ComboboxContextValue {
  /** Whether the popup listbox is open. */
  open: boolean;
  /** DOM id of the popup listbox, wired to the input's `aria-controls`. */
  listboxId: string;
  /** The text currently in the input — the live query while open. */
  query: string;
  /** Sets the query, opening the popup, as the user types. */
  setQuery: (query: string) => void;
}

/** Props for `Combobox.Root` — the wrapper that owns the combobox's state. */
export interface ComboboxRootProps extends ComponentProps<"div"> {
  /**
   * Whether the popup is open on first render, for the uncontrolled case.
   *
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Called with the input's text on every keystroke. Filtering is
   * consumer-owned: use this to narrow the options you render.
   */
  onQueryChange?: (query: string) => void;
}

/** Props for `Combobox.Input` — the editable text field. */
export type ComboboxInputProps = ComponentProps<"input">;

/** Props for `Combobox.Content` — the popup listbox. */
export type ComboboxContentProps = ComponentProps<"div">;
