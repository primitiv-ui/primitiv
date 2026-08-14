import type { ComponentProps, KeyboardEvent } from "react";

/** What a mounted `Combobox.Item` registers with the root. */
export interface ComboboxItemMeta {
  /** The rendered element, kept for future scroll-into-view work. */
  element: HTMLElement | null;
  /** The label to show in the input once this item is committed. */
  label: string;
}

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
  /**
   * Registers a mounted item so the arrow keys know the order and Enter can
   * resolve the same label a click would.
   */
  registerItem: (value: string, meta: ComboboxItemMeta | null) => void;
}

/** Props shared by every asChild-capable part. */
export interface ComboboxSlottableProps {
  /**
   * Render the consumer's own element instead of the default one, merging
   * behaviour onto it.
   *
   * @default false
   */
  asChild?: boolean;
}

/** Props for `Combobox.Root` — the wrapper that owns the combobox's state. */
export interface ComboboxRootProps extends ComponentProps<"div">, ComboboxSlottableProps {
  /**
   * Whether the popup is open on first render, for the uncontrolled case.
   *
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Whether the popup is open, for the controlled case. Pair with
   * {@link ComboboxRootProps.onOpenChange | `onOpenChange`} or it can never
   * change.
   *
   * @default undefined
   */
  open?: boolean;
  /**
   * Called when the combobox wants the popup opened or closed. Under a
   * controlled {@link ComboboxRootProps.open | `open`} the combobox only asks —
   * the parent decides.
   *
   * @default undefined
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * The selected value on first render, for the uncontrolled case.
   *
   * @default ""
   */
  defaultValue?: string;
  /**
   * The selected value, for the controlled case. Pair with
   * {@link ComboboxRootProps.onValueChange | `onValueChange`}.
   *
   * @default undefined
   */
  value?: string;
  /**
   * Called with the input's text on every keystroke. Filtering is
   * **consumer-owned** — narrow the options you render in response. The
   * component deliberately ships no `filter` prop.
   *
   * @default undefined
   */
  onQueryChange?: (query: string) => void;
  /**
   * Called with the newly selected value when the user commits a choice,
   * whether by click or by Enter.
   *
   * @default undefined
   */
  onValueChange?: (value: string) => void;
}

/** Props for `Combobox.Input` — the editable text field. */
export interface ComboboxInputProps extends ComponentProps<"input">, ComboboxSlottableProps {}

/** Props for `Combobox.Content` — the popup listbox. */
export interface ComboboxContentProps extends ComponentProps<"div">, ComboboxSlottableProps {}

/** Props for `Combobox.Item` — one selectable option in the popup. */
export interface ComboboxItemProps
  extends Omit<ComponentProps<"div">, "value">,
    ComboboxSlottableProps {
  /**
   * The value committed when this item is chosen. This narrows the native
   * `value` attribute, so `value` is `Omit`-ted from the base props above —
   * without that the two resolve to an intersection artifact that leaks into
   * consumer types and the generated prop tables.
   */
  value: string;
}

/** Props for `Combobox.Empty` — the no-results message inside the popup. */
export interface ComboboxEmptyProps extends ComponentProps<"div">, ComboboxSlottableProps {}
