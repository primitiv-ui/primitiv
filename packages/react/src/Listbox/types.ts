import type { HTMLAttributes, ReactNode, Ref } from "react";

/**
 * Mode-independent props shared by every `Listbox.Root` variant. Combined
 * with a mode-specific arm to form {@link ListboxRootProps}.
 */
export type ListboxRootBaseProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "dir"
> & {
  /** Layout axis for cursor navigation. `"vertical"` binds ArrowUp/ArrowDown;
   * `"horizontal"` binds ArrowLeft/ArrowRight. */
  orientation?: "horizontal" | "vertical";
  /** Reading direction. In `"rtl"` the horizontal arrow keys are mirrored.
   * Inherited from the nearest DirectionProvider when omitted. */
  dir?: "ltr" | "rtl";
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

/** Multiple-selection mode, uncontrolled. */
export type ListboxMultipleUncontrolledProps = {
  /** Selects multiple-selection semantics: options toggle independently. */
  type: "multiple";
  /** Values of the options selected on first render. */
  defaultValue?: string[];
  /** Forbidden in uncontrolled mode — use `defaultValue`. */
  value?: never;
  /** Called with the complete next set of selected values. */
  onValueChange?: (value: string[]) => void;
};

/** Multiple-selection mode, controlled. */
export type ListboxMultipleControlledProps = {
  /** Selects multiple-selection semantics: options toggle independently. */
  type: "multiple";
  /** The full set of currently selected values. */
  value: string[];
  /** Called with the complete next set of selected values. */
  onValueChange?: (value: string[]) => void;
  /** Forbidden in controlled mode — use `value`. */
  defaultValue?: never;
};

/** Props for `Listbox.Root`. */
export type ListboxRootProps = ListboxRootBaseProps &
  (
    | ListboxSingleUncontrolledProps
    | ListboxSingleControlledProps
    | ListboxMultipleUncontrolledProps
    | ListboxMultipleControlledProps
  );

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
  registerOption: (
    optionValue: string,
    element: HTMLElement | null,
    disabled?: boolean,
  ) => void;
  getOptionId: (optionValue: string) => string;
};
