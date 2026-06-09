import { SkipNavContentProps, SkipNavLinkProps } from "./types";

const DEFAULT_CONTENT_ID = "primitiv-skip-nav";

/**
 * The skip link itself — an `<a>` that jumps keyboard and screen-reader
 * users past repeated navigation straight to the main content.
 *
 * Place it as the very first focusable element on the page (typically the
 * first child of `<body>`). It is a normal in-page anchor: its `href` is a
 * URL fragment pointing at the `id` of the matching {@link SkipNavContent |
 * `SkipNav.Content`}, so following it moves focus there with no JavaScript.
 *
 * **`contentId`.** The `href` is derived as `#${contentId}` and defaults to
 * a shared id, so an unconfigured `SkipNav.Link` / `SkipNav.Content` pair
 * works out of the box. Override `contentId` on the link only if you also
 * set a matching `id` on the content.
 *
 * **Visibility.** The link ships with no styles. The conventional pattern
 * is to keep it visually hidden until focused — see the component README
 * for the canonical CSS.
 *
 * @example Default — shared content id
 * ```tsx
 * <SkipNav.Link>Skip to main content</SkipNav.Link>
 * ```
 *
 * @example Custom content id
 * ```tsx
 * <SkipNav.Link contentId="main">Skip to main content</SkipNav.Link>
 * ```
 */
function SkipNavLink({
  children,
  contentId = DEFAULT_CONTENT_ID,
  ...rest
}: SkipNavLinkProps) {
  return (
    <a href={`#${contentId}`} {...rest}>
      {children}
    </a>
  );
}

SkipNavLink.displayName = "SkipNavLink";

/**
 * The skip target — a `<div>` placed at the start of the main content that
 * {@link SkipNavLink | `SkipNav.Link`} jumps to.
 *
 * It carries `tabIndex={-1}` so it is a valid focus destination for an
 * in-page fragment navigation: when the link is followed, the browser
 * scrolls to this element *and* moves focus into it, so the next Tab press
 * continues from the main content rather than the top of the page.
 *
 * **`id`.** Defaults to the same shared id as `SkipNav.Link`'s `contentId`.
 * Pass a custom `id` only if you set a matching `contentId` on the link.
 *
 * @example
 * ```tsx
 * <SkipNav.Content>
 *   <main>…</main>
 * </SkipNav.Content>
 * ```
 */
function SkipNavContent({ children, ...rest }: SkipNavContentProps) {
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
 * navigation.
 *
 * It is a stateless pair of sub-components, used as siblings rather than
 * nested:
 *
 * - {@link SkipNavLink | `SkipNav.Link`} — the `<a>` skip link; render it
 *   first on the page.
 * - {@link SkipNavContent | `SkipNav.Content`} — the focusable `<div>`
 *   target wrapping the main content.
 *
 * The two connect by a shared content id with a sensible default, so the
 * common case needs no configuration.
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
 * @see {@link SkipNavLink} for the `contentId` contract and the visually-hidden-until-focused CSS pattern.
 */
const SkipNav = {
  Link: SkipNavLink,
  Content: SkipNavContent,
};

export { SkipNav };
