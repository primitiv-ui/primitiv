import { ComponentProps, ReactNode, Ref } from "react";

import { CheckedState } from "../Checkbox/types";
import { Direction } from "../DirectionProvider/index.ts";

/**
 * Shared base for both {@link DropdownRootProps} variants — `children` plus
 * the reading-direction control.
 */
export type DropdownRootBaseProps = {
  /**
   * The menu's sub-components — typically a single {@link DropdownTriggerProps |
   * `Dropdown.Trigger`} followed by a {@link DropdownContentProps |
   * `Dropdown.Content`}. Root renders no DOM of its own; it only provides
   * context to these descendants.
   */
  children?: ReactNode;
  /**
   * Reading direction for the menu. Affects which arrow key opens / closes
   * a submenu — `ArrowRight` opens in `"ltr"`, `ArrowLeft` opens in
   * `"rtl"`. Falls back to the inherited {@link DirectionProvider} value,
   * or to `"ltr"` if no provider is present.
   */
  dir?: Direction;
};

/**
 * Uncontrolled variant of {@link DropdownRootProps}: the component owns the
 * open state. Pass `defaultOpen` (or omit it); `onOpenChange` is optional
 * and `open` is forbidden.
 */
export type DropdownRootUncontrolledProps = DropdownRootBaseProps & {
  /**
   * Open state on first render. Omit to start closed. The component owns
   * the state thereafter.
   * @default false
   */
  defaultOpen?: boolean;
  /** Forbidden in uncontrolled mode — use `defaultOpen` instead. */
  open?: never;
  /**
   * Called whenever a user-driven transition opens or closes the menu
   * (trigger click, Escape, outside click, selection). Optional in
   * uncontrolled mode.
   */
  onOpenChange?: (open: boolean) => void;
};

/**
 * Controlled variant of {@link DropdownRootProps}: the parent owns the open
 * state. Pass `open` and `onOpenChange` together; `defaultOpen` is
 * forbidden.
 */
export type DropdownRootControlledProps = DropdownRootBaseProps & {
  /** Forbidden in controlled mode — use `open` instead. */
  defaultOpen?: never;
  /**
   * The current open state. Must be kept in sync by the parent via
   * `onOpenChange`; the component never mutates it internally.
   */
  open: boolean;
  /**
   * Called whenever a user-driven transition would open or close the menu.
   * The parent is responsible for reflecting the new value back into
   * `open`. Required in controlled mode.
   */
  onOpenChange: (open: boolean) => void;
};

/**
 * Props for {@link Dropdown.Root} — the controlled/uncontrolled discriminated
 * union pairing {@link DropdownRootUncontrolledProps} with
 * {@link DropdownRootControlledProps}, plus the shared `children` and `dir`.
 */
export type DropdownRootProps =
  | DropdownRootUncontrolledProps
  | DropdownRootControlledProps;

/**
 * Props for {@link Dropdown.Trigger} — the button that opens the menu. Extends
 * the native `<button>` props (minus the ARIA attributes Dropdown owns) and
 * adds `asChild` for rendering a custom element.
 */
export type DropdownTriggerProps = Omit<
  ComponentProps<"button">,
  "aria-haspopup" | "aria-expanded" | "aria-controls"
> & {
  /** The trigger's visible label (or an element, with `asChild`). */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLButtonElement`. */
  ref?: Ref<HTMLButtonElement>;
  /**
   * Render the composed child element instead of the default
   * `<button type="button">`. The trigger's ARIA contract
   * (`aria-haspopup`, `aria-expanded`, `aria-controls`) and its click
   * handler are merged onto the child via the {@link Slot} pattern.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Props for {@link Dropdown.Content} — the popover menu surface. Extends the
 * native `<menu>` props (minus the `role`/`popover`/`id` Dropdown manages) and
 * adds `asChild` for rendering a custom element.
 */
export type DropdownContentProps = Omit<
  ComponentProps<"menu">,
  "role" | "popover" | "id" | "ref"
> & {
  /**
   * The menu items — any mix of {@link DropdownItemProps | `Dropdown.Item`},
   * {@link DropdownCheckboxItemProps | `Dropdown.CheckboxItem`},
   * {@link DropdownRadioGroupProps | `Dropdown.RadioGroup`},
   * {@link DropdownGroupProps | `Dropdown.Group`},
   * {@link DropdownSeparatorProps | `Dropdown.Separator`}, and
   * {@link DropdownSubProps | `Dropdown.Sub`}.
   */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLMenuElement`. */
  ref?: Ref<HTMLMenuElement>;
  /**
   * Render the composed child element (with menu semantics) instead of the
   * default `<menu role="menu" popover="auto">`. The managed `role`,
   * `popover`, and `id` attributes and the keyboard handler are merged onto
   * the child via the {@link Slot} pattern.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Props for {@link Dropdown.Item} — a selectable menu item. Extends the native
 * `<li>` props and adds `disabled`, `asChild`, and an `onSelect` callback that
 * fires on activation (click, Enter, or Space).
 */
export type DropdownItemProps = Omit<
  ComponentProps<"li">,
  "role" | "tabIndex" | "onSelect"
> & {
  /** The item's visible content (or an element, with `asChild`). */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLLIElement`. */
  ref?: Ref<HTMLLIElement>;
  /**
   * Render the composed child element (with menuitem semantics) instead of
   * the default `<li role="menuitem">`.
   * @default false
   */
  asChild?: boolean;
  /**
   * Mark the item non-interactive. Sets `aria-disabled="true"` and skips
   * the item during arrow navigation, typeahead, and activation.
   * @default false
   */
  disabled?: boolean;
  /**
   * Fires when the item is activated (click, Enter, or Space). Called
   * with a cancellable event whose `preventDefault()` skips the auto-close
   * that Dropdown performs after selection.
   */
  onSelect?: (event: Event) => void;
};

/**
 * Props for {@link Dropdown.Separator} — a non-interactive divider between
 * groups of items. Extends the native `<li>` props and adds `asChild`.
 */
export type DropdownSeparatorProps = Omit<ComponentProps<"li">, "role"> & {
  /** Optional content; separators are usually empty. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLLIElement`. */
  ref?: Ref<HTMLLIElement>;
  /**
   * Render the composed child element (with separator semantics) instead of
   * the default `<li role="separator">`.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Props for {@link Dropdown.ItemIndicator} — the check/dot rendered inside a
 * checkbox or radio item. Extends the native `<span>` props and adds
 * `forceMount` to keep it mounted while unchecked for enter/exit animation.
 */
export type DropdownItemIndicatorProps = ComponentProps<"span"> & {
  /** The mark to render — commonly an SVG check or bullet icon. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLSpanElement`. */
  ref?: Ref<HTMLSpanElement>;
  /**
   * Render the composed child element instead of the default `<span>`.
   * @default false
   */
  asChild?: boolean;
  /**
   * Render the indicator even when its parent item is unchecked. The
   * `data-state` attribute still reflects the live state (`"checked"` /
   * `"unchecked"` / `"indeterminate"`), so consumers can animate the
   * indicator in and out instead of mounting / unmounting it.
   * @default false
   */
  forceMount?: boolean;
};

/**
 * Props for {@link Dropdown.Group} — a labelled grouping of related items.
 * Extends the native `<li>` props and adds `asChild`.
 */
export type DropdownGroupProps = Omit<ComponentProps<"li">, "role"> & {
  /**
   * The grouped items, optionally led by a {@link DropdownLabelProps |
   * `Dropdown.Label`} that names the group.
   */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLLIElement`. */
  ref?: Ref<HTMLLIElement>;
  /**
   * Render the composed child element (with `role="group"`) instead of the
   * default `<li role="group">` wrapping `<ul role="none">`.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Props for {@link Dropdown.Label} — an accessible label for a
 * {@link Dropdown.Group}. Extends the native `<li>` props and adds `asChild`.
 */
export type DropdownLabelProps = ComponentProps<"li"> & {
  /** The label text. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLLIElement`. */
  ref?: Ref<HTMLLIElement>;
  /**
   * Render the composed child element instead of the default `<li>`.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Shared base for both {@link DropdownCheckboxItemProps} variants — the native
 * `<li>` props plus `disabled`, `asChild`, and the `onSelect` callback.
 */
export type DropdownCheckboxItemBaseProps = Omit<
  ComponentProps<"li">,
  "role" | "tabIndex" | "aria-checked" | "defaultChecked" | "onSelect"
> & {
  /**
   * The item's content — typically a {@link DropdownItemIndicatorProps |
   * `Dropdown.ItemIndicator`} plus a text label.
   */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLLIElement`. */
  ref?: Ref<HTMLLIElement>;
  /**
   * Render the composed child element (with `role="menuitemcheckbox"`)
   * instead of the default `<li role="menuitemcheckbox">`.
   * @default false
   */
  asChild?: boolean;
  /**
   * Mark the item non-interactive. Sets `aria-disabled="true"`; activation
   * is a no-op.
   * @default false
   */
  disabled?: boolean;
  /**
   * Fires after activation toggles the checked state, with a cancellable
   * event. Call `event.preventDefault()` to keep the menu open after
   * toggling — useful for flipping several checkboxes in a row.
   */
  onSelect?: (event: Event) => void;
};

/**
 * Uncontrolled variant of {@link DropdownCheckboxItemProps}: the component owns
 * the checked state. Pass `defaultChecked` (or omit it); `onCheckedChange` is
 * optional and the controlled `checked` prop is forbidden.
 */
export type DropdownCheckboxItemUncontrolledProps =
  DropdownCheckboxItemBaseProps & {
    /**
     * Checked state on first render — `true`, `false`, or `"indeterminate"`
     * (rendered as `aria-checked="mixed"`). Omit to start unchecked.
     * @default false
     */
    defaultChecked?: CheckedState;
    /** Forbidden in uncontrolled mode — use `defaultChecked` instead. */
    checked?: never;
    /**
     * Called with the new boolean checked state whenever the user toggles
     * the item. Optional in uncontrolled mode.
     */
    onCheckedChange?: (checked: boolean) => void;
  };

/**
 * Controlled variant of {@link DropdownCheckboxItemProps}: the parent owns the
 * checked state. Pass `checked` and `onCheckedChange` together;
 * `defaultChecked` is forbidden.
 */
export type DropdownCheckboxItemControlledProps =
  DropdownCheckboxItemBaseProps & {
    /** Forbidden in controlled mode — use `checked` instead. */
    defaultChecked?: never;
    /**
     * The current checked state — `true`, `false`, or `"indeterminate"`.
     * Must be kept in sync by the parent via `onCheckedChange`. An
     * indeterminate value resolves to `true` on the next activation.
     */
    checked: CheckedState;
    /**
     * Called with the new boolean checked state whenever the user toggles
     * the item. Required in controlled mode.
     */
    onCheckedChange: (checked: boolean) => void;
  };

/**
 * Props for {@link Dropdown.CheckboxItem} — a togglable menu item. The
 * controlled/uncontrolled discriminated union pairing
 * {@link DropdownCheckboxItemUncontrolledProps} with
 * {@link DropdownCheckboxItemControlledProps}.
 */
export type DropdownCheckboxItemProps =
  | DropdownCheckboxItemUncontrolledProps
  | DropdownCheckboxItemControlledProps;

/**
 * Shared base for both {@link DropdownRadioGroupProps} variants — the native
 * `<li>` props (with the native ordinal `value` omitted so the controlled
 * variant can narrow it to a `string`) plus `asChild`.
 */
export type DropdownRadioGroupBaseProps = Omit<
  ComponentProps<"li">,
  "role" | "value" | "defaultValue"
> & {
  /**
   * The radio choices — a set of {@link DropdownRadioItemProps |
   * `Dropdown.RadioItem`} elements.
   */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLLIElement`. */
  ref?: Ref<HTMLLIElement>;
  /**
   * Render the composed child element (with `role="group"`) instead of the
   * default `<li role="group">` wrapping `<ul role="none">`.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Uncontrolled variant of {@link DropdownRadioGroupProps}: the component owns
 * the selected value. Pass `defaultValue` (or omit it); `onValueChange` is
 * optional and the controlled `value` prop is forbidden.
 */
export type DropdownRadioGroupUncontrolledProps =
  DropdownRadioGroupBaseProps & {
    /**
     * The item `value` selected on first render. Omit for no initial
     * selection.
     */
    defaultValue?: string;
    /** Forbidden in uncontrolled mode — use `defaultValue` instead. */
    value?: never;
    /**
     * Called with the newly selected item `value` whenever the user picks a
     * different radio item. Optional in uncontrolled mode.
     */
    onValueChange?: (value: string) => void;
  };

/**
 * Controlled variant of {@link DropdownRadioGroupProps}: the parent owns the
 * selected value. Pass `value` and `onValueChange` together; `defaultValue` is
 * forbidden.
 */
export type DropdownRadioGroupControlledProps = DropdownRadioGroupBaseProps & {
  /** Forbidden in controlled mode — use `value` instead. */
  defaultValue?: never;
  /**
   * The `value` of the currently selected {@link DropdownRadioItemProps |
   * `Dropdown.RadioItem`}. Must be kept in sync by the parent via
   * `onValueChange`.
   */
  value: string;
  /**
   * Called with the newly selected item `value` whenever the user picks a
   * different radio item. Required in controlled mode.
   */
  onValueChange: (value: string) => void;
};

/**
 * Props for {@link Dropdown.RadioGroup} — a single-select group of radio items.
 * The controlled/uncontrolled discriminated union pairing
 * {@link DropdownRadioGroupUncontrolledProps} with
 * {@link DropdownRadioGroupControlledProps}.
 */
export type DropdownRadioGroupProps =
  | DropdownRadioGroupUncontrolledProps
  | DropdownRadioGroupControlledProps;

/**
 * Props for {@link Dropdown.RadioItem} — one option within a
 * {@link Dropdown.RadioGroup}. Extends the native `<li>` props (with the
 * native ordinal `value` omitted so it can be narrowed to a required `string`)
 * and adds `value`, plus `disabled`, `asChild`, and `onSelect`.
 */
export type DropdownRadioItemProps = Omit<
  ComponentProps<"li">,
  "role" | "tabIndex" | "aria-checked" | "onSelect" | "value"
> & {
  /**
   * The item's content — typically a {@link DropdownItemIndicatorProps |
   * `Dropdown.ItemIndicator`} plus a text label.
   */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLLIElement`. */
  ref?: Ref<HTMLLIElement>;
  /**
   * Render the composed child element (with `role="menuitemradio"`) instead
   * of the default `<li role="menuitemradio">`.
   * @default false
   */
  asChild?: boolean;
  /**
   * Mark the item non-interactive. Sets `aria-disabled="true"`; activation
   * is a no-op.
   * @default false
   */
  disabled?: boolean;
  /**
   * This item's identifier within the enclosing
   * {@link DropdownRadioGroupProps | `Dropdown.RadioGroup`}. When it matches
   * the group's active value the item is checked. Required.
   */
  value: string;
  /**
   * Fires after activation selects this item, with a cancellable event.
   * Call `event.preventDefault()` to keep the menu open after selecting.
   */
  onSelect?: (event: Event) => void;
};

/**
 * Shared base for both {@link DropdownSubProps} variants — just the submenu
 * `children`.
 */
export type DropdownSubBaseProps = {
  /**
   * The submenu boundary's content — a {@link DropdownSubTriggerProps |
   * `Dropdown.SubTrigger`} and its sibling {@link DropdownSubContentProps |
   * `Dropdown.SubContent`}.
   */
  children?: ReactNode;
};

/**
 * Uncontrolled variant of {@link DropdownSubProps}: the component owns the
 * submenu open state. Pass `defaultOpen` (or omit it); `onOpenChange` is
 * optional and the controlled `open` prop is forbidden.
 */
export type DropdownSubUncontrolledProps = DropdownSubBaseProps & {
  /**
   * Submenu open state on first render. Omit to start closed.
   * @default false
   */
  defaultOpen?: boolean;
  /** Forbidden in uncontrolled mode — use `defaultOpen` instead. */
  open?: never;
  /**
   * Called whenever the submenu opens or closes. Optional in uncontrolled
   * mode.
   */
  onOpenChange?: (open: boolean) => void;
};

/**
 * Controlled variant of {@link DropdownSubProps}: the parent owns the submenu
 * open state. Pass `open` and `onOpenChange` together; `defaultOpen` is
 * forbidden.
 */
export type DropdownSubControlledProps = DropdownSubBaseProps & {
  /** Forbidden in controlled mode — use `open` instead. */
  defaultOpen?: never;
  /**
   * The current submenu open state. Must be kept in sync by the parent via
   * `onOpenChange`.
   */
  open: boolean;
  /**
   * Called whenever the submenu would open or close. The parent reflects
   * the new value back into `open`. Required in controlled mode.
   */
  onOpenChange: (open: boolean) => void;
};

/**
 * Props for {@link Dropdown.Sub} — the root of a nested submenu. The
 * controlled/uncontrolled discriminated union pairing
 * {@link DropdownSubUncontrolledProps} with {@link DropdownSubControlledProps}.
 */
export type DropdownSubProps =
  | DropdownSubUncontrolledProps
  | DropdownSubControlledProps;

/**
 * Props for {@link Dropdown.SubTrigger} — the item that opens a submenu.
 * Extends the native `<li>` props (minus the ARIA attributes Dropdown owns) and
 * adds `disabled` and `asChild`.
 */
export type DropdownSubTriggerProps = Omit<
  ComponentProps<"li">,
  "role" | "tabIndex" | "aria-haspopup" | "aria-expanded" | "aria-controls"
> & {
  /** The trigger's visible label (or an element, with `asChild`). */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLLIElement`. */
  ref?: Ref<HTMLLIElement>;
  /**
   * Render the composed child element (with menuitem + submenu-trigger
   * semantics) instead of the default `<li role="menuitem">`.
   * @default false
   */
  asChild?: boolean;
  /**
   * Mark the trigger non-interactive. Sets `aria-disabled="true"` and
   * ignores both click and the open arrow key.
   * @default false
   */
  disabled?: boolean;
};

/**
 * Props for {@link Dropdown.SubContent} — the popover surface of a submenu.
 * Extends the native `<menu>` props (minus the `role`/`popover`/`id` Dropdown
 * manages) and adds `asChild`.
 */
export type DropdownSubContentProps = Omit<
  ComponentProps<"menu">,
  "role" | "popover" | "id" | "ref"
> & {
  /** The submenu's items. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLMenuElement`. */
  ref?: Ref<HTMLMenuElement>;
  /**
   * Render the composed child element (with menu semantics) instead of the
   * default `<menu role="menu" popover="auto">`.
   * @default false
   */
  asChild?: boolean;
};
