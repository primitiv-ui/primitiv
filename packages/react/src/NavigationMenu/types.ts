import { ComponentProps, Ref } from "react";

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

/**
 * Props for {@link NavigationMenuRoot | `NavigationMenu.Root`} — the `<nav>`
 * landmark and the owner of which panel is open. Extends the native `<nav>`
 * props and resolves to either the
 * {@link UncontrolledNavigationMenuRootProps | uncontrolled} or the
 * {@link ControlledNavigationMenuRootProps | controlled} shape, never a mix.
 *
 * `defaultValue` and `dir` are `Omit`-ted from the inherited `<nav>` props
 * before being re-declared: both narrow a same-named native attribute
 * (`defaultValue` to the open-panel value, `dir` to `"ltr" | "rtl"`), and
 * leaving the native declarations in place would resolve them to intersection
 * artifacts that leak into consumer types and the generated prop tables.
 *
 * @extends HTMLElement
 */
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

/**
 * Props for {@link NavigationMenuList | `NavigationMenu.List`} — all native
 * `<ul>` attributes. No props are added; content is
 * {@link NavigationMenuItem | `NavigationMenu.Item`}s.
 *
 * @extends HTMLUListElement
 */
export type NavigationMenuListProps = ComponentProps<"ul">;

/**
 * Props for {@link NavigationMenuItem | `NavigationMenu.Item`} — all native
 * `<li>` attributes plus the entry's `value`.
 *
 * `value` is `Omit`-ted from the inherited `<li>` props before being
 * re-declared: `<li value>` is a native ordinal number attribute, and leaving
 * it in place resolves this prop to an intersection artifact
 * (`string | (readonly string[] & string)`) that leaks into consumer hovers and
 * the generated prop tables.
 *
 * @extends HTMLLIElement
 */
export type NavigationMenuItemProps = Omit<ComponentProps<"li">, "value"> & {
  /** Identifies the entry's panel. Required for an entry that has a
   * `NavigationMenu.Trigger`; omit it for a plain link entry. */
  value?: string;
};

/**
 * Props for {@link NavigationMenuTrigger | `NavigationMenu.Trigger`} — the
 * `<button>` that opens an entry's panel. The element type defaults to
 * `HTMLButtonElement` and can be overridden through `asChild` and the `ref`
 * type parameter.
 *
 * `ref` is `Omit`-ted from the inherited `<button>` props before being
 * re-declared, so narrowing it to a different element under `asChild` yields a
 * usable `Ref<T>` rather than an unusable intersection of both.
 *
 * @extends HTMLButtonElement
 */
export type NavigationMenuTriggerProps<
  T extends HTMLElement = HTMLButtonElement,
> = Omit<ComponentProps<"button">, "ref"> & {
  /** Renders the child element instead of the default `<button>`. All
   * disclosure ARIA attributes, the hover-intent and keyboard handlers, and
   * the internal ref are merged onto the child via {@link Slot}. The child
   * must be a single React element that accepts a `ref`.
   * @default false */
  asChild?: boolean;
  /** Ref to the rendered element. Defaults to `HTMLButtonElement`; when using
   * `asChild`, specify the child's element type. */
  ref?: Ref<T>;
};

/**
 * Props for {@link NavigationMenuContent | `NavigationMenu.Content`} — all
 * native `<div>` attributes plus `forceMount`.
 *
 * @extends HTMLDivElement
 */
export type NavigationMenuContentProps = ComponentProps<"div"> & {
  /** Keeps the closed panel out of the `hidden` state so CSS can animate it
   * in and out, marking it `aria-hidden` instead so assistive technology
   * still ignores it. Without this the panel is `hidden` when closed, which no
   * transition can animate away from.
   * @default false */
  forceMount?: boolean;
};

/**
 * Props for {@link NavigationMenuViewport | `NavigationMenu.Viewport`} — all
 * native `<div>` attributes plus `forceMount`.
 *
 * @extends HTMLDivElement
 */
export type NavigationMenuViewportProps = ComponentProps<"div"> & {
  /** Keeps the viewport unhidden while nothing is open so CSS can animate the
   * box collapsing and expanding. Mirrors
   * {@link NavigationMenuContentProps.forceMount | `Content`'s `forceMount`}.
   * @default false */
  forceMount?: boolean;
};

/**
 * Props for {@link NavigationMenuIndicator | `NavigationMenu.Indicator`} — all
 * native `<div>` attributes plus `forceMount`. The measured geometry arrives as
 * inline custom properties on `style`; a consumer `style` is merged over the
 * top, so it can override everything except the two geometry properties it
 * doesn't set.
 *
 * @extends HTMLDivElement
 */
export type NavigationMenuIndicatorProps = ComponentProps<"div"> & {
  /** Keeps the indicator unhidden while nothing is open so CSS can animate it
   * out rather than having it vanish.
   * @default false */
  forceMount?: boolean;
  /** Renders the child element instead of the default `<div>`, merging the
   * `data-*` state hooks and the geometry custom properties onto it via
   * {@link Slot}. Use it to make the marker an icon — an `<svg>` arrow, a
   * `<Chevron />` component — rather than a styled box. The child must be a
   * single React element that accepts a `ref`.
   * @default false */
  asChild?: boolean;
};

/**
 * Props for {@link NavigationMenuLink | `NavigationMenu.Link`} — all native
 * `<a>` attributes plus `active` and the `asChild` escape hatch.
 *
 * @extends HTMLAnchorElement
 */
export type NavigationMenuLinkProps = ComponentProps<"a"> & {
  /** Marks this link as the page the user is currently on, setting
   * `aria-current="page"` and the `data-active` styling hook. The component
   * does no route matching of its own — the consumer owns the router, so it
   * owns the comparison.
   * @default false */
  active?: boolean;
  /** Renders the child element instead of a native `<a>`, merging all of
   * `NavigationMenu.Link`'s props — `aria-current`, `data-active`, the
   * panel-dismissing click handler, `ref` — onto it via {@link Slot}. Use for
   * routing-library link components.
   * @default false */
  asChild?: boolean;
};

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
  /** The entry that was open immediately before {@link openValue}, or `""` when
   * the menu was closed. Together with `entryKeys` this is what lets a panel
   * derive its travel direction; see `getPanelMotion`. */
  previousValue: string;
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
  /** The mounted `NavigationMenu.Viewport` element, or `null` when the nav
   * doesn't use one. Panels project into it when it exists. */
  viewport: HTMLDivElement | null;
  /** Ref callback a `NavigationMenu.Viewport` hands its element to. */
  registerViewport: (element: HTMLDivElement | null) => void;
};

/** The value shared by `NavigationMenu.Item` with its descendants. */
export type NavigationMenuItemContextValue = {
  value: string | undefined;
};
