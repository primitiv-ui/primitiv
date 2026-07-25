import { useMemo } from "react";
import type { ReactElement } from "react";

import {
  useNavigationMenuEntry,
  useNavigationMenuRoot,
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
  ...rest
}: NavigationMenuRootProps): ReactElement {
  const { contextValue } = useNavigationMenuRoot({ orientation });

  return (
    <NavigationMenuProvider value={contextValue}>
      <nav aria-label="Main" {...rest}>
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
  ...rest
}: NavigationMenuTriggerProps): ReactElement {
  const { triggerId, panelId, open, state } = useNavigationMenuEntry();

  return (
    <button
      type="button"
      id={triggerId}
      aria-expanded={open}
      aria-controls={panelId}
      data-state={state}
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
