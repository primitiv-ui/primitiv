import type { HTMLAttributes, ReactNode, Ref } from "react";

/**
 * Mode-independent props shared by every `Listbox.Root` variant — orientation,
 * direction, selection-follows-focus, `asChild`, children, and the ref.
 * Combined with a mode-specific arm to form {@link ListboxRootProps}.
 */
export type ListboxRootBaseProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "dir"
> & {
  /** Layout axis for cursor navigation. `"vertical"` binds ArrowUp/ArrowDown;
   * `"horizontal"` binds ArrowLeft/ArrowRight and additionally emits
   * `aria-orientation="horizontal"` (vertical is the ARIA default, so it is
   * left implicit). Surfaces as `data-orientation` for styling; it does not
   * itself apply any layout.
   * @default "vertical" */
  orientation?: "horizontal" | "vertical";
  /** Reading direction. In `"rtl"` the horizontal arrow pair is mirrored so
   * the cursor follows visual order — meaningful only when
   * {@link ListboxRootBaseProps.orientation} is `"horizontal"`. Inherited from
   * the nearest {@link DirectionProvider} when omitted, falling back to
   * `"ltr"`. */
  dir?: "ltr" | "rtl";
  /** When `true`, moving the cursor with the arrow / Home / End keys or via
   * typeahead also selects the option it lands on — the behaviour of APG's
   * single-select listbox example. Left `false`, arrowing only moves the
   * highlight and the user commits with Enter or Space, which is what a
   * command palette or search-suggestion list needs.
   * @default false */
  selectionFollowsFocus?: boolean;
  /** Render a single consumer-supplied element in place of the native `<div>`,
   * with the listbox's `role`, `tabIndex`, ARIA state, `data-orientation`, ref
   * and keyboard handlers merged onto it via the {@link Slot} pattern.
   * @default false */
  asChild?: boolean;
  /** The {@link ListboxOptionProps | `Listbox.Option`} and
   * {@link ListboxGroupProps | `Listbox.Group`} elements that make up the
   * list. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLDivElement`. */
  ref?: Ref<HTMLDivElement>;
};

/**
 * Single-selection mode, uncontrolled — at most one option selected, with the
 * initial choice supplied via `defaultValue`.
 */
export type ListboxSingleUncontrolledProps = {
  /** Selects single-selection semantics: at most one option selected at a
   * time, and re-selecting the current option is a no-op rather than a
   * deselect. */
  type: "single";
  /** Value of the option selected on first render. Omit to start with nothing
   * selected. */
  defaultValue?: string;
  /** Forbidden in uncontrolled mode — use
   * {@link ListboxSingleUncontrolledProps.defaultValue}. */
  value?: never;
  /** Called with the newly selected option's value whenever the user commits a
   * choice. */
  onValueChange?: (value: string) => void;
};

/**
 * Single-selection mode, controlled — the selected value is owned by the
 * caller via `value` / `onValueChange`.
 */
export type ListboxSingleControlledProps = {
  /** Selects single-selection semantics: at most one option selected at a
   * time, and re-selecting the current option is a no-op rather than a
   * deselect. */
  type: "single";
  /** The currently selected option's value. Must be kept in sync by the caller
   * via {@link ListboxSingleControlledProps.onValueChange}. */
  value: string;
  /** Called with the value the user is asking to select. */
  onValueChange?: (value: string) => void;
  /** Forbidden in controlled mode — use
   * {@link ListboxSingleControlledProps.value}. */
  defaultValue?: never;
};

/**
 * Multiple-selection mode, uncontrolled — options toggle independently, with
 * the initial set supplied via `defaultValue`.
 */
export type ListboxMultipleUncontrolledProps = {
  /** Selects multiple-selection semantics: any number of options can be
   * selected and each toggles independently. Sets `aria-multiselectable` on
   * the root. */
  type: "multiple";
  /** Values of the options selected on first render. Omit to start with
   * nothing selected. */
  defaultValue?: string[];
  /** Forbidden in uncontrolled mode — use
   * {@link ListboxMultipleUncontrolledProps.defaultValue}. */
  value?: never;
  /** Called with the complete next set of selected values whenever the user
   * toggles any option. */
  onValueChange?: (value: string[]) => void;
};

/**
 * Multiple-selection mode, controlled — the set of selected values is owned by
 * the caller via `value` / `onValueChange`.
 */
export type ListboxMultipleControlledProps = {
  /** Selects multiple-selection semantics: any number of options can be
   * selected and each toggles independently. Sets `aria-multiselectable` on
   * the root. */
  type: "multiple";
  /** The full set of currently selected values. Must be kept in sync by the
   * caller via {@link ListboxMultipleControlledProps.onValueChange}. */
  value: string[];
  /** Called with the complete next set of selected values whenever the user
   * toggles any option. */
  onValueChange?: (value: string[]) => void;
  /** Forbidden in controlled mode — use
   * {@link ListboxMultipleControlledProps.value}. */
  defaultValue?: never;
};

/**
 * Props for {@link ListboxRoot | `Listbox.Root`}. Combines the shared
 * {@link ListboxRootBaseProps} with one mode-specific arm — single or
 * multiple, controlled or uncontrolled — so the `value` / `defaultValue` /
 * `onValueChange` shape is enforced per `type`.
 */
export type ListboxRootProps = ListboxRootBaseProps &
  (
    | ListboxSingleUncontrolledProps
    | ListboxSingleControlledProps
    | ListboxMultipleUncontrolledProps
    | ListboxMultipleControlledProps
  );

/**
 * Props for {@link ListboxOption | `Listbox.Option`} — one selectable choice.
 * `value` identifies it within the listbox; `children` supplies the label that
 * typeahead matches against.
 */
export type ListboxOptionProps = HTMLAttributes<HTMLDivElement> & {
  /** Identifies this option within the listbox. It is this string — not the
   * visible label — that is compared against the root's selected `value` /
   * `defaultValue`; use `children` for the label. */
  value: string;
  /** Removes the option from cursor navigation, focus seeding and typeahead,
   * and makes it unselectable by click or key. The option stays in the DOM and
   * in the accessibility tree, marked `aria-disabled`. Also sets
   * `data-disabled=""` for CSS targeting.
   * @default false */
  disabled?: boolean;
  /** Render a single consumer-supplied element in place of the native `<div>`,
   * with the option's `role`, `id`, `aria-selected`, `data-highlighted` and
   * click handler merged onto it via the {@link Slot} pattern. The child must
   * accept a `ref`.
   * @default false */
  asChild?: boolean;
  /** Forwarded to the underlying `HTMLDivElement`. */
  ref?: Ref<HTMLDivElement>;
};

/**
 * Props for {@link ListboxGroup | `Listbox.Group`} — a named cluster of
 * options. Grouping is presentational; it does not partition navigation.
 */
export type ListboxGroupProps = HTMLAttributes<HTMLDivElement> & {
  /** Accessible name for the group, applied as `aria-label`. APG requires
   * every option group to carry a name — supply it either with this prop (an
   * invisible name) or by rendering a
   * {@link ListboxGroupLabelProps | `Listbox.GroupLabel`} heading inside the
   * group, which names it via `aria-labelledby` instead. A rendered
   * `GroupLabel` takes precedence. */
  label?: string;
  /** Render a single consumer-supplied element in place of the native `<div>`,
   * with the group's `role` and `aria-label` merged onto it via the
   * {@link Slot} pattern.
   * @default false */
  asChild?: boolean;
  /** Forwarded to the underlying `HTMLDivElement`. */
  ref?: Ref<HTMLDivElement>;
};

/**
 * Props for {@link ListboxGroupLabel | `Listbox.GroupLabel`} — the visible
 * heading that names its enclosing {@link ListboxGroup | `Listbox.Group`}.
 */
export type ListboxGroupLabelProps = HTMLAttributes<HTMLDivElement> & {
  /** Render a single consumer-supplied element in place of the native
   * `<div>`, with the heading's `id` and `role="presentation"` merged onto it
   * via the {@link Slot} pattern.
   * @default false */
  asChild?: boolean;
  /** Forwarded to the underlying `HTMLDivElement`. */
  ref?: Ref<HTMLDivElement>;
};

/**
 * Context shared from {@link ListboxGroup | `Listbox.Group`} to its label —
 * the id the heading must adopt so the group can point `aria-labelledby` at
 * it, and the registrar telling the group a heading is present.
 */
export type ListboxGroupContextValue = {
  /** The DOM id the {@link ListboxGroupLabel} must render with. */
  labelId: string;
  /** Called by the label on mount/unmount so the group knows whether to emit
   * `aria-labelledby`. */
  registerLabel: (present: boolean) => void;
};

/**
 * Context shared from {@link ListboxRoot | `Listbox.Root`} to its options —
 * the selected set, the select action, the virtual-focus cursor, option
 * registration, and the id derivation that wires `aria-activedescendant` to
 * each option's `id`.
 */
export type ListboxContextValue = {
  /** Every currently selected option value. Single mode holds at most one. */
  selectedValues: string[];
  /** Selects (single) or toggles (multiple) the given option. */
  select: (optionValue: string) => void;
  /** The option the cursor is on, or `undefined` before the root is focused. */
  activeValue: string | undefined;
  /** Moves the cursor onto the given option and scrolls it into view. Used by
   * `Listbox.Option` so a click leaves the cursor where the user clicked. */
  moveCursor: (optionValue: string) => void;
  /** Registers a mounted option's element and disabled state; pass `null` as
   * the element to unregister. */
  registerOption: (
    optionValue: string,
    element: HTMLElement | null,
    disabled?: boolean,
  ) => void;
  /** Derives the stable DOM `id` for an option, shared by the option itself
   * and the root's `aria-activedescendant`. */
  getOptionId: (optionValue: string) => string;
};
