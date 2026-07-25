import { useMemo } from "react";
import type {
  KeyboardEvent,
  PointerEvent,
  ReactElement,
  ReactPortal,
  Ref,
} from "react";
import { createPortal } from "react-dom";

import { useDirection } from "../DirectionProvider/index.ts";
import { Slot, composeEventHandlers, composeRefs } from "../Slot/index.ts";

import {
  useNavigationMenuEntry,
  useNavigationMenuLink,
  useNavigationMenuRoot,
  useNavigationMenuTrigger,
} from "./hooks/index.ts";
import {
  NavigationMenuItemProvider,
  NavigationMenuPanelProvider,
  NavigationMenuProvider,
  useNavigationMenuContext,
} from "./NavigationMenuContext";
import type {
  NavigationMenuContentProps,
  NavigationMenuItemContextValue,
  NavigationMenuItemProps,
  NavigationMenuLinkProps,
  NavigationMenuListProps,
  NavigationMenuRootProps,
  NavigationMenuTriggerProps,
  NavigationMenuViewportProps,
} from "./types";

export function NavigationMenuRoot({
  children,
  orientation = "horizontal",
  dir,
  openOnHover = true,
  delayDuration = 200,
  closeDelay = 150,
  defaultValue,
  value,
  onValueChange,
  onPointerEnter,
  onPointerLeave,
  onKeyDown,
  ...rest
}: NavigationMenuRootProps): ReactElement {
  const resolvedDir = dir ?? useDirection();
  const {
    contextValue,
    cancelClose,
    closeWithDelay,
    handleKeyDown: handleEscapeKeyDown,
  } = useNavigationMenuRoot({
    orientation,
    dir: resolvedDir,
    openOnHover,
    delayDuration,
    closeDelay,
    defaultValue,
    value,
    onValueChange,
  });

  // The close intent belongs to the whole nav, not to any one trigger: leaving
  // a trigger for its own panel must not dismiss it, and only leaving the
  // `<nav>` means the user is done with the menu.
  const handlePointerEnter = composeEventHandlers<PointerEvent<HTMLElement>>(
    onPointerEnter,
    cancelClose,
  );
  const handlePointerLeave = composeEventHandlers<PointerEvent<HTMLElement>>(
    onPointerLeave,
    closeWithDelay,
  );
  const handleKeyDown = composeEventHandlers<KeyboardEvent<HTMLElement>>(
    onKeyDown,
    handleEscapeKeyDown,
  );

  return (
    <NavigationMenuProvider value={contextValue}>
      <nav
        aria-label="Main"
        dir={resolvedDir}
        data-orientation={orientation}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        {children}
      </nav>
    </NavigationMenuProvider>
  );
}

export function NavigationMenuList({
  children,
  ...rest
}: NavigationMenuListProps): ReactElement {
  const { orientation } = useNavigationMenuContext();

  return (
    <ul data-orientation={orientation} {...rest}>
      {children}
    </ul>
  );
}

export function NavigationMenuItem({
  children,
  value,
  ...rest
}: NavigationMenuItemProps): ReactElement {
  const itemContextValue = useMemo<NavigationMenuItemContextValue>(
    () => ({ value }),
    [value],
  );

  return (
    <NavigationMenuItemProvider value={itemContextValue}>
      <li {...rest}>{children}</li>
    </NavigationMenuItemProvider>
  );
}

export function NavigationMenuTrigger<
  T extends HTMLElement = HTMLButtonElement,
>({
  ref: externalRef,
  children,
  asChild = false,
  onClick,
  onPointerEnter,
  onPointerLeave,
  onKeyDown,
  ...rest
}: NavigationMenuTriggerProps<T>): ReactElement {
  const {
    triggerRef,
    triggerId,
    panelId,
    open,
    state,
    handleClick,
    handlePointerEnter,
    handlePointerLeave,
    handleKeyDown,
  } = useNavigationMenuTrigger({
    onClick,
    onPointerEnter,
    onPointerLeave,
    onKeyDown,
  });

  // The external ref is cast to the internal ref's element type: React's
  // RefObject is invariant, but at runtime the callback receives whichever DOM
  // element actually rendered — the button, or the asChild child.
  const composedRef = externalRef
    ? composeRefs(triggerRef, externalRef as Ref<HTMLButtonElement>)
    : triggerRef;

  const triggerProps = {
    ref: composedRef,
    id: triggerId,
    "aria-expanded": open,
    "aria-controls": panelId,
    "data-state": state,
    onClick: handleClick,
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave,
    onKeyDown: handleKeyDown,
    ...rest,
  };

  if (asChild) {
    return <Slot {...triggerProps}>{children}</Slot>;
  }

  return (
    <button type="button" {...triggerProps}>
      {children}
    </button>
  );
}

export function NavigationMenuContent({
  children,
  forceMount = false,
  ...rest
}: NavigationMenuContentProps): ReactElement | ReactPortal {
  const { viewport } = useNavigationMenuContext();
  const { triggerId, panelId, open, state } = useNavigationMenuEntry();

  const panel = (
    <NavigationMenuPanelProvider value={true}>
      <div
        id={panelId}
        aria-labelledby={triggerId}
        data-state={state}
        hidden={forceMount ? undefined : !open}
        aria-hidden={forceMount && !open ? true : undefined}
        {...rest}
      >
        {children}
      </div>
    </NavigationMenuPanelProvider>
  );

  // With a Viewport every panel lives in that one box, which is what lets the
  // open panel morph into the next instead of each entry growing its own.
  // Without one the panel simply stays where it was authored.
  return viewport ? createPortal(panel, viewport) : panel;
}

export function NavigationMenuViewport({
  forceMount = false,
  ...rest
}: NavigationMenuViewportProps): ReactElement {
  const { orientation, openValue, registerViewport } =
    useNavigationMenuContext();
  const open = openValue !== "";

  return (
    <div
      ref={registerViewport}
      data-orientation={orientation}
      data-state={open ? "open" : "closed"}
      // The open entry's value, so a stylesheet can size or theme the shared
      // box per panel without the consumer threading state back in.
      data-value={openValue || undefined}
      hidden={forceMount ? undefined : !open}
      {...rest}
    />
  );
}

export function NavigationMenuLink({
  children,
  active = false,
  asChild = false,
  onKeyDown,
  onClick,
  ...rest
}: NavigationMenuLinkProps): ReactElement {
  const { linkRef, handleKeyDown, handleClick } = useNavigationMenuLink({
    onKeyDown,
    onClick,
  });

  const linkProps = {
    ref: linkRef,
    "aria-current": active ? ("page" as const) : undefined,
    "data-active": active ? "" : undefined,
    onKeyDown: handleKeyDown,
    onClick: handleClick,
    ...rest,
  };

  if (asChild) {
    return <Slot {...linkProps}>{children}</Slot>;
  }

  return <a {...linkProps}>{children}</a>;
}

export type TNavigationMenuCompound = typeof NavigationMenuRoot & {
  Root: typeof NavigationMenuRoot;
  List: typeof NavigationMenuList;
  Item: typeof NavigationMenuItem;
  Trigger: typeof NavigationMenuTrigger;
  Content: typeof NavigationMenuContent;
  Viewport: typeof NavigationMenuViewport;
  Link: typeof NavigationMenuLink;
};

const NavigationMenuCompound: TNavigationMenuCompound = Object.assign(
  NavigationMenuRoot,
  {
    Root: NavigationMenuRoot,
    List: NavigationMenuList,
    Item: NavigationMenuItem,
    Trigger: NavigationMenuTrigger,
    Content: NavigationMenuContent,
    Viewport: NavigationMenuViewport,
    Link: NavigationMenuLink,
  },
);

export { NavigationMenuCompound as NavigationMenu };
