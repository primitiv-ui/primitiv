import { ComponentProps, ReactNode, Ref } from "react";

import { CheckedState } from "../Checkbox/types";
import { Direction } from "../DirectionProvider/index.ts";

/**
 * Shared base for both {@link ContextMenuRootProps} variants — `children`
 * plus the reading-direction control.
 */
export type ContextMenuRootBaseProps = {
  /** The {@link ContextMenu.Trigger} and {@link ContextMenu.Content} pair
   * (Root renders no wrapping element of its own). */
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
 * Uncontrolled variant of {@link ContextMenuRootProps}: the component owns
 * the open state. Pass `defaultOpen` (or omit it); `onOpenChange` is
 * optional and `open` is forbidden.
 */
export type ContextMenuRootUncontrolledProps = ContextMenuRootBaseProps & {
  /** Whether the menu is open on first render.
   * @default false */
  defaultOpen?: boolean;
  /** Forbidden in uncontrolled mode — use `defaultOpen` instead. */
  open?: never;
  /** Observes open-state transitions. Fires only on user-driven changes
   * (right-click, Escape, selection, outside click), never on external
   * flips. Optional in uncontrolled mode. */
  onOpenChange?: (open: boolean) => void;
};

/**
 * Controlled variant of {@link ContextMenuRootProps}: the parent owns the
 * open state. Pass `open` and `onOpenChange` together; `defaultOpen` is
 * forbidden.
 */
export type ContextMenuRootControlledProps = ContextMenuRootBaseProps & {
  /** Forbidden in controlled mode — use `open` instead. */
  defaultOpen?: never;
  /** Whether the menu is open. Must be kept in sync by the parent via
   * `onOpenChange`. */
  open: boolean;
  /** Called with the requested open state on each user-driven transition.
   * Required in controlled mode. */
  onOpenChange: (open: boolean) => void;
};

/**
 * Props for {@link ContextMenu.Root} — the open-state owner and
 * direction provider. A discriminated union of the uncontrolled
 * ({@link ContextMenuRootUncontrolledProps}) and controlled
 * ({@link ContextMenuRootControlledProps}) variants.
 */
export type ContextMenuRootProps =
  | ContextMenuRootUncontrolledProps
  | ContextMenuRootControlledProps;

/**
 * Props for {@link ContextMenu.Trigger} — the `<span>` whose right-click
 * (context menu) gesture opens the menu. Supports `asChild` to merge
 * onto a custom element and `disabled` to suppress the gesture.
 */
export type ContextMenuTriggerProps = ComponentProps<"span"> & {
  /** The content the right-click gesture is bound to. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLSpanElement` (or the `asChild` host). */
  ref?: Ref<HTMLSpanElement>;
  /** Render the child element instead of the default `<span>`, merging the
   * trigger's `contextmenu` handler and data-attributes onto it via the
   * {@link Slot} pattern. The child must accept a `ref`.
   * @default false */
  asChild?: boolean;
  /** When `true`, the trigger ignores the `contextmenu` gesture entirely,
   * letting the native browser menu through. Exposed as `data-disabled=""`.
   * @default false */
  disabled?: boolean;
};

/**
 * Props for {@link ContextMenu.Content} — the `<menu>` popover holding the
 * menu items. The managed `role`, `popover`, and `id` attributes are
 * omitted; `asChild` merges the props onto a custom element.
 */
export type ContextMenuContentProps = Omit<
  ComponentProps<"menu">,
  "role" | "popover" | "id" | "ref"
> & {
  /** The menu items — {@link ContextMenuItem}, {@link ContextMenuGroup},
   * {@link ContextMenuSub}, and friends. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLMenuElement` (or the `asChild` host). */
  ref?: Ref<HTMLMenuElement>;
  /** Render the child element instead of the default `<menu>`, merging the
   * managed `role` / `popover` / positioning props and the keyboard handler
   * onto it via the {@link Slot} pattern.
   * @default false */
  asChild?: boolean;
};

/**
 * Props for {@link ContextMenu.Item} — a selectable `<li>` menu item. The
 * managed `role`, `tabIndex`, and `onSelect` are omitted from the host
 * props; `disabled` skips activation and `onSelect` fires on activation.
 */
export type ContextMenuItemProps = Omit<
  ComponentProps<"li">,
  "role" | "tabIndex" | "onSelect"
> & {
  /** The item's visible content. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLLIElement` (or the `asChild` host). */
  ref?: Ref<HTMLLIElement>;
  /** Render the child element instead of the default `<li role="menuitem">`,
   * merging the item's props onto it via the {@link Slot} pattern (e.g. to
   * render a menu item as an `<a>`).
   * @default false */
  asChild?: boolean;
  /** Removes the item from activation and marks it `aria-disabled`; it
   * still renders for assistive technology but no-ops on click / Enter, and
   * arrow navigation and typeahead skip it.
   * @default false */
  disabled?: boolean;
  /**
   * Fires when the item is activated (click, Enter, or Space). Called
   * with an event whose `preventDefault()` skips the auto-close that
   * ContextMenu performs after selection.
   */
  onSelect?: (event: Event) => void;
};

/**
 * Props for {@link ContextMenu.Separator} — a non-interactive `<li>`
 * divider between groups of items. The managed `role` is omitted;
 * `asChild` merges the props onto a custom element.
 */
export type ContextMenuSeparatorProps = Omit<ComponentProps<"li">, "role"> & {
  /** Usually empty — a separator renders no content by default. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLLIElement` (or the `asChild` host). */
  ref?: Ref<HTMLLIElement>;
  /** Render the child element instead of the default
   * `<li role="separator">`, merging the managed `role` onto it via the
   * {@link Slot} pattern.
   * @default false */
  asChild?: boolean;
};

/**
 * Props for {@link ContextMenu.Group} — an `<li>` that groups related
 * items, optionally labelled by a {@link ContextMenu.Label}. The managed
 * `role` is omitted; `asChild` merges the props onto a custom element.
 */
export type ContextMenuGroupProps = Omit<ComponentProps<"li">, "role"> & {
  /** The grouped items, optionally led by a {@link ContextMenu.Label}. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLLIElement` (or the `asChild` host). */
  ref?: Ref<HTMLLIElement>;
  /** Render the child element instead of the default `<li role="group">`
   * (which otherwise wraps an inner `<ul role="none">`), merging the group's
   * props onto it via the {@link Slot} pattern.
   * @default false */
  asChild?: boolean;
};

/**
 * Props for {@link ContextMenu.Label} — a non-interactive `<li>` caption
 * for a {@link ContextMenu.Group}. Supports `asChild` to merge the props
 * onto a custom element.
 */
export type ContextMenuLabelProps = ComponentProps<"li"> & {
  /** The label text. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLLIElement` (or the `asChild` host). */
  ref?: Ref<HTMLLIElement>;
  /** Render the child element instead of the default `<li>`, merging the
   * (auto-wired) `id` onto it via the {@link Slot} pattern.
   * @default false */
  asChild?: boolean;
};

/**
 * Shared base for both {@link ContextMenuCheckboxItemProps} variants —
 * the `<li>` host props plus `children`, `ref`, `asChild`, `disabled`,
 * and `onSelect`. The managed `role`, `tabIndex`, `aria-checked`,
 * `defaultChecked`, and `onSelect` host attributes are omitted.
 */
export type ContextMenuCheckboxItemBaseProps = Omit<
  ComponentProps<"li">,
  "role" | "tabIndex" | "aria-checked" | "defaultChecked" | "onSelect"
> & {
  /** The item's visible content, typically including a
   * {@link ContextMenuItemIndicator}. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLLIElement` (or the `asChild` host). */
  ref?: Ref<HTMLLIElement>;
  /** Render the child element instead of the default
   * `<li role="menuitemcheckbox">`, merging the item's props onto it via
   * the {@link Slot} pattern.
   * @default false */
  asChild?: boolean;
  /** Removes the item from activation and marks it `aria-disabled`; it
   * still renders for assistive technology but no-ops on click / Enter.
   * @default false */
  disabled?: boolean;
  /**
   * Fires when activation completes and the auto-close fires. Call
   * `event.preventDefault()` to keep the menu open after toggling.
   */
  onSelect?: (event: Event) => void;
};

/**
 * Uncontrolled variant of {@link ContextMenuCheckboxItemProps}: the
 * component owns the checked state. Pass `defaultChecked` (or omit it);
 * `onCheckedChange` is optional and the controlled `checked` prop is
 * forbidden.
 */
export type ContextMenuCheckboxItemUncontrolledProps =
  ContextMenuCheckboxItemBaseProps & {
    /** Checked state on first render. Accepts the tri-state
     * {@link CheckedState} (`true` / `false` / `"indeterminate"`).
     * @default false */
    defaultChecked?: CheckedState;
    /** Forbidden in uncontrolled mode — use `defaultChecked` instead. */
    checked?: never;
    /** Called with the resolved boolean checked state on each toggle.
     * Optional in uncontrolled mode. */
    onCheckedChange?: (checked: boolean) => void;
  };

/**
 * Controlled variant of {@link ContextMenuCheckboxItemProps}: the parent
 * owns the checked state. Pass `checked` and `onCheckedChange` together;
 * `defaultChecked` is forbidden.
 */
export type ContextMenuCheckboxItemControlledProps =
  ContextMenuCheckboxItemBaseProps & {
    /** Forbidden in controlled mode — use `checked` instead. */
    defaultChecked?: never;
    /** The current checked state. Accepts the tri-state {@link CheckedState}
     * (`true` / `false` / `"indeterminate"`, the last rendered as
     * `aria-checked="mixed"`). Must be kept in sync via `onCheckedChange`. */
    checked: CheckedState;
    /** Called with the resolved boolean checked state on each toggle.
     * Required in controlled mode. */
    onCheckedChange: (checked: boolean) => void;
  };

/**
 * Props for {@link ContextMenu.CheckboxItem} — a toggleable menu item. A
 * discriminated union of the uncontrolled
 * ({@link ContextMenuCheckboxItemUncontrolledProps}) and controlled
 * ({@link ContextMenuCheckboxItemControlledProps}) variants.
 */
export type ContextMenuCheckboxItemProps =
  | ContextMenuCheckboxItemUncontrolledProps
  | ContextMenuCheckboxItemControlledProps;

/**
 * Props for {@link ContextMenu.ItemIndicator} — the `<span>` that renders
 * inside a checkbox or radio item to show its checked state. Set
 * `forceMount` to render even when unchecked; `asChild` merges the props
 * onto a custom element.
 */
export type ContextMenuItemIndicatorProps = ComponentProps<"span"> & {
  /** The mark to show — usually a checkmark or radio-dot icon. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLSpanElement` (or the `asChild` host). */
  ref?: Ref<HTMLSpanElement>;
  /** Render the child element instead of the default `<span>`, merging the
   * `data-state` attribute onto it via the {@link Slot} pattern (e.g. to
   * compose onto an SVG icon).
   * @default false */
  asChild?: boolean;
  /**
   * Render the indicator even when its parent item is unchecked. The
   * `data-state` attribute still reflects the live state.
   * @default false
   */
  forceMount?: boolean;
};

/**
 * Shared base for both {@link ContextMenuRadioGroupProps} variants — the
 * `<li>` host props plus `children`, `ref`, and `asChild`. The managed
 * `role` host attribute is omitted, along with the native `<li>` `value`
 * and `defaultValue` attributes: the variants below re-declare both as the
 * radio-group's selection state (`string`), narrowing the native
 * `string | number | readonly string[]`. They must be `Omit`-ted here or
 * the docs-data extractor silently drops the narrowed declaration (the
 * §1.16 narrow-without-omit rule).
 */
export type ContextMenuRadioGroupBaseProps = Omit<
  ComponentProps<"li">,
  "role" | "value" | "defaultValue"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  /** Render the child element instead of the default `<li role="group">`,
   * merging the group's props onto it via the {@link Slot} pattern.
   * @default false */
  asChild?: boolean;
};

/**
 * Uncontrolled variant of {@link ContextMenuRadioGroupProps}: the
 * component owns the selected-value state. Pass `defaultValue` (or omit
 * it); `onValueChange` is optional and the controlled `value` prop is
 * forbidden.
 */
export type ContextMenuRadioGroupUncontrolledProps =
  ContextMenuRadioGroupBaseProps & {
    /** Value of the {@link ContextMenuRadioItem} selected on first render. */
    defaultValue?: string;
    /** Forbidden in uncontrolled mode — use `defaultValue` instead. */
    value?: never;
    /** Called with the newly-selected item's `value` on each change.
     * Optional in uncontrolled mode. */
    onValueChange?: (value: string) => void;
  };

/**
 * Controlled variant of {@link ContextMenuRadioGroupProps}: the parent
 * owns the selected-value state. Pass `value` and `onValueChange`
 * together; `defaultValue` is forbidden.
 */
export type ContextMenuRadioGroupControlledProps =
  ContextMenuRadioGroupBaseProps & {
    /** Forbidden in controlled mode — use `value` instead. */
    defaultValue?: never;
    /** The `value` of the currently-selected {@link ContextMenuRadioItem}.
     * Must be kept in sync by the parent via `onValueChange`. */
    value: string;
    /** Called with the newly-selected item's `value` on each change.
     * Required in controlled mode. */
    onValueChange: (value: string) => void;
  };

/**
 * Props for {@link ContextMenu.RadioGroup} — the container that tracks
 * which {@link ContextMenu.RadioItem} is selected. A discriminated union
 * of the uncontrolled ({@link ContextMenuRadioGroupUncontrolledProps})
 * and controlled ({@link ContextMenuRadioGroupControlledProps}) variants.
 */
export type ContextMenuRadioGroupProps =
  | ContextMenuRadioGroupUncontrolledProps
  | ContextMenuRadioGroupControlledProps;

/**
 * Props for {@link ContextMenu.RadioItem} — a mutually-exclusive choice
 * within a {@link ContextMenu.RadioGroup}, identified by its required
 * `value`. The managed `role`, `tabIndex`, `aria-checked`, and `onSelect`
 * host attributes are omitted, as is the native `<li>` `value` attribute:
 * the required `value: string` below narrows it (from the native
 * `string | number | readonly string[]`), so it must be `Omit`-ted or the
 * docs-data extractor silently drops it (the §1.16 narrow-without-omit
 * rule).
 */
export type ContextMenuRadioItemProps = Omit<
  ComponentProps<"li">,
  "role" | "tabIndex" | "aria-checked" | "onSelect" | "value"
> & {
  children?: ReactNode;
  ref?: Ref<HTMLLIElement>;
  /** Render the child element instead of the default `<li role="menuitemradio">`,
   * merging the item's props onto it via the {@link Slot} pattern.
   * @default false */
  asChild?: boolean;
  /** Removes the item from activation and marks it `aria-disabled`; it
   * still renders for assistive technology but no-ops on click / Enter.
   * @default false */
  disabled?: boolean;
  /** Identifies this choice within the enclosing
   * {@link ContextMenuRadioGroup}. When it matches the group's active
   * value, the item is checked. */
  value: string;
  /** Fires when the item is activated (click, Enter, or Space). Call
   * `event.preventDefault()` to skip the auto-close after selection. */
  onSelect?: (event: Event) => void;
};

/**
 * Shared base for both {@link ContextMenuSubProps} variants — just the
 * `children` of the submenu.
 */
export type ContextMenuSubBaseProps = {
  /** The {@link ContextMenu.SubTrigger} and {@link ContextMenu.SubContent}
   * pair (Sub renders no wrapping element of its own). */
  children?: ReactNode;
};

/**
 * Uncontrolled variant of {@link ContextMenuSubProps}: the component owns
 * the submenu open state. Pass `defaultOpen` (or omit it); `onOpenChange`
 * is optional and the controlled `open` prop is forbidden.
 */
export type ContextMenuSubUncontrolledProps = ContextMenuSubBaseProps & {
  /** Whether the submenu is open on first render.
   * @default false */
  defaultOpen?: boolean;
  /** Forbidden in uncontrolled mode — use `defaultOpen` instead. */
  open?: never;
  /** Observes submenu open-state transitions. Optional in uncontrolled mode. */
  onOpenChange?: (open: boolean) => void;
};

/**
 * Controlled variant of {@link ContextMenuSubProps}: the parent owns the
 * submenu open state. Pass `open` and `onOpenChange` together;
 * `defaultOpen` is forbidden.
 */
export type ContextMenuSubControlledProps = ContextMenuSubBaseProps & {
  /** Forbidden in controlled mode — use `open` instead. */
  defaultOpen?: never;
  /** Whether the submenu is open. Must be kept in sync via `onOpenChange`. */
  open: boolean;
  /** Called with the requested open state on each transition.
   * Required in controlled mode. */
  onOpenChange: (open: boolean) => void;
};

/**
 * Props for {@link ContextMenu.Sub} — a nested submenu's open-state
 * owner. A discriminated union of the uncontrolled
 * ({@link ContextMenuSubUncontrolledProps}) and controlled
 * ({@link ContextMenuSubControlledProps}) variants.
 */
export type ContextMenuSubProps =
  | ContextMenuSubUncontrolledProps
  | ContextMenuSubControlledProps;

/**
 * Props for {@link ContextMenu.SubTrigger} — the `<li>` that opens its
 * parent {@link ContextMenu.Sub} on hover or arrow key. The managed
 * `role`, `tabIndex`, `aria-haspopup`, `aria-expanded`, and
 * `aria-controls` host attributes are omitted; `disabled` suppresses it.
 */
export type ContextMenuSubTriggerProps = Omit<
  ComponentProps<"li">,
  "role" | "tabIndex" | "aria-haspopup" | "aria-expanded" | "aria-controls"
> & {
  /** The trigger's visible content (typically the submenu's name). */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLLIElement` (or the `asChild` host). */
  ref?: Ref<HTMLLIElement>;
  /** Render the child element instead of the default
   * `<li role="menuitem">`, merging the submenu-wiring ARIA and handlers
   * onto it via the {@link Slot} pattern.
   * @default false */
  asChild?: boolean;
  /** When `true`, the trigger refuses to open the submenu on both click
   * and the inline-forward arrow key, and is marked `aria-disabled`.
   * @default false */
  disabled?: boolean;
};

/**
 * Props for {@link ContextMenu.SubContent} — the `<menu>` popover for a
 * nested submenu's items. The managed `role`, `popover`, and `id`
 * attributes are omitted; `asChild` merges the props onto a custom
 * element.
 */
export type ContextMenuSubContentProps = Omit<
  ComponentProps<"menu">,
  "role" | "popover" | "id" | "ref"
> & {
  /** The submenu's items. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLMenuElement` (or the `asChild` host). */
  ref?: Ref<HTMLMenuElement>;
  /** Render the child element instead of the default `<menu>`, merging the
   * managed `role` / `popover` / `id` and the keyboard handler onto it via
   * the {@link Slot} pattern.
   * @default false */
  asChild?: boolean;
};
