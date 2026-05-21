import {
  useContext,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { useCheckboxRoot } from "../Checkbox/hooks";
import { useRadioGroupRoot } from "../RadioGroup/hooks";
import { useControllableState } from "../hooks";
import { Slot, composeEventHandlers } from "../Slot";

import {
  ContextMenuContext,
  ContextMenuPosition,
  useContextMenuContext,
} from "./ContextMenuContext";
import { ContextMenuGroupContext } from "./ContextMenuGroupContext";
import { ContextMenuItemIndicatorContext } from "./ContextMenuItemIndicatorContext";
import { ContextMenuRadioGroupContext } from "./ContextMenuRadioGroupContext";
import {
  ContextMenuSubContext,
  useContextMenuSubContext,
} from "./ContextMenuSubContext";
import {
  ContextMenuCheckboxItemProps,
  ContextMenuContentProps,
  ContextMenuGroupProps,
  ContextMenuItemIndicatorProps,
  ContextMenuItemProps,
  ContextMenuLabelProps,
  ContextMenuRadioGroupProps,
  ContextMenuRadioItemProps,
  ContextMenuRootProps,
  ContextMenuSeparatorProps,
  ContextMenuSubContentProps,
  ContextMenuSubProps,
  ContextMenuSubTriggerProps,
  ContextMenuTriggerProps,
} from "./types";
import { MENUITEM_SELECTOR, TYPEAHEAD_RESET_MS } from "./constants";

/**
 * The root of a ContextMenu — owns the open state and the position the
 * menu should open at, and provides context to descendants. Renders no
 * DOM of its own; it is a context boundary.
 *
 * Supports two state modes, statically discriminated at the type level so
 * only one shape is accepted by TypeScript:
 *
 * - **Uncontrolled** — pass {@link ContextMenuRootProps.defaultOpen | `defaultOpen`}
 *   (or omit it to start closed). The component owns and updates the open
 *   state internally. Optional {@link ContextMenuRootProps.onOpenChange | `onOpenChange`}
 *   observes transitions.
 * - **Controlled** — pass {@link ContextMenuRootProps.open | `open`} *and*
 *   {@link ContextMenuRootProps.onOpenChange | `onOpenChange`} together. The
 *   parent owns the state; the component defers every transition back through
 *   the callback.
 */
function ContextMenuRoot({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  children,
}: ContextMenuRootProps) {
  const contentId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const [position, setPosition] = useState<ContextMenuPosition | null>(null);
  const [open, setOpenBase] = useControllableState<boolean>(
    controlledOpen,
    defaultOpen,
    onOpenChange,
  );
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  });

  const setOpen = useCallback(
    (next: boolean) => {
      if (openRef.current === next) return;
      openRef.current = next;
      setOpenBase(next);
    },
    [setOpenBase],
  );

  const contextValue = useMemo(
    () => ({ open, setOpen, position, setPosition, contentId, triggerRef }),
    [open, setOpen, position, contentId],
  );

  return (
    <ContextMenuContext.Provider value={contextValue}>
      {children}
    </ContextMenuContext.Provider>
  );
}

ContextMenuRoot.displayName = "ContextMenuRoot";

/**
 * The area that responds to right-click. Renders a `<span>` by default
 * (a non-button host so the wrapped content keeps its native semantics);
 * pass `asChild` to render any element.
 *
 * When the user opens the platform context menu over this element (via
 * right-click, long-press on touch, or the keyboard context-menu key),
 * the native menu is suppressed and the ContextMenu opens, positioned at
 * the pointer.
 */
function ContextMenuTrigger({
  children,
  onContextMenu,
  asChild = false,
  disabled,
  ...rest
}: ContextMenuTriggerProps) {
  const { setOpen, setPosition, triggerRef } = useContextMenuContext();

  const handleContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    event.preventDefault();
    setPosition({ x: event.clientX, y: event.clientY });
    setOpen(true);
  };

  const triggerProps = {
    ...rest,
    ref: triggerRef,
    "data-disabled": disabled ? "" : undefined,
    "data-state": disabled ? undefined : ("closed" as const),
    onContextMenu: composeEventHandlers(onContextMenu, handleContextMenu),
  };

  if (asChild) {
    return <Slot {...triggerProps}>{children}</Slot>;
  }

  return <span {...triggerProps}>{children}</span>;
}

ContextMenuTrigger.displayName = "ContextMenuTrigger";

/**
 * The menu panel rendered with the native HTML
 * [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
 * (`popover="auto"`) — no portal, no floating-ui. The browser manages
 * layering via the top layer and dispatches a light-dismiss on outside
 * click and Escape in the light-dismiss flow.
 *
 * Renders a `<menu role="menu">` positioned at the pointer coordinates
 * captured when the Trigger fired its `contextmenu` event. Pass `asChild`
 * to render any element with menu semantics.
 */
function ContextMenuContent({
  children,
  style,
  onKeyDown,
  asChild = false,
  ...rest
}: ContextMenuContentProps) {
  const { open, setOpen, position, contentId, triggerRef } =
    useContextMenuContext();
  const menuRef = useRef<HTMLMenuElement | null>(null);
  const typeaheadRef = useRef<{ query: string; timer: number | null }>({
    query: "",
    timer: null,
  });

  useEffect(() => {
    const menu = menuRef.current!;
    if (open) {
      menu.showPopover();
      if (!menu.contains(document.activeElement)) {
        const firstItem = menu.querySelector<HTMLElement>(MENUITEM_SELECTOR);
        firstItem?.focus();
      }
    } else {
      try {
        menu.hidePopover();
      } catch {
        // already hidden — no-op
      }
    }
  }, [open]);

  useEffect(() => {
    const menu = menuRef.current!;
    const handleToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === "closed") setOpen(false);
    };
    menu.addEventListener("toggle", handleToggle);
    return () => menu.removeEventListener("toggle", handleToggle);
  }, [setOpen]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element;
      if (triggerRef.current?.contains(target)) return;
      if (target.closest?.("[popover]")) return;
      setOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open, setOpen, triggerRef]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLMenuElement>) => {
    const menu = menuRef.current!;
    const focused = document.activeElement as HTMLElement | null;
    const scope = (focused?.closest("[popover]") as HTMLElement | null) ?? menu;
    const items = Array.from(
      scope.querySelectorAll<HTMLElement>(MENUITEM_SELECTOR),
    ).filter((el) => el.closest("[popover]") === scope);
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    let nextIndex: number | null = null;
    if (event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % items.length;
    } else if (event.key === "ArrowUp") {
      nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      items[nextIndex].focus();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      if (currentIndex < 0) return;
      event.preventDefault();
      items[currentIndex].click();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (event.key.length === 1 && event.key !== " ") {
      const state = typeaheadRef.current;
      if (state.timer !== null) window.clearTimeout(state.timer);
      state.query = (state.query + event.key).toLowerCase();
      state.timer = window.setTimeout(() => {
        state.query = "";
        state.timer = null;
      }, TYPEAHEAD_RESET_MS);

      const isRepeat =
        state.query.length > 1 &&
        state.query.split("").every((c) => c === state.query[0]);
      const searchQuery = isRepeat ? state.query[0] : state.query;
      const startIndex = currentIndex < 0 ? 0 : currentIndex;
      const offset = searchQuery.length === 1 || isRepeat ? 1 : 0;
      for (let i = 0; i < items.length; i++) {
        const index = (startIndex + offset + i) % items.length;
        const text = items[index].textContent!.trim().toLowerCase();
        if (text.startsWith(searchQuery)) {
          event.preventDefault();
          items[index].focus();
          return;
        }
      }
    }
  };

  const positionedStyle = position
    ? {
        position: "fixed" as const,
        left: position.x,
        top: position.y,
        margin: 0,
        ...style,
      }
    : style;

  const contentProps = {
    ...rest,
    ref: menuRef,
    id: contentId,
    role: "menu" as const,
    popover: "auto" as const,
    "data-state": (open ? "open" : "closed") as "open" | "closed",
    style: positionedStyle,
    onKeyDown: composeEventHandlers(onKeyDown, handleKeyDown),
  };

  if (asChild) {
    return <Slot {...contentProps}>{children}</Slot>;
  }

  return <menu {...contentProps}>{children}</menu>;
}

ContextMenuContent.displayName = "ContextMenuContent";

/**
 * A standard menu item. Renders a `<li role="menuitem">` by default; pass
 * `asChild` to render any element with menuitem semantics.
 *
 * Clicking the item (or pressing Enter / Space while focused) fires
 * {@link ContextMenuItemProps.onSelect | `onSelect`} with a cancellable
 * `Event`. The menu auto-closes after selection; call
 * `event.preventDefault()` inside `onSelect` to keep it open.
 *
 * Disabled items receive `aria-disabled="true"` and no-op on activation.
 */
function ContextMenuItem({
  children,
  onClick,
  onSelect,
  disabled,
  asChild = false,
  ...rest
}: ContextMenuItemProps) {
  const { setOpen } = useContextMenuContext();
  const [highlighted, setHighlighted] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    const event = new Event("contextmenu.select", { cancelable: true });
    onSelect?.(event);
    if (!event.defaultPrevented) {
      setOpen(false);
    }
  };

  const itemProps = {
    ...rest,
    role: "menuitem" as const,
    tabIndex: -1,
    "aria-disabled": disabled || undefined,
    "data-highlighted": highlighted ? "" : undefined,
    onClick: composeEventHandlers(onClick, handleClick),
    onMouseEnter: composeEventHandlers(rest.onMouseEnter, () =>
      setHighlighted(true),
    ),
    onMouseLeave: composeEventHandlers(rest.onMouseLeave, () =>
      setHighlighted(false),
    ),
  };

  if (asChild) {
    return <Slot {...itemProps}>{children}</Slot>;
  }

  return <li {...itemProps}>{children}</li>;
}

ContextMenuItem.displayName = "ContextMenuItem";

/**
 * A visual separator between groups of items. Renders a `<li role="separator">`
 * by default. Non-interactive — skipped by focus, arrow navigation, and
 * typeahead.
 */
function ContextMenuSeparator({
  asChild = false,
  children,
  ...rest
}: ContextMenuSeparatorProps) {
  const separatorProps = { ...rest, role: "separator" as const };

  if (asChild) {
    return <Slot {...separatorProps}>{children}</Slot>;
  }

  return <li {...separatorProps} />;
}

ContextMenuSeparator.displayName = "ContextMenuSeparator";

/**
 * A semantic grouping of related items. Renders as a `<li role="group">`
 * wrapping an inner `<ul role="none">`, or — with `asChild` — a single
 * grouping element composed onto the provided child.
 *
 * Generates a stable id for its accompanying {@link ContextMenuLabel |
 * `ContextMenu.Label`}, wired automatically via `aria-labelledby`.
 */
function ContextMenuGroup({
  children,
  asChild = false,
  ...rest
}: ContextMenuGroupProps) {
  const labelId = useId();
  const contextValue = useMemo(() => ({ labelId }), [labelId]);
  const groupProps = {
    ...rest,
    role: "group" as const,
    "aria-labelledby": labelId,
  };

  return (
    <ContextMenuGroupContext.Provider value={contextValue}>
      {asChild ? (
        <Slot {...groupProps}>{children}</Slot>
      ) : (
        <li {...groupProps}>
          <ul role="none">{children}</ul>
        </li>
      )}
    </ContextMenuGroupContext.Provider>
  );
}

ContextMenuGroup.displayName = "ContextMenuGroup";

/**
 * A non-interactive label, typically used inside a {@link ContextMenuGroup |
 * `ContextMenu.Group`} to give that group an accessible name. When nested in
 * a group, the label's `id` is auto-wired to the group's `aria-labelledby` —
 * consumers don't need to thread ids manually. A caller-supplied `id` takes
 * precedence over the auto-generated one.
 */
function ContextMenuLabel({
  id,
  children,
  asChild = false,
  ...rest
}: ContextMenuLabelProps) {
  const group = useContext(ContextMenuGroupContext);
  const labelProps = { ...rest, id: id ?? group?.labelId };

  if (asChild) {
    return <Slot {...labelProps}>{children}</Slot>;
  }

  return <li {...labelProps}>{children}</li>;
}

ContextMenuLabel.displayName = "ContextMenuLabel";

/**
 * A toggleable menu item. Renders a `<li role="menuitemcheckbox">` with
 * `aria-checked` reflecting the current state. Supports a WAI-ARIA tri-state:
 * `true`, `false`, or `"indeterminate"` (encoded as `aria-checked="mixed"`).
 * An indeterminate item resolves to `true` on the next activation.
 *
 * Activation (click) toggles the checked state, then fires
 * {@link ContextMenuCheckboxItemProps.onSelect | `onSelect`} with a
 * cancellable `Event`. Call `event.preventDefault()` to keep the menu open.
 *
 * Disabled items receive `aria-disabled="true"` and no-op on activation.
 */
function ContextMenuCheckboxItem({
  children,
  onClick,
  onSelect,
  disabled,
  defaultChecked,
  checked: controlledChecked,
  onCheckedChange,
  asChild = false,
  ...rest
}: ContextMenuCheckboxItemProps) {
  const { setOpen } = useContextMenuContext();
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
    const event = new Event("contextmenu.select", { cancelable: true });
    onSelect?.(event);
    if (!event.defaultPrevented) {
      setOpen(false);
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
    onMouseEnter: composeEventHandlers(rest.onMouseEnter, () =>
      setHighlighted(true),
    ),
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
    <ContextMenuItemIndicatorContext.Provider value={indicatorContextValue}>
      {content}
    </ContextMenuItemIndicatorContext.Provider>
  );
}

ContextMenuCheckboxItem.displayName = "ContextMenuCheckboxItem";

/**
 * The visible mark (usually a checkmark) rendered inside a
 * {@link ContextMenuCheckboxItem | `ContextMenu.CheckboxItem`} (or radio item).
 * Must be a descendant of one; rendering it anywhere else returns null
 * silently.
 *
 * Renders a `<span>` by default. Exposes `data-state` reflecting the parent
 * item's live state: `"checked"`, `"unchecked"`, or `"indeterminate"`.
 *
 * By default the indicator unmounts when its parent is unchecked. Pass
 * {@link ContextMenuItemIndicatorProps.forceMount | `forceMount`} to keep
 * the DOM node mounted in both states for animation use cases.
 */
function ContextMenuItemIndicator({
  children,
  asChild = false,
  forceMount = false,
  ...rest
}: ContextMenuItemIndicatorProps) {
  const context = useContext(ContextMenuItemIndicatorContext);
  if (!context) return null;

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

ContextMenuItemIndicator.displayName = "ContextMenuItemIndicator";

/**
 * A single-selection group of menu items. Children must be
 * {@link ContextMenuRadioItem | `ContextMenu.RadioItem`} elements. Renders a
 * `<li role="group">` wrapping `<ul role="none">`.
 */
function ContextMenuRadioGroup({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  asChild = false,
  ...rest
}: ContextMenuRadioGroupProps) {
  const { value, select } = useRadioGroupRoot({
    defaultValue,
    value: controlledValue,
    onValueChange,
  });
  const contextValue = useMemo(() => ({ value, select }), [value, select]);
  const groupProps = { ...rest, role: "group" as const };

  return (
    <ContextMenuRadioGroupContext.Provider value={contextValue}>
      {asChild ? (
        <Slot {...groupProps}>{children}</Slot>
      ) : (
        <li {...groupProps}>
          <ul role="none">{children}</ul>
        </li>
      )}
    </ContextMenuRadioGroupContext.Provider>
  );
}

ContextMenuRadioGroup.displayName = "ContextMenuRadioGroup";

/**
 * A single radio choice. Must be rendered inside a {@link ContextMenuRadioGroup |
 * `ContextMenu.RadioGroup`}; rendering it outside one throws a descriptive
 * error.
 *
 * Renders a `<li role="menuitemradio">` with `aria-checked` reflecting whether
 * this item's `value` matches the group's active value.
 *
 * Activation (click) selects this item, updating the group's value, then fires
 * {@link ContextMenuRadioItemProps.onSelect | `onSelect`} with a cancellable
 * `Event`. Call `event.preventDefault()` to keep the menu open.
 */
function ContextMenuRadioItem({
  children,
  onClick,
  onSelect,
  disabled,
  value: itemValue,
  asChild = false,
  ...rest
}: ContextMenuRadioItemProps) {
  const { setOpen } = useContextMenuContext();
  const [highlighted, setHighlighted] = useState(false);
  const group = useContext(ContextMenuRadioGroupContext);
  if (!group) {
    throw new Error(
      "ContextMenu.RadioItem must be rendered inside a <ContextMenu.RadioGroup>.",
    );
  }
  const checked = group.value === itemValue;

  const handleClick = () => {
    if (disabled) return;
    group.select(itemValue);
    const event = new Event("contextmenu.select", { cancelable: true });
    onSelect?.(event);
    if (!event.defaultPrevented) {
      setOpen(false);
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
    onMouseEnter: composeEventHandlers(rest.onMouseEnter, () =>
      setHighlighted(true),
    ),
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
    <ContextMenuItemIndicatorContext.Provider value={indicatorContextValue}>
      {content}
    </ContextMenuItemIndicatorContext.Provider>
  );
}

ContextMenuRadioItem.displayName = "ContextMenuRadioItem";

/**
 * A submenu boundary. Wrap a {@link ContextMenuSubTrigger | `ContextMenu.SubTrigger`}
 * and its {@link ContextMenuSubContent | `ContextMenu.SubContent`} in a
 * `ContextMenu.Sub` to establish an independent open state for the nested
 * menu. Supports uncontrolled (`defaultOpen`) and controlled (`open` +
 * `onOpenChange`) modes.
 */
function ContextMenuSub({
  defaultOpen,
  open: controlledOpen,
  onOpenChange,
  children,
}: ContextMenuSubProps) {
  const contentId = useId();
  const triggerRef = useRef<HTMLLIElement | null>(null);
  const [open, setOpenBase] = useControllableState<boolean>(
    controlledOpen,
    defaultOpen ?? false,
    onOpenChange,
  );
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  });
  const setOpen = useCallback(
    (next: boolean) => {
      if (openRef.current === next) return;
      openRef.current = next;
      setOpenBase(next);
    },
    [setOpenBase],
  );
  const contextValue = useMemo(
    () => ({ open, setOpen, contentId, triggerRef }),
    [open, setOpen, contentId],
  );
  return (
    <ContextMenuSubContext.Provider value={contextValue}>
      {children}
    </ContextMenuSubContext.Provider>
  );
}

ContextMenuSub.displayName = "ContextMenuSub";

/**
 * The submenu trigger. Must be rendered inside a {@link ContextMenuSub |
 * `ContextMenu.Sub`}.
 *
 * Renders a `<li role="menuitem">` with `aria-haspopup="menu"`,
 * `aria-expanded`, and `aria-controls` wiring it to the sibling
 * {@link ContextMenuSubContent | `ContextMenu.SubContent`}.
 *
 * Opens the submenu on click, `ArrowRight`, or pointer hover. Disabled
 * triggers ignore both click and `ArrowRight`.
 */
function ContextMenuSubTrigger({
  children,
  onClick,
  onKeyDown,
  disabled,
  asChild = false,
  ...rest
}: ContextMenuSubTriggerProps) {
  const sub = useContextMenuSubContext();
  const [hovered, setHovered] = useState(false);
  const toggle = () => {
    if (disabled) return;
    sub.setOpen(true);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLLIElement>) => {
    if (disabled) return;
    if (event.key !== "ArrowRight") return;
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

ContextMenuSubTrigger.displayName = "ContextMenuSubTrigger";

/**
 * The submenu panel. Must be rendered inside a {@link ContextMenuSub |
 * `ContextMenu.Sub`}.
 *
 * Renders a `<menu role="menu" popover="auto">` by default. When the submenu
 * opens, focus moves to its first enabled item. `ArrowLeft` closes the
 * submenu and returns focus to the SubTrigger.
 */
function ContextMenuSubContent({
  children,
  onKeyDown,
  asChild = false,
  ...rest
}: ContextMenuSubContentProps) {
  const sub = useContextMenuSubContext();
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
    const handleToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === "closed") sub.setOpen(false);
    };
    menu.addEventListener("toggle", handleToggle);
    return () => menu.removeEventListener("toggle", handleToggle);
  }, [sub.setOpen]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLMenuElement>) => {
    if (event.key !== "ArrowLeft") return;
    event.preventDefault();
    event.stopPropagation();
    sub.setOpen(false);
    sub.triggerRef.current?.focus();
  };

  const subContentProps = {
    ...rest,
    ref: menuRef,
    id: sub.contentId,
    role: "menu" as const,
    popover: "auto" as const,
    onKeyDown: composeEventHandlers(onKeyDown, handleKeyDown),
  };

  if (asChild) {
    return <Slot {...subContentProps}>{children}</Slot>;
  }
  return <menu {...subContentProps}>{children}</menu>;
}

ContextMenuSubContent.displayName = "ContextMenuSubContent";

type TContextMenuCompound = typeof ContextMenuRoot & {
  Root: typeof ContextMenuRoot;
  Trigger: typeof ContextMenuTrigger;
  Content: typeof ContextMenuContent;
  Item: typeof ContextMenuItem;
  Separator: typeof ContextMenuSeparator;
  Group: typeof ContextMenuGroup;
  Label: typeof ContextMenuLabel;
  CheckboxItem: typeof ContextMenuCheckboxItem;
  ItemIndicator: typeof ContextMenuItemIndicator;
  RadioGroup: typeof ContextMenuRadioGroup;
  RadioItem: typeof ContextMenuRadioItem;
  Sub: typeof ContextMenuSub;
  SubTrigger: typeof ContextMenuSubTrigger;
  SubContent: typeof ContextMenuSubContent;
};

const ContextMenuCompound: TContextMenuCompound = Object.assign(
  ContextMenuRoot,
  {
    Root: ContextMenuRoot,
    Trigger: ContextMenuTrigger,
    Content: ContextMenuContent,
    Item: ContextMenuItem,
    Separator: ContextMenuSeparator,
    Group: ContextMenuGroup,
    Label: ContextMenuLabel,
    CheckboxItem: ContextMenuCheckboxItem,
    ItemIndicator: ContextMenuItemIndicator,
    RadioGroup: ContextMenuRadioGroup,
    RadioItem: ContextMenuRadioItem,
    Sub: ContextMenuSub,
    SubTrigger: ContextMenuSubTrigger,
    SubContent: ContextMenuSubContent,
  },
);

ContextMenuCompound.displayName = "ContextMenu";

export { ContextMenuCompound as ContextMenu };
