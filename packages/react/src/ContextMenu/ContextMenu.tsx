import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { useControllableState } from "../hooks";
import { Slot, composeEventHandlers } from "../Slot";

import {
  ContextMenuContext,
  ContextMenuPosition,
  useContextMenuContext,
} from "./ContextMenuContext";
import {
  ContextMenuContentProps,
  ContextMenuItemProps,
  ContextMenuRootProps,
  ContextMenuTriggerProps,
} from "./types";

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
  asChild = false,
  ...rest
}: ContextMenuContentProps) {
  const { open, setOpen, position, contentId } = useContextMenuContext();
  const menuRef = useRef<HTMLMenuElement | null>(null);

  useEffect(() => {
    const menu = menuRef.current!;
    if (open) {
      menu.showPopover();
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
    style: positionedStyle,
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
    onClick: composeEventHandlers(onClick, handleClick),
  };

  if (asChild) {
    return <Slot {...itemProps}>{children}</Slot>;
  }

  return <li {...itemProps}>{children}</li>;
}

ContextMenuItem.displayName = "ContextMenuItem";

type TContextMenuCompound = typeof ContextMenuRoot & {
  Root: typeof ContextMenuRoot;
  Trigger: typeof ContextMenuTrigger;
  Content: typeof ContextMenuContent;
  Item: typeof ContextMenuItem;
};

const ContextMenuCompound: TContextMenuCompound = Object.assign(
  ContextMenuRoot,
  {
    Root: ContextMenuRoot,
    Trigger: ContextMenuTrigger,
    Content: ContextMenuContent,
    Item: ContextMenuItem,
  },
);

ContextMenuCompound.displayName = "ContextMenu";

export { ContextMenuCompound as ContextMenu };
