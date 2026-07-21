import type { ReactElement } from "react";

import { SkipNavContentProps, SkipNavLinkProps } from "./types";

const DEFAULT_CONTENT_ID = "primitiv-skip-nav";

/**
 * The skip link — an `<a>` that jumps keyboard and screen-reader users past
 * repeated navigation straight to the main content.
 *
 * Place it as the very first focusable element on the page (typically the
 * first child of `<body>`). It is a plain in-page anchor: its `href` is a
 * URL fragment pointing at the `id` of the matching {@link SkipNavContent |
 * `SkipNav.Content`}, so following it moves focus there with no JavaScript.
 *
 * **`contentId`.** The `href` is derived as `#${contentId}` and defaults to
 * a shared id (`"primitiv-skip-nav"`), so an unconfigured
 * `SkipNav.Link` / `SkipNav.Content` pair works out of the box. Override
 * `contentId` on the link only if you also set a matching `id` on
 * {@link SkipNavContent | `SkipNav.Content`}.
 *
 * **Visibility.** No styles ship with the component. The conventional
 * pattern keeps the link visually hidden until it receives focus — position
 * it off-screen by default and restore it on `:focus`. Do **not** use
 * `display: none` or `visibility: hidden`, as those remove it from the tab
 * order entirely:
 *
 * ```css
 * a[href="#primitiv-skip-nav"] { position: absolute; left: -9999px; }
 * a[href="#primitiv-skip-nav"]:focus { left: 0; top: 0; }
 * ```
 *
 * Alternatively, pass a `className` and target that class in your
 * stylesheet.
 *
 * @extends HTMLAnchorElement
 *
 * @example Default — shared content id
 * ```tsx
 * <SkipNav.Link>Skip to main content</SkipNav.Link>
 * ```
 *
 * @example Custom content id (must match the `id` on `SkipNav.Content`)
 * ```tsx
 * <SkipNav.Link contentId="main">Skip to main content</SkipNav.Link>
 * ```
 */
function SkipNavLink({
  children,
  contentId = DEFAULT_CONTENT_ID,
  ...rest
}: SkipNavLinkProps): ReactElement {
  return (
    <a href={`#${contentId}`} {...rest}>
      {children}
    </a>
  );
}

SkipNavLink.displayName = "SkipNavLink";

/**
 * The skip target — a `<div tabIndex={-1}>` placed at the start of the main
 * content that {@link SkipNavLink | `SkipNav.Link`} jumps to.
 *
 * `tabIndex={-1}` makes the element a valid programmatic focus destination:
 * when the link is followed the browser scrolls to this element *and* moves
 * focus into it, so the next <kbd>Tab</kbd> press continues from within the
 * main content rather than cycling back to the top of the page. No
 * JavaScript runs; it is pure anchor navigation.
 *
 * **`id`.** Defaults to the same shared id (`"primitiv-skip-nav"`) as
 * {@link SkipNavLink | `SkipNav.Link`}'s `contentId`. Pass a custom `id`
 * via the native `id` prop only if you set a matching `contentId` on the
 * link — the spread props override the default, so the two always stay in
 * sync.
 *
 * @extends HTMLDivElement
 *
 * @example Default — wraps the main page content
 * ```tsx
 * <SkipNav.Content>
 *   <main>…</main>
 * </SkipNav.Content>
 * ```
 *
 * @example Custom id (must match `contentId` on `SkipNav.Link`)
 * ```tsx
 * <SkipNav.Content id="main">
 *   <main>…</main>
 * </SkipNav.Content>
 * ```
 */
function SkipNavContent({
  children,
  ...rest
}: SkipNavContentProps): ReactElement {
  return (
    <div id={DEFAULT_CONTENT_ID} tabIndex={-1} {...rest}>
      {children}
    </div>
  );
}

SkipNavContent.displayName = "SkipNavContent";

/**
 * Headless, accessible **Skip Nav** — a "skip to main content" link and its
 * focus target, letting keyboard and screen-reader users bypass repeated
 * navigation. Implements the
 * [WCAG 2.4.1 Bypass Blocks](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html)
 * technique with no JavaScript — pure in-page anchor navigation.
 *
 * `SkipNav` is a stateless pair of sub-components used as siblings (not
 * nested). Render the link first; place the content wrapper at the start of
 * the main content area:
 *
 * - {@link SkipNavLink | `SkipNav.Link`} — the `<a>` skip link; must be
 *   the first focusable element on the page.
 * - {@link SkipNavContent | `SkipNav.Content`} — the `<div tabIndex={-1}>`
 *   target; wrap it around (or immediately before) your main content.
 *
 * The two sub-components are connected by a shared content id
 * (`"primitiv-skip-nav"`) with no configuration required. Override both
 * sides when you need a custom id.
 *
 * @example Minimal usage
 * ```tsx
 * import { SkipNav } from "@primitiv-ui/react";
 *
 * export function App() {
 *   return (
 *     <>
 *       <SkipNav.Link>Skip to main content</SkipNav.Link>
 *       <header>…site navigation…</header>
 *       <SkipNav.Content>
 *         <main>…</main>
 *       </SkipNav.Content>
 *     </>
 *   );
 * }
 * ```
 *
 * @example Custom id — both sides must match
 * ```tsx
 * <SkipNav.Link contentId="main">Skip to main content</SkipNav.Link>
 * <SkipNav.Content id="main">
 *   <main>…</main>
 * </SkipNav.Content>
 * ```
 *
 * @see {@link SkipNavLink} for the `contentId` contract and the
 *   visually-hidden-until-focused CSS pattern.
 * @see {@link SkipNavContent} for the `tabIndex={-1}` focus-target behaviour.
 */
const SkipNav = {
  Link: SkipNavLink,
  Content: SkipNavContent,
};

export { SkipNav };
