import {
  ChangeEventHandler,
  ComponentProps,
  HTMLAttributes,
  ReactNode,
  Ref,
} from "react";

/**
 * Shared base for both {@link SelectRootProps} variants — the native
 * `<select>` attributes (minus the state-owning and multiple-selection
 * ones), the `asChild` escape hatch, and the raw `onChange` passthrough.
 */
export type SelectRootBaseProps = Omit<
  ComponentProps<"select">,
  "value" | "defaultValue" | "multiple" | "onChange"
> & {
  /** Content of the select — typically {@link SelectOption}, {@link SelectGroup},
   * and optionally a leading {@link SelectPlaceholder}. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLSelectElement`. */
  ref?: Ref<HTMLSelectElement>;
  /**
   * Native `change` handler. Fires alongside `onValueChange` whenever the
   * user picks a different option. Use this when you want the raw
   * `ChangeEvent` (e.g. to inspect `event.target.validity`).
   */
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  /**
   * When `true`, Root delegates to a single consumer-supplied element
   * (expected to render a `<select>`) and merges its own props onto it
   * via the {@link Slot} pattern. Placeholder-detection inside Root
   * walks direct children only in this mode, so the `asChild` +
   * placeholder combination requires the consumer to set
   * `defaultValue=""` explicitly.
   * @default false
   */
  asChild?: boolean;
  /**
   * Selects the render path:
   *
   * - `false` (the default) — the **rich** render path: a fully-styleable
   *   Popover-API listbox built from {@link SelectTrigger | `Select.Trigger`},
   *   {@link SelectValue | `Select.Value`},
   *   {@link SelectContent | `Select.Content`} and
   *   {@link SelectItem | `Select.Item`}. Icons and other rich content on an
   *   item render as authored.
   * - `true` — the **native** render path: a thin wrapper over a real
   *   `<select>` / `<option>` / `<optgroup>`, for flat, OS-native cases
   *   (mobile wheel pickers, maximum-compatibility forms). Under `native`,
   *   {@link SelectItem | `Select.Item`} renders an `<option>` from its
   *   string/number children only — element children (icons, indicators)
   *   are dropped.
   *
   * Both modes share the same `value` / `onValueChange` / `disabled` / form
   * `name` API.
   * @default false
   */
  native?: boolean;
  /**
   * Rich mode only — whether the listbox popover is open on first render.
   * Ignored under `native` (the browser owns the popup). Uncontrolled: pass
   * this (or omit for closed) and let the component manage the state.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Rich mode only — the controlled open state of the listbox popover. Pass
   * together with {@link SelectRootBaseProps.onOpenChange | `onOpenChange`}
   * to own the state from the parent.
   */
  open?: boolean;
  /**
   * Rich mode only — called with the next open state whenever the listbox
   * opens or closes (trigger click, selection, Escape, light-dismiss).
   */
  onOpenChange?: (open: boolean) => void;
};

/**
 * Uncontrolled variant of {@link SelectRootProps}: the browser owns the
 * selection. Pass `defaultValue` (or omit it); `onValueChange` is optional
 * and `value` is forbidden.
 */
export type SelectRootUncontrolledProps = SelectRootBaseProps & {
  /** Value of the option selected on first render. When omitted and a
   * {@link SelectPlaceholder} is present among Root's direct children,
   * Root infers `""` automatically so the placeholder is the initial
   * selection. */
  defaultValue?: string;
  /** Forbidden in uncontrolled mode — use `defaultValue` instead. */
  value?: never;
  /** Called with the new option value whenever the user changes the
   * selection. Optional in uncontrolled mode. */
  onValueChange?: (value: string) => void;
};

/**
 * Controlled variant of {@link SelectRootProps}: the parent owns the
 * selection. Pass `value` and `onValueChange` together; `defaultValue` is
 * forbidden.
 */
export type SelectRootControlledProps = SelectRootBaseProps & {
  /** Forbidden in controlled mode — use `value` instead. */
  defaultValue?: never;
  /** The currently selected option value. Must be kept in sync by the
   * parent via `onValueChange`. */
  value: string;
  /** Called with the new option value whenever the user changes the
   * selection. Required in controlled mode. */
  onValueChange: (value: string) => void;
};

/**
 * Props for {@link SelectRoot | `Select.Root`}.
 *
 * Resolves to either {@link SelectRootUncontrolledProps} or
 * {@link SelectRootControlledProps} — only one shape is accepted by
 * TypeScript at a time. Native `multiple`-selection mode is not supported
 * in v1.
 */
export type SelectRootProps =
  | SelectRootUncontrolledProps
  | SelectRootControlledProps;

/**
 * Props for {@link SelectItem | `Select.Item`}.
 *
 * `Select.Item` renders different elements per mode — an `<option>` under
 * `native`, a `<div role="option">` in rich mode — so it extends the
 * element-agnostic `HTMLAttributes<HTMLElement>` rather than an
 * option-specific type.
 */
export type SelectItemProps = HTMLAttributes<HTMLElement> & {
  /** The value this item represents; committed as the Select's value when
   * chosen, and matched against the current value for the selected state. */
  value: string;
  /** Marks the item unselectable while still visible. */
  disabled?: boolean;
  /** The item content. In `native` mode only its string/number parts are
   * kept as the `<option>` text (element children are dropped); in rich mode
   * arbitrary content (icons, indicators) renders as authored. */
  children?: ReactNode;
};

/**
 * Props for {@link SelectGroup | `Select.Group`} — all
 * `OptgroupHTMLAttributes` on the underlying `<optgroup>` element (with
 * `label` narrowed to a required `string`), plus a typed `ref`.
 */
export type SelectGroupProps = Omit<ComponentProps<"optgroup">, "label"> & {
  /**
   * The group heading shown by the browser as a non-selectable label above
   * the grouped options. Announced as the group's accessible name by
   * assistive technology. Required — an `<optgroup>` without a label is
   * inaccessible.
   */
  label: string;
  /** The {@link SelectOption} / {@link SelectPlaceholder} elements belonging
   * to this group. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLOptGroupElement`. */
  ref?: Ref<HTMLOptGroupElement>;
};

/**
 * Props for {@link SelectPlaceholder | `Select.Placeholder`}.
 *
 * `value`, `disabled`, and `hidden` are owned by the component —
 * the placeholder always renders with `value=""`, `disabled`, and `hidden`
 * — so they are excluded from this type and cannot be set by the consumer.
 */
export type SelectPlaceholderProps = Omit<
  ComponentProps<"option">,
  "value" | "disabled" | "hidden"
> & {
  /** The placeholder hint text shown in the closed select before the user
   * makes a selection (e.g. `"Choose a fruit…"`). */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLOptionElement`. */
  ref?: Ref<HTMLOptionElement>;
};

/**
 * Props for {@link SelectTrigger | `Select.Trigger`} — the rich-mode button
 * that opens the listbox. Extends the native `<button>` attributes.
 */
export type SelectTriggerProps = ComponentProps<"button"> & {
  /** Trigger content — typically a {@link SelectValue | `Select.Value`}. */
  children?: ReactNode;
  /**
   * Render the composed child element instead of a `<button>`, merging the
   * trigger's ARIA attributes and click handler via the {@link Slot}
   * pattern.
   * @default false
   */
  asChild?: boolean;
  /** Forwarded to the underlying `HTMLButtonElement`. */
  ref?: Ref<HTMLButtonElement>;
};

/**
 * Props for {@link SelectValue | `Select.Value`} — the rich-mode element,
 * placed inside {@link SelectTrigger | `Select.Trigger`}, that displays the
 * current selection (mirrored from the selected item in a later cycle) or a
 * placeholder when nothing is selected. Extends `<span>` attributes minus
 * `children`, which the component owns.
 */
export type SelectValueProps = Omit<ComponentProps<"span">, "children"> & {
  /** Shown when no value is selected (e.g. `"Select a framework…"`). */
  placeholder?: ReactNode;
  /** Forwarded to the underlying `HTMLSpanElement`. */
  ref?: Ref<HTMLSpanElement>;
};

/**
 * Props for {@link SelectItemIndicator | `Select.ItemIndicator`} — the
 * selection mark inside a rich {@link SelectItem | `Select.Item`}. Extends
 * the native `<span>` attributes.
 */
export type SelectItemIndicatorProps = ComponentProps<"span"> & {
  /** The mark to render (e.g. a checkmark glyph or icon). */
  children?: ReactNode;
  /**
   * Render the composed child element instead of a `<span>` via the
   * {@link Slot} pattern.
   * @default false
   */
  asChild?: boolean;
  /**
   * Keep the indicator mounted even when the item is not selected (it still
   * exposes `data-state="unchecked"`), useful for CSS enter/exit animation.
   * @default false
   */
  forceMount?: boolean;
  /** Forwarded to the underlying `HTMLSpanElement`. */
  ref?: Ref<HTMLSpanElement>;
};

/**
 * Props for {@link SelectContent | `Select.Content`} — the rich-mode
 * Popover-API listbox panel. Extends the native `<div>` attributes.
 */
export type SelectContentProps = ComponentProps<"div"> & {
  /** Listbox content — {@link SelectItem | `Select.Item`} /
   * {@link SelectGroup | `Select.Group`} elements. */
  children?: ReactNode;
  /**
   * Render the composed child element instead of a `<div>`, merging the
   * listbox props via the {@link Slot} pattern.
   * @default false
   */
  asChild?: boolean;
  /** Forwarded to the underlying `HTMLDivElement`. */
  ref?: Ref<HTMLDivElement>;
};
