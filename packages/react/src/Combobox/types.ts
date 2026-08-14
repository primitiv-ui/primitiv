import type { ComponentProps, KeyboardEvent } from "react";

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
  /** The selected value, or `""` when nothing is selected. */
  value: string;
  /** Commits a selection: sets the value, closes, and resets the input text. */
  select: (value: string, label: string) => void;
  /** The input's whole keydown behaviour: Escape, cursor seeding, arrow keys. */
  handleInputKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  /** The value the virtual-focus cursor sits on, or `null` for no cursor. */
  activeValue: string | null;
  /** Builds the DOM id for an item, so the input can point at it. */
  getItemId: (value: string) => string;
  /** Registers a mounted item so the arrow keys know the order. */
  registerItem: (value: string, element: HTMLElement | null) => void;
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
  /** Called with the newly selected value when the user commits a choice. */
  onValueChange?: (value: string) => void;
}

/** Props for `Combobox.Input` — the editable text field. */
export type ComboboxInputProps = ComponentProps<"input">;

/** Props for `Combobox.Content` — the popup listbox. */
export type ComboboxContentProps = ComponentProps<"div">;

/** Props for `Combobox.Item` — one selectable option in the popup. */
export interface ComboboxItemProps extends Omit<ComponentProps<"div">, "value"> {
  /** The value committed when this item is chosen. */
  value: string;
}
