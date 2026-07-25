import { ComponentProps } from "react";

/** Layout axis of the navigation list. */
export type NavigationMenuOrientation = "horizontal" | "vertical";

/** Props for `NavigationMenu.Root` — the `<nav>` landmark. */
export type NavigationMenuRootProps = ComponentProps<"nav"> & {
  /** Layout axis; see {@link NavigationMenuOrientation}.
   * @default "horizontal" */
  orientation?: NavigationMenuOrientation;
};

/** Props for `NavigationMenu.List` — the `<ul>` of top-level entries. */
export type NavigationMenuListProps = ComponentProps<"ul">;

/** Props for `NavigationMenu.Item` — one `<li>` entry. */
export type NavigationMenuItemProps = ComponentProps<"li"> & {
  /** Identifies the entry's panel. Required for an entry that has a
   * `NavigationMenu.Trigger`; omit it for a plain link entry. */
  value?: string;
};

/** Props for `NavigationMenu.Trigger` — the `<button>` that opens a panel. */
export type NavigationMenuTriggerProps = ComponentProps<"button">;

/** Props for `NavigationMenu.Content` — an entry's panel. */
export type NavigationMenuContentProps = ComponentProps<"div">;

/** Props for `NavigationMenu.Link` — an `<a>` to a page. */
export type NavigationMenuLinkProps = ComponentProps<"a">;

/** The value shared by `NavigationMenu.Root` with its descendants. */
export type NavigationMenuContextValue = {
  orientation: NavigationMenuOrientation;
  navigationMenuId: string;
  openValue: string;
};

/** The value shared by `NavigationMenu.Item` with its descendants. */
export type NavigationMenuItemContextValue = {
  value: string | undefined;
};
