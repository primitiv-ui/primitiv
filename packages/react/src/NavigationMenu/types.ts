import { ComponentProps } from "react";

/** Props for `NavigationMenu.Root` — the `<nav>` landmark. */
export type NavigationMenuRootProps = ComponentProps<"nav">;

/** Props for `NavigationMenu.List` — the `<ul>` of top-level entries. */
export type NavigationMenuListProps = ComponentProps<"ul">;

/** Props for `NavigationMenu.Item` — one `<li>` entry. */
export type NavigationMenuItemProps = ComponentProps<"li">;

/** Props for `NavigationMenu.Link` — an `<a>` to a page. */
export type NavigationMenuLinkProps = ComponentProps<"a">;
