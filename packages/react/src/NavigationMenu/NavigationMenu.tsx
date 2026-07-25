import { useMemo } from "react";
import type { PointerEvent, ReactElement } from "react";

import { composeEventHandlers } from "../Slot/index.ts";

import {
  useNavigationMenuEntry,
  useNavigationMenuRoot,
  useNavigationMenuTrigger,
} from "./hooks/index.ts";
import {
  NavigationMenuItemProvider,
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
  openOnHover = true,
  delayDuration = 200,
  closeDelay = 150,
  defaultValue,
  value,
  onValueChange,
  onPointerEnter,
  onPointerLeave,
  ...rest
}: NavigationMenuRootProps): ReactElement {
  const { contextValue, cancelClose, closeWithDelay } = useNavigationMenuRoot({
    orientation,
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

  return (
    <NavigationMenuProvider value={contextValue}>
      <nav
        aria-label="Main"
        data-orientation={orientation}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
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
  ...rest
}: NavigationMenuTriggerProps): ReactElement {
  const {
    triggerId,
    panelId,
    open,
    state,
    handleClick,
    handlePointerEnter,
    handlePointerLeave,
  } = useNavigationMenuTrigger({ onClick, onPointerEnter, onPointerLeave });

  return (
    <button
      type="button"
      id={triggerId}
      aria-expanded={open}
      aria-controls={panelId}
      data-state={state}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
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
    <div
      id={panelId}
      aria-labelledby={triggerId}
      data-state={state}
      hidden={!open}
      {...rest}
    >
      {children}
    </div>
  );
}

export function NavigationMenuLink({
  children,
  ...rest
}: NavigationMenuLinkProps): ReactElement {
  return <a {...rest}>{children}</a>;
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
