import { useMemo } from "react";
import type { KeyboardEvent, PointerEvent, ReactElement } from "react";

import { useDirection } from "../DirectionProvider/index.ts";
import { Slot, composeEventHandlers } from "../Slot/index.ts";

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

export function NavigationMenuTrigger({
  children,
  onClick,
  onPointerEnter,
  onPointerLeave,
  onKeyDown,
  ...rest
}: NavigationMenuTriggerProps): ReactElement {
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

  return (
    <button
      ref={triggerRef}
      type="button"
      id={triggerId}
      aria-expanded={open}
      aria-controls={panelId}
      data-state={state}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {children}
    </button>
  );
}

export function NavigationMenuContent({
  children,
  ...rest
}: NavigationMenuContentProps): ReactElement {
  const { triggerId, panelId, open, state } = useNavigationMenuEntry();

  return (
    <NavigationMenuPanelProvider value={true}>
      <div
        id={panelId}
        aria-labelledby={triggerId}
        data-state={state}
        hidden={!open}
        {...rest}
      >
        {children}
      </div>
    </NavigationMenuPanelProvider>
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
    Link: NavigationMenuLink,
  },
);

export { NavigationMenuCompound as NavigationMenu };
