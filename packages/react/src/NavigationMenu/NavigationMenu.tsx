import { useEffect, useMemo, useRef } from "react";
import type {
  FocusEvent,
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
  useNavigationMenuIndicator,
  useNavigationMenuLink,
  useNavigationMenuRoot,
  useNavigationMenuTrigger,
  useNavigationMenuViewport,
} from "./hooks/index.ts";
import {
  NavigationMenuItemProvider,
  NavigationMenuPanelProvider,
  NavigationMenuProvider,
  useNavigationMenuContext,
} from "./NavigationMenuContext";
import { getPanelMotion } from "./utils";
import type {
  NavigationMenuContentProps,
  NavigationMenuIndicatorProps,
  NavigationMenuItemContextValue,
  NavigationMenuItemProps,
  NavigationMenuLinkProps,
  NavigationMenuListProps,
  NavigationMenuRootProps,
  NavigationMenuTriggerProps,
  NavigationMenuViewportProps,
} from "./types";

/**
 * The root of a NavigationMenu — renders the `<nav>` landmark, owns which panel
 * is open, and provides context to every descendant.
 *
 * The `<nav>` defaults to `aria-label="Main"` so assistive technology announces
 * it as the primary navigation landmark, distinguishing it from any other
 * `<nav>` on the page. Override `aria-label` if your product uses different
 * terminology, or if this is a secondary nav.
 *
 * **State.** Exactly one panel is open at a time, identified by the enclosing
 * {@link NavigationMenuItem | `Item`}'s `value`. **The empty string means
 * nothing is open** — there is no separate `open` flag. Two modes, statically
 * discriminated at the type level so TypeScript accepts only one shape:
 *
 * - **Uncontrolled** — pass
 *   {@link NavigationMenuRootProps.defaultValue | `defaultValue`}, or omit it to
 *   start closed. The component owns the open value.
 * - **Controlled** — pass {@link NavigationMenuRootProps.value | `value`} *and*
 *   {@link NavigationMenuRootProps.onValueChange | `onValueChange`} together.
 *   Every open and close request defers to the callback, which is called with
 *   `""` to close.
 *
 * **Hover intent.** With
 * {@link NavigationMenuRootProps.openOnHover | `openOnHover`} (the default),
 * hovering a trigger opens its panel after
 * {@link NavigationMenuRootProps.delayDuration | `delayDuration`} — but only
 * for the *first* open. Once one panel is open, crossing to a sibling trigger
 * switches instantly. Leaving the `<nav>` closes after
 * {@link NavigationMenuRootProps.closeDelay | `closeDelay`}, and coming back
 * within that window cancels the close. The close intent lives on the `<nav>`
 * rather than on each trigger, which is what lets the pointer travel from a
 * trigger into its own panel without dismissing it.
 *
 * **Escape** is handled here, once, so it works from anywhere inside the menu —
 * including a link deep in an open panel. It closes the panel and returns focus
 * to that panel's trigger, so the user is never left focused on an element that
 * just became `hidden`.
 *
 * **Styling hooks.** `data-orientation="horizontal" | "vertical"`,
 * `--primitiv-navigation-menu-active-trigger-anchor` (the open trigger's
 * `anchor-name`, for CSS-anchor-positioning the {@link NavigationMenuViewport
 * | `Viewport`} — see its docs).
 *
 * **Reading direction.** {@link NavigationMenuRootProps.dir | `dir`} sets the
 * horizontal arrow-key direction and the container's `dir` attribute. When
 * omitted it is inherited from the nearest {@link DirectionProvider}, falling
 * back to `"ltr"`.
 *
 * @extends HTMLElement
 *
 * @example Uncontrolled, with a shared viewport and an indicator
 * ```tsx
 * <NavigationMenu.Root>
 *   <NavigationMenu.List>
 *     <NavigationMenu.Item value="concepts">
 *       <NavigationMenu.Trigger>Concepts</NavigationMenu.Trigger>
 *       <NavigationMenu.Content>
 *         <NavigationMenu.Link href="/tokens">Tokens</NavigationMenu.Link>
 *       </NavigationMenu.Content>
 *     </NavigationMenu.Item>
 *     <NavigationMenu.Item>
 *       <NavigationMenu.Link href="/changelog">Changelog</NavigationMenu.Link>
 *     </NavigationMenu.Item>
 *   </NavigationMenu.List>
 *   <NavigationMenu.Indicator />
 *   <NavigationMenu.Viewport />
 * </NavigationMenu.Root>
 * ```
 *
 * @example Controlled, closing the menu on every route change
 * ```tsx
 * const [open, setOpen] = useState("");
 * const { pathname } = useLocation();
 * useEffect(() => setOpen(""), [pathname]);
 *
 * <NavigationMenu.Root value={open} onValueChange={setOpen}>
 *   ...
 * </NavigationMenu.Root>
 * ```
 *
 * @example Click-only, for a nav that also has to work under touch
 * ```tsx
 * <NavigationMenu.Root openOnHover={false} aria-label="Docs">
 *   ...
 * </NavigationMenu.Root>
 * ```
 */
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
  onBlur,
  ...rest
}: NavigationMenuRootProps): ReactElement {
  const resolvedDir = dir ?? useDirection();
  const {
    contextValue,
    cancelClose,
    closeWithDelay,
    closeOnFocusOutside,
    handleKeyDown: handleEscapeKeyDown,
    style,
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
  // Closes an open panel when keyboard focus leaves the nav for good — Tab
  // past the last entry, or into an unrelated element such as a second,
  // independent NavigationMenu. See useNavigationMenuRoot's closeOnFocusOutside.
  const handleBlur = composeEventHandlers<FocusEvent<HTMLElement>>(
    onBlur,
    closeOnFocusOutside,
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
        onBlur={handleBlur}
        {...rest}
        // Placed after `...rest` so it isn't clobbered by a bare consumer
        // `style` — a consumer's own value for this property (unlikely, but
        // possible) still wins inside this merge.
        style={{ ...style, ...rest.style }}
      >
        {children}
      </nav>
    </NavigationMenuProvider>
  );
}

// Runtime-dead: the compound alias below (the same object via Object.assign)
// overwrites this to "NavigationMenu" at load, so the value is never observable.
// The assignment stays because it declares `displayName` on
// `typeof NavigationMenuRoot`, which TNavigationMenuCompound extends.
// Stryker disable next-line StringLiteral: overwritten by the compound alias — an equivalent mutant.
NavigationMenuRoot.displayName = "NavigationMenuRoot";

/**
 * The list of top-level entries — renders a `<ul>`.
 *
 * A plain list, not a `role="menubar"`: these are links to pages, so the
 * correct semantics are list-and-link, and screen-reader users get the
 * "navigation, list of N items" announcement they expect rather than
 * application-menu semantics that promise keyboard behaviour a nav doesn't
 * have.
 *
 * **Styling hooks.** `data-orientation="horizontal" | "vertical"`, inherited
 * from {@link NavigationMenuRoot | `NavigationMenu.Root`}.
 *
 * @extends HTMLUListElement
 *
 * @example
 * ```tsx
 * <NavigationMenu.List>
 *   <NavigationMenu.Item value="concepts">...</NavigationMenu.Item>
 * </NavigationMenu.List>
 * ```
 */
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

/** @internal */
NavigationMenuList.displayName = "NavigationMenuList";

/**
 * One top-level entry — renders an `<li>` and publishes its
 * {@link NavigationMenuItemProps.value | `value`} to its
 * {@link NavigationMenuTrigger | `Trigger`} and
 * {@link NavigationMenuContent | `Content`}.
 *
 * **`value` is what makes an entry a disclosure.** Give it a value and the
 * entry can hold a `Trigger` + `Content` pair. Omit it and the entry is a plain
 * link — the shape the wireframe's *Changelog* row takes. A `Trigger` or
 * `Content` inside a value-less Item throws, because it would derive an id that
 * could never be opened.
 *
 * @extends HTMLLIElement
 *
 * @example A panelled entry
 * ```tsx
 * <NavigationMenu.Item value="concepts">
 *   <NavigationMenu.Trigger>Concepts</NavigationMenu.Trigger>
 *   <NavigationMenu.Content>...</NavigationMenu.Content>
 * </NavigationMenu.Item>
 * ```
 *
 * @example A plain link entry — no value
 * ```tsx
 * <NavigationMenu.Item>
 *   <NavigationMenu.Link href="/changelog">Changelog</NavigationMenu.Link>
 * </NavigationMenu.Item>
 * ```
 */
export function NavigationMenuItem({
  children,
  value,
  ...rest
}: NavigationMenuItemProps): ReactElement {
  const { registerItem } = useNavigationMenuContext();
  const itemRef = useRef<HTMLLIElement | null>(null);
  const itemContextValue = useMemo<NavigationMenuItemContextValue>(
    () => ({ value }),
    [value],
  );

  // Only a disclosure entry joins the value-keyed registry: a plain link entry has
  // no value, and nothing derives a direction from it.
  useEffect(() => {
    // The guard is here to narrow the type — registering `undefined` would also be
    // harmless, since the only consumer compares *positions* of real values and a
    // key nothing can match never changes their relative order.
    // Stryker disable next-line ConditionalExpression: equivalent — see above.
    if (value === undefined) return;
    registerItem(value, itemRef.current);
    // Unregistering can't be observed through the published order: a replaced key
    // still points at the same <li>, so a leaked one sorts to the same position as
    // its replacement. It is here to stop the registry growing without bound.
    // Stryker disable next-line ArrowFunction: equivalent — see above.
    return () => registerItem(value, null);
  }, [value, registerItem]);

  return (
    <NavigationMenuItemProvider value={itemContextValue}>
      <li ref={itemRef} {...rest}>
        {children}
      </li>
    </NavigationMenuItemProvider>
  );
}

/** @internal */
NavigationMenuItem.displayName = "NavigationMenuItem";

/**
 * The control that opens an entry's panel — renders a `<button>` with
 * `aria-expanded`, `aria-controls`, and the hover-intent and keyboard handlers
 * wired up.
 *
 * The ids used for `aria-controls` and the matching `Content`'s
 * `aria-labelledby` are derived from the root's `useId()` plus the Item's
 * `value`, so they are stable and unique even with several navs on a page.
 *
 * **Keyboard support** (ARIA APG *Disclosure Navigation Menu*):
 *
 * | Key | Behaviour |
 * | --- | --- |
 * | `Enter` / `Space` | Toggle this entry's panel |
 * | `ArrowRight` / `ArrowLeft` | Move between top-level entries (horizontal), mirrored under RTL |
 * | `ArrowUp` / `ArrowDown` | Move between top-level entries (vertical) |
 * | `Home` / `End` | Jump to the first / last top-level entry |
 * | `ArrowDown` (horizontal), `ArrowRight`/`ArrowLeft` (vertical) | Open the panel and move focus to its first link |
 * | `Escape` | Close and return focus here |
 *
 * Movement **wraps** at the ends. Every top-level entry stays in the tab order
 * — this is deliberately **not** a roving tabindex, because a keyboard user
 * must be able to Tab through page links without discovering that arrows are
 * required.
 *
 * **Clicking is not the same as hovering.** A pointer that arrives to click
 * fires `pointerenter` first, which with hover-to-open opens the panel before
 * the click lands. The trigger therefore toggles against what was open when the
 * pointer *arrived*, so a click never undoes the user's own hover.
 *
 * **`asChild` prop.** Pass `asChild` to render an arbitrary element instead of
 * the `<button>`; all ARIA attributes, handlers, and the internal registry ref
 * are merged onto the child following the {@link Slot} composition rules
 * (handlers compose, `style` shallow-merges with the child winning, `className`
 * concatenates, refs compose). The child must be a single element accepting a
 * `ref`.
 *
 * **Styling hooks.** `data-state="open" | "closed"`. Also publishes its own
 * `anchor-name` (a plain inline style, not a data attribute) so the shared
 * {@link NavigationMenuViewport | `Viewport`} can be CSS-anchor-positioned to
 * whichever trigger opened it — no consumer wiring required.
 *
 * @extends HTMLButtonElement
 *
 * @example
 * ```tsx
 * <NavigationMenu.Trigger>Concepts</NavigationMenu.Trigger>
 * ```
 *
 * @example Label plus a chevron the stylesheet rotates on open
 * ```tsx
 * <NavigationMenu.Trigger>
 *   <span>Concepts</span>
 *   <ChevronDownIcon aria-hidden />
 * </NavigationMenu.Trigger>
 * ```
 */
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
    anchorName,
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
  //
  // `composeRefs` accepts `undefined`, so always composing would reach the same
  // ref target; the ternary is here to avoid handing React a fresh callback-ref
  // identity on every render, which would detach and re-attach the node each
  // time. That churn settles within the same commit, so no assertion can see it.
  // Stryker disable next-line ConditionalExpression: the always-compose variant is equivalent — same ref target, only unobservable re-attach churn.
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
    // Placed after `...rest` so it isn't clobbered by a bare consumer `style` —
    // a consumer's own anchor-name (if any) still wins inside this merge.
    style: { anchorName, ...rest.style },
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

/** @internal */
NavigationMenuTrigger.displayName = "NavigationMenuTrigger";

/**
 * An entry's panel — renders a `<div>` linked to its trigger by
 * `aria-labelledby`, hidden with the native `hidden` attribute while closed.
 *
 * Inactive panels stay **mounted**, which preserves their state (scroll
 * position, form input) across opens. Render the `Content` conditionally
 * yourself if you need true unmount semantics.
 *
 * **Projection.** When a {@link NavigationMenuViewport | `Viewport`} is present
 * anywhere in the Root, the panel is portalled into it instead of rendering
 * where it was authored — that is what lets one open panel morph into the next
 * rather than each entry growing its own box. Without a Viewport it renders in
 * place. Authoring is identical either way: always nest the `Content` inside its
 * `Item`, next to its `Trigger`.
 *
 * **Panel links are not top-level entries.** A
 * {@link NavigationMenuLink | `Link`} inside a `Content` is reached by Tab and
 * is deliberately excluded from the top-level arrow-key order, so `Home`/`End`
 * inside a panel don't jump out of it.
 *
 * **Styling hooks.** `data-state="open" | "closed"`.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <NavigationMenu.Content>
 *   <NavigationMenu.Link href="/tokens">Tokens</NavigationMenu.Link>
 *   <NavigationMenu.Link href="/themes">Themes</NavigationMenu.Link>
 * </NavigationMenu.Content>
 * ```
 *
 * @example forceMount, for a CSS-animated panel
 * ```tsx
 * <NavigationMenu.Content forceMount className="panel">...</NavigationMenu.Content>
 * ```
 * ```css
 * .panel { opacity: 0; transition: opacity 150ms; }
 * .panel[data-state="open"] { opacity: 1; }
 * ```
 *
 * **`data-motion`.** When the open entry changes, the entering and leaving panels
 * report the direction of travel — `from-start` / `from-end` / `to-start` /
 * `to-end` — so a stylesheet can slide them rather than cross-fading every
 * switch. Absent for the first open and the full close, which have no direction.
 */
export function NavigationMenuContent({
  children,
  forceMount = false,
  ...rest
}: NavigationMenuContentProps): ReactElement | ReactPortal {
  const { viewport, openValue, previousValue, itemValues } =
    useNavigationMenuContext();
  const { triggerId, panelId, open, state, value } = useNavigationMenuEntry();
  // Which way this panel is travelling, so a stylesheet can slide it in the
  // direction of the pointer rather than cross-fading every switch. Absent for
  // the first open and the full close, which have no direction.
  const motion = getPanelMotion({
    value,
    openValue,
    previousValue,
    itemValues,
  });

  const panel = (
    <NavigationMenuPanelProvider value={true}>
      <div
        id={panelId}
        aria-labelledby={triggerId}
        data-state={state}
        data-motion={motion}
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

/** @internal */
NavigationMenuContent.displayName = "NavigationMenuContent";

/**
 * Publishes the open panel's measured size as
 * `--primitiv-navigation-menu-viewport-width` / `-height`, so a stylesheet can
 * transition the shared box between panels. The measurement is kept through the
 * close — clearing it would collapse the box just as the exit needs its size.
 *
 * The single shared box every {@link NavigationMenuContent | `Content`} renders
 * into — renders a `<div>`, hidden while nothing is open.
 *
 * Optional. Mount one when you want the desktop "one panel morphs into the
 * next" behaviour: because all panels live in this element, a CSS transition on
 * its size animates between them instead of each entry expanding separately.
 * Omit it and panels render in place, which is the simpler layout.
 *
 * Place it as a sibling of {@link NavigationMenuList | `List`}, inside the
 * Root. It has no children of its own to author — panels arrive by portal,
 * projected into an internal element it renders for exactly that.
 *
 * **Styling hooks.** `data-state="open" | "closed"`,
 * `data-orientation="horizontal" | "vertical"`, and `data-value` carrying the
 * open entry's value, so a stylesheet can size or theme the box per panel
 * without the consumer threading state back in.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <NavigationMenu.Root>
 *   <NavigationMenu.List>...</NavigationMenu.List>
 *   <NavigationMenu.Viewport className="viewport" />
 * </NavigationMenu.Root>
 * ```
 *
 * @example Sizing the shared box per panel
 * ```css
 * .viewport { transition: height 200ms; }
 * .viewport[data-value="registry"] { height: 12rem; }
 * ```
 */
export function NavigationMenuViewport({
  forceMount = false,
  ...rest
}: NavigationMenuViewportProps): ReactElement {
  const { registerViewport } = useNavigationMenuContext();
  const { open, openValue, orientation, style } = useNavigationMenuViewport();

  return (
    <div
      data-orientation={orientation}
      data-state={open ? "open" : "closed"}
      // The open entry's value, so a stylesheet can size or theme the shared
      // box per panel without the consumer threading state back in.
      data-value={openValue || undefined}
      hidden={forceMount ? undefined : !open}
      // The measured size of the open panel, so the shared box can transition
      // between panels. A consumer `style` merges over the top.
      style={{ ...style, ...rest.style }}
      {...rest}
    >
      {/* The portal target, split from the outer box above: the outer one
          hosts the hover-forgiveness collar (a ::before that must extend past
          its own edges to widen the hit area — see the registry stylesheet),
          which an overflow clip on that same box would cut off. This inner
          element is what actually clips a sliding panel to the visible box,
          and is what Content portals into — `viewport` in context is this
          node, not the outer one. className is hardcoded (the same pattern
          Carousel's own internal track div uses): it names an implementation
          detail no consumer ever targets via a prop, not a themable part. */}
      <div
        ref={registerViewport}
        className="primitiv-navigation-menu__viewport-clip"
        data-navigation-menu-viewport-clip=""
      />
    </div>
  );
}

/** @internal */
NavigationMenuViewport.displayName = "NavigationMenuViewport";

/**
 * The marker that tracks the open trigger — an underline, arrow, or highlight —
 * rendered as a `<div>`, hidden while nothing is open.
 *
 * Optional, and purely a measurement carrier: because no styles ship with the
 * library, the Indicator cannot position itself, but it is the only part that
 * can know *where* the open trigger is. It measures that trigger and publishes
 * the result as two inline custom properties, leaving the stylesheet to decide
 * whether tracking means a `translate`, a `left`, or a border:
 *
 * - `--primitiv-navigation-menu-indicator-position` — the trigger's
 *   `offsetLeft` when horizontal, `offsetTop` when vertical.
 * - `--primitiv-navigation-menu-indicator-size` — its `offsetWidth` when
 *   horizontal, `offsetHeight` when vertical.
 *
 * Both are re-measured whenever the open entry changes and on window `resize`,
 * so the marker doesn't drift off its trigger after the nav rewraps. When the
 * open value names an entry with no rendered trigger, neither property is set —
 * better an unpositioned marker than one parked at `0`.
 *
 * **`asChild` prop.** Pass `asChild` to make the marker an element of your own
 * — an `<svg>` arrow, an icon component — instead of a styled `<div>`. The
 * `data-*` hooks and the geometry custom properties are merged onto the child
 * via {@link Slot}, so an icon tracks the trigger exactly as the default box
 * does.
 *
 * **Styling hooks.** `data-state="open" | "closed"`,
 * `data-orientation="horizontal" | "vertical"`, `data-value`.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <NavigationMenu.Indicator className="indicator" />
 * ```
 *
 * @example asChild — an arrow icon rather than a styled box
 * ```tsx
 * <NavigationMenu.Indicator asChild>
 *   <ChevronUpIcon aria-hidden />
 * </NavigationMenu.Indicator>
 * ```
 * ```css
 * .indicator {
 *   position: absolute;
 *   inset-block-end: 0;
 *   block-size: 2px;
 *   inline-size: var(--primitiv-navigation-menu-indicator-size);
 *   translate: var(--primitiv-navigation-menu-indicator-position) 0;
 *   transition: translate 200ms, inline-size 200ms;
 * }
 * ```
 */
export function NavigationMenuIndicator({
  children,
  forceMount = false,
  asChild = false,
  style,
  ...rest
}: NavigationMenuIndicatorProps): ReactElement {
  const {
    open,
    openValue,
    orientation,
    style: geometryStyle,
  } = useNavigationMenuIndicator();

  const indicatorProps = {
    "data-orientation": orientation,
    "data-state": open ? ("open" as const) : ("closed" as const),
    "data-value": openValue || undefined,
    hidden: forceMount ? undefined : !open,
    // Consumer style last: the geometry is ours to publish, but everything
    // else about the marker belongs to the stylesheet.
    style: { ...geometryStyle, ...style },
    ...rest,
  };

  if (asChild) {
    return <Slot {...indicatorProps}>{children}</Slot>;
  }

  return <div {...indicatorProps}>{children}</div>;
}

/** @internal */
NavigationMenuIndicator.displayName = "NavigationMenuIndicator";

/**
 * A link to a page — renders an `<a>`.
 *
 * The one part **shared by both presentations** of the nav. On desktop it is
 * used inside a {@link NavigationMenuContent | `Content`} panel and as a
 * top-level {@link NavigationMenuItem | `Item`}'s only child; in the composed
 * mobile nav (a `Drawer` + `Collapsible` per section) it is imported directly,
 * so active-state logic is written once rather than per presentation.
 *
 * **Active state.** {@link NavigationMenuLinkProps.active | `active`} sets
 * `aria-current="page"` and the `data-active` styling hook. No route matching
 * happens here — the consumer owns the router, so the consumer owns the
 * comparison.
 *
 * **Clicking closes the menu**, whether the link sits in a panel or beside one.
 * Leaving a panel hanging open over the page the user just navigated to is the
 * bug this avoids. Consumers can veto it by calling `event.preventDefault()` in
 * their own `onClick`.
 *
 * **Position decides keyboard reachability.** Directly inside an `Item`, the
 * link is a top-level entry and joins the arrow-key travel order. Inside a
 * `Content`, it is reached by Tab and stays out of that order.
 *
 * **`asChild` prop.** Pass `asChild` to render a routing library's link
 * component instead of the native `<a>`, with `aria-current`, `data-active`, the
 * dismissing click handler and the ref merged onto it via {@link Slot}.
 *
 * **Styling hooks.** `data-active=""` when active (omitted otherwise), so CSS
 * can target `[data-active]`.
 *
 * @extends HTMLAnchorElement
 *
 * @example
 * ```tsx
 * <NavigationMenu.Link href="/tokens" active={pathname === "/tokens"}>
 *   Tokens
 * </NavigationMenu.Link>
 * ```
 *
 * @example With a router link
 * ```tsx
 * <NavigationMenu.Link asChild active={isActive}>
 *   <RouterLink to="/tokens">Tokens</RouterLink>
 * </NavigationMenu.Link>
 * ```
 */
export function NavigationMenuLink({
  children,
  active = false,
  asChild = false,
  onKeyDown,
  onClick,
  onPointerEnter,
  ...rest
}: NavigationMenuLinkProps): ReactElement {
  const { linkRef, handleKeyDown, handleClick, handlePointerEnter } =
    useNavigationMenuLink({
      onKeyDown,
      onClick,
      onPointerEnter,
    });

  const linkProps = {
    ref: linkRef,
    "aria-current": active ? ("page" as const) : undefined,
    "data-active": active ? "" : undefined,
    onKeyDown: handleKeyDown,
    onClick: handleClick,
    onPointerEnter: handlePointerEnter,
    ...rest,
  };

  if (asChild) {
    return <Slot {...linkProps}>{children}</Slot>;
  }

  return <a {...linkProps}>{children}</a>;
}

/** @internal */
NavigationMenuLink.displayName = "NavigationMenuLink";

/** Type of the {@link NavigationMenu} compound: the callable root plus its
 * attached sub-components. */
export type TNavigationMenuCompound = typeof NavigationMenuRoot & {
  Root: typeof NavigationMenuRoot;
  List: typeof NavigationMenuList;
  Item: typeof NavigationMenuItem;
  Trigger: typeof NavigationMenuTrigger;
  Content: typeof NavigationMenuContent;
  Viewport: typeof NavigationMenuViewport;
  Indicator: typeof NavigationMenuIndicator;
  Link: typeof NavigationMenuLink;
};

/**
 * Headless, accessible **NavigationMenu** — the desktop dropdown site nav, built
 * on the [ARIA APG Disclosure Navigation Menu
 * pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/):
 * a `<nav>` landmark wrapping a list of top-level entries, each either a plain
 * link or a trigger that discloses a panel. One panel is open at a time. Zero
 * styles ship.
 *
 * `NavigationMenu` is both callable (an alias of
 * {@link NavigationMenuRoot | `NavigationMenu.Root`}) and carries its
 * sub-components as static properties. Prefer the namespaced form in application
 * code for readability and grep-ability:
 *
 * - {@link NavigationMenuRoot | `NavigationMenu.Root`} — `<nav>` landmark, state owner, context provider.
 * - {@link NavigationMenuList | `NavigationMenu.List`} — `<ul>` of top-level entries.
 * - {@link NavigationMenuItem | `NavigationMenu.Item`} — `<li>`; its `value` makes the entry a disclosure.
 * - {@link NavigationMenuTrigger | `NavigationMenu.Trigger`} — `<button>` that opens a panel.
 * - {@link NavigationMenuContent | `NavigationMenu.Content`} — the panel, projected into a `Viewport` when one exists.
 * - {@link NavigationMenuViewport | `NavigationMenu.Viewport`} — *optional* shared host so panels morph in one box.
 * - {@link NavigationMenuIndicator | `NavigationMenu.Indicator`} — *optional* marker tracking the open trigger.
 * - {@link NavigationMenuLink | `NavigationMenu.Link`} — `<a>` with `aria-current`; shared with the mobile nav.
 *
 * **Scope: this is the desktop presentation.** The mobile nav is deliberately
 * *not* a mode of this component — its interaction model differs (several
 * sections expanded in place, rather than one panel at a time), so it is built
 * as a composition of `Drawer` + `Collapsible` reusing this component's
 * `NavigationMenu.Link`. Both presentations map over the same nav data, which
 * stays the consumer's. See RFC 0019 §3–4a for the reasoning.
 *
 * @example Minimal usage
 * ```tsx
 * import { NavigationMenu } from "@primitiv-ui/react";
 *
 * export function SiteNav() {
 *   return (
 *     <NavigationMenu.Root>
 *       <NavigationMenu.List>
 *         <NavigationMenu.Item value="concepts">
 *           <NavigationMenu.Trigger>Concepts</NavigationMenu.Trigger>
 *           <NavigationMenu.Content>
 *             <NavigationMenu.Link href="/tokens">Tokens</NavigationMenu.Link>
 *           </NavigationMenu.Content>
 *         </NavigationMenu.Item>
 *         <NavigationMenu.Item>
 *           <NavigationMenu.Link href="/changelog">Changelog</NavigationMenu.Link>
 *         </NavigationMenu.Item>
 *       </NavigationMenu.List>
 *     </NavigationMenu.Root>
 *   );
 * }
 * ```
 *
 * @example Styling with any system
 * Because no styles ship, target the rendered elements or the `data-*` hooks
 * with whatever system you use:
 *
 * ```css
 * nav [data-state="closed"] { display: none; }
 * nav button[data-state="open"] > svg { rotate: 180deg; }
 * nav a[data-active] { font-weight: 600; }
 * ```
 *
 * @see {@link NavigationMenuRoot} for the state modes, hover-intent timings, and Escape handling.
 * @see {@link NavigationMenuItem} for why `value` is what makes an entry a disclosure.
 * @see {@link NavigationMenuTrigger} for the full keyboard-interaction table.
 * @see {@link NavigationMenuViewport} for the shared-panel morph.
 * @see {@link NavigationMenuIndicator} for the geometry custom properties.
 * @see {@link NavigationMenuLink} for the active-state contract shared with the mobile nav.
 */
const NavigationMenuCompound: TNavigationMenuCompound = Object.assign(
  NavigationMenuRoot,
  {
    Root: NavigationMenuRoot,
    List: NavigationMenuList,
    Item: NavigationMenuItem,
    Trigger: NavigationMenuTrigger,
    Content: NavigationMenuContent,
    Viewport: NavigationMenuViewport,
    Indicator: NavigationMenuIndicator,
    Link: NavigationMenuLink,
  },
);

/** @internal */
NavigationMenuCompound.displayName = "NavigationMenu";

export { NavigationMenuCompound as NavigationMenu };
