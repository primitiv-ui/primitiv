import { useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";

import { useCheckboxRoot } from "../Checkbox/hooks/index.ts";
import { useDirection } from "../DirectionProvider/index.ts";
import { useRadioGroupRoot } from "../RadioGroup/hooks/index.ts";
import { composeEventHandlers, Slot } from "../Slot/index.ts";

import { DropdownContext } from "./DropdownContext";
import { DropdownContentContext } from "./DropdownContentContext";
import { DropdownGroupContext } from "./DropdownGroupContext";
import { DropdownItemIndicatorContext } from "./DropdownItemIndicatorContext";
import { DropdownRadioGroupContext } from "./DropdownRadioGroupContext";
import { DropdownSubContext } from "./DropdownSubContext";
import {
  useCloseSiblingSub,
  useDropdownContent,
  useDropdownContext,
  useDropdownGroup,
  useDropdownItem,
  useDropdownLabel,
  useDropdownRoot,
  useDropdownSubContext,
  useDropdownTrigger,
} from "./hooks/index.ts";
import {
  DropdownCheckboxItemProps,
  DropdownContentProps,
  DropdownGroupProps,
  DropdownItemIndicatorProps,
  DropdownItemProps,
  DropdownLabelProps,
  DropdownRadioGroupProps,
  DropdownRadioItemProps,
  DropdownRootProps,
  DropdownSeparatorProps,
  DropdownSubContentProps,
  DropdownSubProps,
  DropdownSubTriggerProps,
  DropdownTriggerProps,
} from "./types";
import { MENUITEM_SELECTOR } from "./constants";

/**
 * The root of a Dropdown menu — owns the open state and provides context to
 * descendants. Renders no DOM of its own; it is a context boundary.
 *
 * Supports two state modes, statically discriminated at the type level so
 * only one shape is accepted by TypeScript:
 *
 * - **Uncontrolled** — pass {@link DropdownRootProps.defaultOpen | `defaultOpen`}
 *   (or omit it to start closed). The component owns and updates the open
 *   state internally. Optional {@link DropdownRootProps.onOpenChange | `onOpenChange`}
 *   observes transitions.
 * - **Controlled** — pass {@link DropdownRootProps.open | `open`} *and*
 *   {@link DropdownRootProps.onOpenChange | `onOpenChange`} together. The
 *   parent owns the state; the component defers every transition back through
 *   the callback.
 *
 * Only user-driven transitions (trigger clicks, Escape, selection) invoke
 * `onOpenChange`. External state flips made by the parent do not.
 *
 * **Reading direction.** Pass {@link DropdownRootProps.dir | `dir`} to set
 * `"ltr"` or `"rtl"`, which inverts the submenu open / close arrow keys
 * (`ArrowRight` ↔ `ArrowLeft`). When omitted, the component reads the
 * inherited {@link DirectionProvider} value, falling back to `"ltr"`.
 *
 * @example Uncontrolled
 * ```tsx
 * <Dropdown.Root>
 *   <Dropdown.Trigger>Options</Dropdown.Trigger>
 *   <Dropdown.Content>
 *     <Dropdown.Item>Rename</Dropdown.Item>
 *     <Dropdown.Item>Delete</Dropdown.Item>
 *   </Dropdown.Content>
 * </Dropdown.Root>
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <Dropdown.Root open={open} onOpenChange={setOpen}>
 *   …
 * </Dropdown.Root>
 * ```
 */
function DropdownRoot({
  defaultOpen,
  open,
  onOpenChange,
  dir,
  children,
}: DropdownRootProps): ReactElement {
  const inheritedDir = useDirection();
  const { contextValue } = useDropdownRoot({
    defaultOpen,
    open,
    onOpenChange,
    dir: dir ?? inheritedDir,
  });

  return (
    <DropdownContext.Provider value={contextValue}>
      {children}
    </DropdownContext.Provider>
  );
}

DropdownRoot.displayName = "DropdownRoot";

/**
 * The menu button. Toggles the Dropdown open/closed on click and exposes
 * the ARIA contract for WAI-ARIA Menu Button: `aria-haspopup="menu"`,
 * `aria-expanded` reflecting the open state, and `aria-controls` pointing
 * at the content's id.
 *
 * Renders a `<button type="button">` by default. Pass `asChild` to render
 * the composed child element instead (e.g. a link, or a custom button
 * component). All ARIA attributes and event handlers are merged onto the
 * child following the {@link Slot} composition rules.
 *
 * @example With an anchor via `asChild`
 * ```tsx
 * <Dropdown.Trigger asChild>
 *   <a href="#options">Options</a>
 * </Dropdown.Trigger>
 * ```
 */
function DropdownTrigger({
  children,
  onClick,
  asChild = false,
  ...rest
}: DropdownTriggerProps): ReactElement {
  const { triggerProps } = useDropdownTrigger({ onClick, restProps: rest });

  if (asChild) {
    return <Slot {...triggerProps}>{children}</Slot>;
  }

  return (
    <button type="button" {...triggerProps}>
      {children}
    </button>
  );
}

DropdownTrigger.displayName = "DropdownTrigger";

/**
 * The menu panel rendered with the native HTML
 * [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
 * (`popover="auto"`) — no portal, no floating-ui. The browser manages
 * layering via the top layer and dispatches a light-dismiss on outside
 * click and Escape in the light-dismiss flow.
 *
 * Renders a `<menu role="menu">` by default; pass `asChild` to render
 * any element with menu semantics.
 *
 * **Keyboard interaction.** While the menu is open:
 *
 * | Key                     | Behaviour                                          |
 * | ----------------------- | -------------------------------------------------- |
 * | `ArrowDown` / `ArrowUp` | Move focus to next / previous item (wraps)         |
 * | `Home` / `End`          | Jump to first / last item                          |
 * | `Enter` / `Space`       | Activate the focused item                          |
 * | `Escape`                | Close the menu and return focus to the trigger     |
 * | any printable character | Typeahead — focuses the next item matching prefix  |
 *
 * Typeahead accumulates keystrokes within a 500 ms window; pressing the
 * same character repeatedly cycles through items that share that first
 * letter. Disabled items are skipped during arrow navigation and typeahead.
 *
 * Arrow navigation is scoped to the popover that currently holds focus —
 * a {@link DropdownSubContent | `Dropdown.SubContent`} rendered inside
 * this menu does not pull its items into the parent's navigation cycle,
 * so `ArrowDown` past a {@link DropdownSubTrigger | `Dropdown.SubTrigger`}
 * lands on the next sibling item in the parent rather than getting
 * stuck on a non-focusable item inside a closed sub-popover.
 */
function DropdownContent({
  children,
  onKeyDown,
  asChild = false,
  ...rest
}: DropdownContentProps): ReactElement {
  const { contentContextValue, contentProps } = useDropdownContent({
    onKeyDown,
    restProps: rest,
  });

  return (
    <DropdownContentContext.Provider value={contentContextValue}>
      {asChild ? (
        <Slot {...contentProps}>{children}</Slot>
      ) : (
        <menu {...contentProps}>{children}</menu>
      )}
    </DropdownContentContext.Provider>
  );
}

DropdownContent.displayName = "DropdownContent";

/**
 * A standard menu item. Renders a `<li role="menuitem">` by default; pass
 * `asChild` to render any element with menuitem semantics.
 *
 * Clicking the item (or pressing Enter / Space while focused) fires
 * {@link DropdownItemProps.onSelect | `onSelect`} with a cancellable
 * `Event`. The menu auto-closes after selection; call
 * `event.preventDefault()` inside `onSelect` to keep it open — useful
 * for actions that perform in-place mutations (e.g. copying to clipboard).
 *
 * Disabled items receive `aria-disabled="true"` and are skipped by arrow
 * navigation, typeahead, and activation handlers.
 */
function DropdownItem({
  children,
  onClick,
  onSelect,
  disabled,
  asChild = false,
  ...rest
}: DropdownItemProps): ReactElement {
  const { itemProps } = useDropdownItem({
    disabled,
    onClick,
    onSelect,
    restProps: rest,
  });

  if (asChild) {
    return <Slot {...itemProps}>{children}</Slot>;
  }

  return <li {...itemProps}>{children}</li>;
}

DropdownItem.displayName = "DropdownItem";

/**
 * A visual separator between groups of items. Renders a `<li role="separator">`
 * by default; pass `asChild` to render any element with separator semantics.
 * Non-interactive — skipped by focus, arrow navigation, and typeahead.
 */
function DropdownSeparator({
  asChild = false,
  children,
  ...rest
}: DropdownSeparatorProps): ReactElement {
  const separatorProps = { ...rest, role: "separator" as const };

  if (asChild) {
    return <Slot {...separatorProps}>{children}</Slot>;
  }

  return <li {...separatorProps} />;
}

DropdownSeparator.displayName = "DropdownSeparator";

/**
 * A semantic grouping of related items. Renders as a `<li role="group">`
 * wrapping an inner `<ul role="none">`, or — with `asChild` — a single
 * grouping element composed onto the provided child.
 *
 * Generates a stable id for its accompanying {@link DropdownLabel | `Dropdown.Label`},
 * wired automatically via `aria-labelledby`. Nest a `Dropdown.Label` as the
 * first child to provide the accessible name; screen readers will announce
 * the group when arrowing into it.
 */
function DropdownGroup({
  children,
  asChild = false,
  ...rest
}: DropdownGroupProps): ReactElement {
  const { contextValue, groupProps } = useDropdownGroup({ restProps: rest });

  return (
    <DropdownGroupContext.Provider value={contextValue}>
      {asChild ? (
        <Slot {...groupProps}>{children}</Slot>
      ) : (
        <li {...groupProps}>
          <ul role="none">{children}</ul>
        </li>
      )}
    </DropdownGroupContext.Provider>
  );
}

DropdownGroup.displayName = "DropdownGroup";

/**
 * A non-interactive label, typically used inside a {@link DropdownGroup |
 * `Dropdown.Group`} to give that group an accessible name. When nested in
 * a group, the label's `id` is auto-wired to the group's `aria-labelledby`
 * — consumers don't need to thread ids manually.
 *
 * Renders a `<li>` by default; pass `asChild` to render any element. A
 * caller-supplied `id` takes precedence over the auto-generated one.
 */
function DropdownLabel({
  id,
  children,
  asChild = false,
  ...rest
}: DropdownLabelProps): ReactElement {
  const { labelProps } = useDropdownLabel({ id, restProps: rest });

  if (asChild) {
    return <Slot {...labelProps}>{children}</Slot>;
  }
  return <li {...labelProps}>{children}</li>;
}

DropdownLabel.displayName = "DropdownLabel";

/**
 * A toggleable menu item. Renders a `<li role="menuitemcheckbox">` with
 * `aria-checked` reflecting the current state. `asChild` is supported.
 *
 * Supports a WAI-ARIA tri-state: `true`, `false`, or `"indeterminate"`
 * (encoded as `aria-checked="mixed"`). An indeterminate item resolves to
 * `true` on the next activation, matching the native `<input type="checkbox">`
 * behaviour.
 *
 * State modes are discriminated at the type level:
 *
 * - **Uncontrolled** — pass `defaultChecked` (or omit to start unchecked).
 *   Optional `onCheckedChange` observes toggles.
 * - **Controlled** — pass `checked` *and* `onCheckedChange` together.
 *
 * Activation (click / Enter / Space) toggles the checked state, then
 * fires {@link DropdownCheckboxItemProps.onSelect | `onSelect`} with a
 * cancellable `Event`. Call `event.preventDefault()` to keep the menu
 * open — useful for rapidly toggling multiple checkboxes.
 *
 * Nest a {@link DropdownItemIndicator | `Dropdown.ItemIndicator`} to
 * render the visible check mark; it reads its parent's state from
 * context and exposes `data-state` for styling.
 *
 * Disabled items receive `aria-disabled="true"` and no-op on activation.
 */
function DropdownCheckboxItem({
  children,
  onClick,
  onSelect,
  disabled,
  defaultChecked,
  checked: controlledChecked,
  onCheckedChange,
  asChild = false,
  ...rest
}: DropdownCheckboxItemProps): ReactElement {
  const { setOpen, triggerRef } = useDropdownContext();
  const closeSiblingSub = useCloseSiblingSub();
  const [highlighted, setHighlighted] = useState(false);
  const { checked, toggle } = useCheckboxRoot({
    defaultChecked,
    checked: controlledChecked,
    onCheckedChange,
  });
  const ariaChecked: "mixed" | "true" | "false" =
    checked === "indeterminate" ? "mixed" : checked ? "true" : "false";
  const handleClick = () => {
    if (disabled) return;
    toggle();
    const event = new Event("dropdown.select", { cancelable: true });
    onSelect?.(event);
    if (!event.defaultPrevented) {
      setOpen(false);
      triggerRef.current?.focus();
    }
  };
  const itemProps = {
    ...rest,
    role: "menuitemcheckbox" as const,
    tabIndex: -1,
    "aria-checked": ariaChecked,
    "aria-disabled": disabled || undefined,
    "data-highlighted": highlighted ? "" : undefined,
    onClick: composeEventHandlers(onClick, handleClick),
    onMouseEnter: composeEventHandlers(rest.onMouseEnter, () => {
      setHighlighted(true);
      closeSiblingSub();
    }),
    onMouseLeave: composeEventHandlers(rest.onMouseLeave, () =>
      setHighlighted(false),
    ),
  };
  const indicatorContextValue = useMemo(() => ({ checked }), [checked]);
  const content = asChild ? (
    <Slot {...itemProps}>{children}</Slot>
  ) : (
    <li {...itemProps}>{children}</li>
  );
  return (
    <DropdownItemIndicatorContext.Provider value={indicatorContextValue}>
      {content}
    </DropdownItemIndicatorContext.Provider>
  );
}

DropdownCheckboxItem.displayName = "DropdownCheckboxItem";

/**
 * A single-selection group of menu items. Children must be
 * {@link DropdownRadioItem | `Dropdown.RadioItem`} elements. Renders a
 * `<li role="group">` wrapping `<ul role="none">`, or — with `asChild` —
 * composes onto the provided child.
 *
 * State modes are discriminated at the type level:
 *
 * - **Uncontrolled** — pass `defaultValue` (or omit for no initial selection).
 *   Optional `onValueChange` observes selections.
 * - **Controlled** — pass `value` *and* `onValueChange` together.
 */
function DropdownRadioGroup({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  asChild = false,
  ...rest
}: DropdownRadioGroupProps): ReactElement {
  const { value, select } = useRadioGroupRoot({
    defaultValue,
    value: controlledValue,
    onValueChange,
  });
  const contextValue = useMemo(() => ({ value, select }), [value, select]);
  const groupProps = { ...rest, role: "group" as const };
  return (
    <DropdownRadioGroupContext.Provider value={contextValue}>
      {asChild ? (
        <Slot {...groupProps}>{children}</Slot>
      ) : (
        <li {...groupProps}>
          <ul role="none">{children}</ul>
        </li>
      )}
    </DropdownRadioGroupContext.Provider>
  );
}

DropdownRadioGroup.displayName = "DropdownRadioGroup";

/**
 * A single radio choice. Must be rendered inside a
 * {@link DropdownRadioGroup | `Dropdown.RadioGroup`}; rendering it outside
 * one throws a descriptive error.
 *
 * Renders a `<li role="menuitemradio">` with `aria-checked` reflecting
 * whether this item's `value` matches the group's active value. `asChild`
 * is supported.
 *
 * Activation (click / Enter / Space) selects this item, updating the
 * group's value, then fires {@link DropdownRadioItemProps.onSelect |
 * `onSelect`} with a cancellable `Event`. Call `event.preventDefault()`
 * to keep the menu open.
 *
 * Nest a {@link DropdownItemIndicator | `Dropdown.ItemIndicator`} to
 * render the visible bullet; it reads its parent's state from context
 * and exposes `data-state` for styling.
 *
 * Disabled items receive `aria-disabled="true"` and no-op on activation.
 */
function DropdownRadioItem({
  children,
  onClick,
  onSelect,
  disabled,
  value: itemValue,
  asChild = false,
  ...rest
}: DropdownRadioItemProps): ReactElement {
  const { setOpen, triggerRef } = useDropdownContext();
  const closeSiblingSub = useCloseSiblingSub();
  const [highlighted, setHighlighted] = useState(false);
  const group = useContext(DropdownRadioGroupContext);
  if (!group) {
    throw new Error(
      "Dropdown.RadioItem must be rendered inside a <Dropdown.RadioGroup>.",
    );
  }
  const checked = group.value === itemValue;
  const handleClick = () => {
    if (disabled) return;
    group.select(itemValue);
    const event = new Event("dropdown.select", { cancelable: true });
    onSelect?.(event);
    if (!event.defaultPrevented) {
      setOpen(false);
      triggerRef.current?.focus();
    }
  };
  const itemProps = {
    ...rest,
    role: "menuitemradio" as const,
    tabIndex: -1,
    "aria-checked": checked,
    "aria-disabled": disabled || undefined,
    "data-highlighted": highlighted ? "" : undefined,
    onClick: composeEventHandlers(onClick, handleClick),
    onMouseEnter: composeEventHandlers(rest.onMouseEnter, () => {
      setHighlighted(true);
      closeSiblingSub();
    }),
    onMouseLeave: composeEventHandlers(rest.onMouseLeave, () =>
      setHighlighted(false),
    ),
  };
  const indicatorContextValue = useMemo(() => ({ checked }), [checked]);
  const content = asChild ? (
    <Slot {...itemProps}>{children}</Slot>
  ) : (
    <li {...itemProps}>{children}</li>
  );
  return (
    <DropdownItemIndicatorContext.Provider value={indicatorContextValue}>
      {content}
    </DropdownItemIndicatorContext.Provider>
  );
}

DropdownRadioItem.displayName = "DropdownRadioItem";

/**
 * The visible mark (usually a checkmark or a bullet) rendered inside a
 * {@link DropdownCheckboxItem | `Dropdown.CheckboxItem`} or
 * {@link DropdownRadioItem | `Dropdown.RadioItem`}. Must be a descendant
 * of one of those; rendering it anywhere else throws a descriptive error.
 *
 * Renders a `<span>` by default; pass `asChild` to compose onto any
 * element (commonly an SVG icon). Exposes `data-state` reflecting the
 * parent item's live state: `"checked"`, `"unchecked"`, or
 * `"indeterminate"` — the last being reachable only through a tri-state
 * `Dropdown.CheckboxItem`.
 *
 * By default the indicator unmounts when its parent is unchecked. Pass
 * {@link DropdownItemIndicatorProps.forceMount | `forceMount`} to keep
 * the DOM node mounted in both states, which is handy when animating the
 * indicator in and out via CSS transitions or a React animation library.
 *
 * @example
 * ```tsx
 * <Dropdown.CheckboxItem checked={showBookmarks} onCheckedChange={setShowBookmarks}>
 *   <Dropdown.ItemIndicator>
 *     <CheckIcon />
 *   </Dropdown.ItemIndicator>
 *   Show bookmarks
 * </Dropdown.CheckboxItem>
 * ```
 */
function DropdownItemIndicator({
  children,
  asChild = false,
  forceMount = false,
  ...rest
}: DropdownItemIndicatorProps): ReactElement | null {
  const context = useContext(DropdownItemIndicatorContext);
  if (!context) {
    throw new Error(
      "Dropdown.ItemIndicator must be rendered inside a <Dropdown.CheckboxItem> or <Dropdown.RadioItem>.",
    );
  }
  const { checked } = context;
  const dataState =
    checked === "indeterminate"
      ? "indeterminate"
      : checked
        ? "checked"
        : "unchecked";
  if (!forceMount && checked === false) return null;
  const indicatorProps = { ...rest, "data-state": dataState };
  if (asChild) {
    return <Slot {...indicatorProps}>{children}</Slot>;
  }
  return <span {...indicatorProps}>{children}</span>;
}

DropdownItemIndicator.displayName = "DropdownItemIndicator";

/**
 * A submenu boundary. Wrap a {@link DropdownSubTrigger | `Dropdown.SubTrigger`}
 * and its {@link DropdownSubContent | `Dropdown.SubContent`} in a
 * `Dropdown.Sub` to establish an independent open state for the nested menu.
 *
 * Supports uncontrolled (`defaultOpen`) and controlled (`open` +
 * `onOpenChange`) modes, discriminated at the type level — same contract
 * as {@link DropdownRoot | `Dropdown.Root`}.
 *
 * @example
 * ```tsx
 * <Dropdown.Root>
 *   <Dropdown.Trigger>File</Dropdown.Trigger>
 *   <Dropdown.Content>
 *     <Dropdown.Sub>
 *       <Dropdown.SubTrigger>Open Recent</Dropdown.SubTrigger>
 *       <Dropdown.SubContent>
 *         <Dropdown.Item>Project A</Dropdown.Item>
 *         <Dropdown.Item>Project B</Dropdown.Item>
 *       </Dropdown.SubContent>
 *     </Dropdown.Sub>
 *   </Dropdown.Content>
 * </Dropdown.Root>
 * ```
 */
function DropdownSub({
  defaultOpen,
  open: controlledOpen,
  onOpenChange,
  children,
}: DropdownSubProps): ReactElement {
  const { open, setOpen } = useDropdownRoot({
    defaultOpen,
    open: controlledOpen,
    onOpenChange,
  });
  const contentId = useId();
  const triggerRef = useRef<HTMLLIElement | null>(null);
  const contextValue = useMemo(
    () => ({ open, setOpen, contentId, triggerRef }),
    [open, setOpen, contentId],
  );
  // Register with the enclosing Content so sibling items can close this sub
  // on hover (mirroring the keyboard behaviour where returning focus to the
  // parent menu dismisses the sub). If another sibling sub is already
  // registered as open, close it first — a hover-to-open transition onto
  // our SubTrigger should supplant the prior sub, not stack it.
  const parentContent = useContext(DropdownContentContext);
  useEffect(() => {
    if (!open || !parentContent) return;
    const close = () => setOpen(false);
    const prev = parentContent.closeOpenSubRef.current;
    if (prev && prev !== close) prev();
    parentContent.closeOpenSubRef.current = close;
    return () => {
      if (parentContent.closeOpenSubRef.current === close) {
        parentContent.closeOpenSubRef.current = null;
      }
    };
  }, [open, parentContent, setOpen]);
  return (
    <DropdownSubContext.Provider value={contextValue}>
      {children}
    </DropdownSubContext.Provider>
  );
}

DropdownSub.displayName = "DropdownSub";

/**
 * The submenu trigger. Must be rendered inside a {@link DropdownSub |
 * `Dropdown.Sub`}; rendering it outside one throws a descriptive error.
 *
 * Renders a `<li role="menuitem">` with `aria-haspopup="menu"`,
 * `aria-expanded`, and `aria-controls` wiring it to the sibling
 * {@link DropdownSubContent | `Dropdown.SubContent`}. `asChild` is supported.
 *
 * Opens the submenu on click, the inline-forward arrow key, or pointer
 * hover; all other keys bubble to the parent {@link DropdownContent |
 * `Dropdown.Content`} so its roving focus and typeahead continue to work
 * while a submenu is in play. The open key follows the resolved reading
 * direction — `ArrowRight` in `"ltr"`, `ArrowLeft` in `"rtl"`. Hovering
 * onto a sibling item in the parent menu closes the submenu — mirroring
 * the keyboard contract where focus returning to the parent dismisses it.
 *
 * Disabled triggers receive `aria-disabled="true"` and ignore both click
 * and the open arrow key.
 */
function DropdownSubTrigger({
  children,
  onClick,
  onKeyDown,
  disabled,
  asChild = false,
  ...rest
}: DropdownSubTriggerProps): ReactElement {
  const sub = useDropdownSubContext();
  const { dir } = useDropdownContext();
  const openKey = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
  const [hovered, setHovered] = useState(false);
  const toggle = () => {
    if (disabled) return;
    sub.setOpen(true);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLLIElement>) => {
    if (disabled) return;
    if (event.key !== openKey) return;
    event.preventDefault();
    event.stopPropagation();
    sub.setOpen(true);
  };
  const subTriggerProps = {
    ...rest,
    ref: sub.triggerRef,
    role: "menuitem" as const,
    tabIndex: -1,
    "aria-haspopup": "menu" as const,
    "aria-expanded": sub.open,
    "aria-controls": sub.contentId,
    "aria-disabled": disabled || undefined,
    "data-highlighted": hovered || sub.open ? "" : undefined,
    onClick: composeEventHandlers(onClick, toggle),
    onKeyDown: composeEventHandlers(onKeyDown, handleKeyDown),
    onMouseEnter: composeEventHandlers(rest.onMouseEnter, () => {
      setHovered(true);
      if (!disabled) sub.setOpen(true);
    }),
    onMouseLeave: composeEventHandlers(rest.onMouseLeave, () =>
      setHovered(false),
    ),
  };
  if (asChild) {
    return <Slot {...subTriggerProps}>{children}</Slot>;
  }
  return <li {...subTriggerProps}>{children}</li>;
}

DropdownSubTrigger.displayName = "DropdownSubTrigger";

/**
 * The submenu panel. Must be rendered inside a {@link DropdownSub |
 * `Dropdown.Sub`}; rendering it outside one throws a descriptive error.
 *
 * Renders a `<menu role="menu" popover="auto">` by default; pass `asChild`
 * to render any element with menu semantics. When the submenu opens, focus
 * moves to its first enabled item.
 *
 * Presses of the inline-backward arrow key close the submenu and return
 * focus to the {@link DropdownSubTrigger | `Dropdown.SubTrigger`} —
 * `ArrowLeft` in `"ltr"`, `ArrowRight` in `"rtl"`. All other keys bubble
 * to the parent {@link DropdownContent | `Dropdown.Content`} so arrow
 * navigation and typeahead apply to the submenu's items.
 */
function DropdownSubContent({
  children,
  onKeyDown,
  asChild = false,
  ...rest
}: DropdownSubContentProps): ReactElement {
  const sub = useDropdownSubContext();
  const { dir } = useDropdownContext();
  const closeKey = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
  const menuRef = useRef<HTMLMenuElement | null>(null);

  useEffect(() => {
    const menu = menuRef.current!;
    if (sub.open) {
      menu.showPopover();
      const firstItem = menu.querySelector<HTMLElement>(MENUITEM_SELECTOR);
      firstItem?.focus();
    } else {
      try {
        menu.hidePopover();
      } catch {
        // already hidden — no-op
      }
    }
  }, [sub.open]);

  useEffect(() => {
    const menu = menuRef.current!;
    const handleToggle = (event: ToggleEvent) => {
      if (event.newState === "closed") sub.setOpen(false);
    };
    menu.addEventListener("toggle", handleToggle);
    return () => menu.removeEventListener("toggle", handleToggle);
  }, [sub.setOpen]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLMenuElement>) => {
    if (event.key !== closeKey) return;
    event.preventDefault();
    event.stopPropagation();
    sub.setOpen(false);
    sub.triggerRef.current?.focus();
  };

  const closeOpenSubRef = useRef<(() => void) | null>(null);
  const contentContextValue = useMemo(() => ({ closeOpenSubRef }), []);

  const subContentProps = {
    ...rest,
    ref: menuRef,
    id: sub.contentId,
    role: "menu" as const,
    popover: "auto" as const,
    onKeyDown: composeEventHandlers(onKeyDown, handleKeyDown),
  };
  return (
    <DropdownContentContext.Provider value={contentContextValue}>
      {asChild ? (
        <Slot {...subContentProps}>{children}</Slot>
      ) : (
        <menu {...subContentProps}>{children}</menu>
      )}
    </DropdownContentContext.Provider>
  );
}

DropdownSubContent.displayName = "DropdownSubContent";

type TDropdownCompound = typeof DropdownRoot & {
  Root: typeof DropdownRoot;
  Trigger: typeof DropdownTrigger;
  Content: typeof DropdownContent;
  Item: typeof DropdownItem;
  Separator: typeof DropdownSeparator;
  Group: typeof DropdownGroup;
  Label: typeof DropdownLabel;
  CheckboxItem: typeof DropdownCheckboxItem;
  RadioGroup: typeof DropdownRadioGroup;
  RadioItem: typeof DropdownRadioItem;
  ItemIndicator: typeof DropdownItemIndicator;
  Sub: typeof DropdownSub;
  SubTrigger: typeof DropdownSubTrigger;
  SubContent: typeof DropdownSubContent;
};

const DropdownCompound: TDropdownCompound = Object.assign(DropdownRoot, {
  Root: DropdownRoot,
  Trigger: DropdownTrigger,
  Content: DropdownContent,
  Item: DropdownItem,
  Separator: DropdownSeparator,
  Group: DropdownGroup,
  Label: DropdownLabel,
  CheckboxItem: DropdownCheckboxItem,
  RadioGroup: DropdownRadioGroup,
  RadioItem: DropdownRadioItem,
  ItemIndicator: DropdownItemIndicator,
  Sub: DropdownSub,
  SubTrigger: DropdownSubTrigger,
  SubContent: DropdownSubContent,
});

DropdownCompound.displayName = "Dropdown";

export { DropdownCompound as Dropdown };
