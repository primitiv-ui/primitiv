import type { HTMLAttributes, ReactNode, Ref } from "react";

/**
 * Mode-independent props shared by every `Listbox.Root` variant. Combined
 * with a mode-specific arm to form {@link ListboxRootProps}.
 */
export type ListboxRootBaseProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue"
> & {
  /** When `true`, moving the cursor with the arrow / Home / End keys also
   * selects the option it lands on. */
  selectionFollowsFocus?: boolean;
  /** The {@link ListboxOptionProps | `Listbox.Option`} elements that make up
   * the list. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLDivElement`. */
  ref?: Ref<HTMLDivElement>;
};

/** Single-selection mode, uncontrolled. */
export type ListboxSingleUncontrolledProps = {
  /** Selects single-selection semantics: at most one option selected. */
  type: "single";
  /** Value of the option selected on first render. */
  defaultValue?: string;
  /** Forbidden in uncontrolled mode — use `defaultValue`. */
  value?: never;
  /** Called with the newly selected option's value. */
  onValueChange?: (value: string) => void;
};

/** Single-selection mode, controlled. */
export type ListboxSingleControlledProps = {
  /** Selects single-selection semantics: at most one option selected. */
  type: "single";
  /** The currently selected option's value. */
  value: string;
  /** Called with the newly selected option's value. */
  onValueChange?: (value: string) => void;
  /** Forbidden in controlled mode — use `value`. */
  defaultValue?: never;
};

/** Props for `Listbox.Root`. */
export type ListboxRootProps = ListboxRootBaseProps &
  (ListboxSingleUncontrolledProps | ListboxSingleControlledProps);

/** Props for `Listbox.Option`. */
export type ListboxOptionProps = HTMLAttributes<HTMLDivElement> & {
  /** Identifies this option within the listbox. */
  value: string;
  /** Removes the option from cursor navigation and from focus seeding, and
   * makes it unselectable. */
  disabled?: boolean;
  /** Forwarded to the underlying `HTMLDivElement`. */
  ref?: Ref<HTMLDivElement>;
};

/** Context shared from `Listbox.Root` to its options. */
export type ListboxContextValue = {
  selectedValues: string[];
  select: (optionValue: string) => void;
  activeValue: string | undefined;
  registerOption: (optionValue: string, element: HTMLElement | null) => void;
  getOptionId: (optionValue: string) => string;
};
