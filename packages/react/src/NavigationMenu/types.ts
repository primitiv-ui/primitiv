import { ComponentProps } from "react";

/** Layout axis of the navigation list. */
export type NavigationMenuOrientation = "horizontal" | "vertical";

/** Uncontrolled `NavigationMenu.Root` props: the component owns which panel is
 * open, seeded by an optional `defaultValue`. */
export type UncontrolledNavigationMenuRootProps = {
  /** Value of the entry whose panel is open on first render. Omit (or pass
   * `""`) to start with everything closed. */
  defaultValue?: string;
  value?: never;
  onValueChange?: never;
};

/** Controlled `NavigationMenu.Root` props: the caller owns which panel is open
 * via `value`, and is notified of open/close requests through
 * `onValueChange`. */
export type ControlledNavigationMenuRootProps = {
  /** Value of the entry whose panel is open. `""` means every panel is
   * closed. */
  value: string;
  /** Called with the requested open value — the entry's value to open it, or
   * `""` to close whatever is open. */
  onValueChange: (value: string) => void;
  defaultValue?: never;
};

/** Props for `NavigationMenu.Root` — the `<nav>` landmark and state owner. */
export type NavigationMenuRootProps = Omit<
  ComponentProps<"nav">,
  "defaultValue"
> & {
  /** Layout axis; see {@link NavigationMenuOrientation}.
   * @default "horizontal" */
  orientation?: NavigationMenuOrientation;
} & (
    | UncontrolledNavigationMenuRootProps
    | ControlledNavigationMenuRootProps
  );

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
  setOpenValue: (next: string) => void;
};

/** The value shared by `NavigationMenu.Item` with its descendants. */
export type NavigationMenuItemContextValue = {
  value: string | undefined;
};
