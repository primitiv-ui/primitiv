import { ComponentProps } from "react";

/** Layout axis of the navigation list. `"horizontal"` binds
 * ArrowLeft/ArrowRight between top-level entries; `"vertical"` binds
 * ArrowUp/ArrowDown. */
export type NavigationMenuOrientation = "horizontal" | "vertical";

/** Reading direction of the navigation list. In `"rtl"` the horizontal arrow
 * pair is mirrored so navigation follows the visual order. */
export type NavigationMenuReadingDirection = "ltr" | "rtl";

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
  "defaultValue" | "dir"
> & {
  /** Layout axis; see {@link NavigationMenuOrientation}.
   * @default "horizontal" */
  orientation?: NavigationMenuOrientation;
  /** Reading direction; see {@link NavigationMenuReadingDirection}. Inherited
   * from the nearest `DirectionProvider` when omitted, falling back to
   * `"ltr"`. */
  dir?: NavigationMenuReadingDirection;
  /** Whether hovering a trigger opens its panel. Set `false` for a
   * click-only nav — hover-to-open is the desktop convention, but it has no
   * touch equivalent and some products prefer to opt out.
   * @default true */
  openOnHover?: boolean;
  /** Milliseconds a trigger must be hovered before its panel opens — the
   * hover-intent delay that stops a panel flashing open as the pointer
   * crosses the nav on its way somewhere else. `0` opens immediately.
   * Ignored once a panel is already open: moving between triggers always
   * switches without delay. Ignored entirely when
   * {@link NavigationMenuRootProps.openOnHover | `openOnHover`} is `false`.
   * @default 200 */
  delayDuration?: number;
  /** Milliseconds the open panel survives after the pointer leaves the
   * `<nav>`, so a pointer that clips the edge of a panel on its way back
   * doesn't dismiss it. Returning to the nav within the window cancels the
   * close.
   * @default 150 */
  closeDelay?: number;
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

/** Whether the surrounding subtree is inside a `NavigationMenu.Content`
 * panel. A `NavigationMenu.Link` uses it to tell a top-level entry (which
 * joins the arrow-key travel order) from a link inside a panel (which does
 * not). */
export type NavigationMenuPanelContextValue = boolean;

/** The value shared by `NavigationMenu.Root` with its descendants. */
export type NavigationMenuContextValue = {
  orientation: NavigationMenuOrientation;
  dir: NavigationMenuReadingDirection;
  navigationMenuId: string;
  openValue: string;
  setOpenValue: (next: string) => void;
  openOnHover: boolean;
  /** Opens `value` after the hover-intent delay, or immediately when another
   * panel is already open. */
  openWithIntent: (value: string) => void;
  /** Abandons a hover-intent open that hasn't fired yet. */
  cancelOpen: () => void;
  /** Adds (or, with `null`, removes) a top-level entry's element from the
   * registry that arrow-key navigation walks. */
  registerEntry: (key: string, element: HTMLElement | null) => void;
  /** Registry keys in DOM order — the arrow-key travel order. */
  entryKeys: string[];
  /** Moves DOM focus to a registered top-level entry. */
  focusEntry: (key: string) => void;
};

/** The value shared by `NavigationMenu.Item` with its descendants. */
export type NavigationMenuItemContextValue = {
  value: string | undefined;
};
