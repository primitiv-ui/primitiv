import type { ReactElement } from "react";

import type {
  NavigationMenuItemProps,
  NavigationMenuLinkProps,
  NavigationMenuListProps,
  NavigationMenuRootProps,
} from "./types";

export function NavigationMenuRoot({
  children,
  ...rest
}: NavigationMenuRootProps): ReactElement {
  return (
    <nav aria-label="Main" {...rest}>
      {children}
    </nav>
  );
}

export function NavigationMenuList({
  children,
  ...rest
}: NavigationMenuListProps): ReactElement {
  return <ul {...rest}>{children}</ul>;
}

export function NavigationMenuItem({
  children,
  ...rest
}: NavigationMenuItemProps): ReactElement {
  return <li {...rest}>{children}</li>;
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
  Link: typeof NavigationMenuLink;
};

const NavigationMenuCompound: TNavigationMenuCompound = Object.assign(
  NavigationMenuRoot,
  {
    Root: NavigationMenuRoot,
    List: NavigationMenuList,
    Item: NavigationMenuItem,
    Link: NavigationMenuLink,
  },
);

export { NavigationMenuCompound as NavigationMenu };
