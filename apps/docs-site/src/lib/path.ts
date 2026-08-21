/**
 * Normalises a path for comparison.
 *
 * `next.config.ts` sets `trailingSlash: true` (so a static host can resolve
 * `/components/button/` to an `index.html` without rewrite rules), which means
 * `usePathname()` returns `"/components/select/"` — with the slash — while the
 * hrefs in `lib/nav.ts` are written without one. Comparing them raw silently
 * fails: no `aria-current` anywhere, and the sidebar section for the page you
 * are actually on starts collapsed.
 *
 * Stripping trailing slashes on both sides makes the comparison independent of
 * how either value happens to be written. Root stays `"/"` rather than
 * collapsing to the empty string.
 */
export const samePath = (a: string, b: string): boolean =>
  normalise(a) === normalise(b);

export const normalise = (path: string): string =>
  path.replace(/\/+$/, "") || "/";

/** Strips a `#fragment` before comparing, for nav entries that link to one. */
export const samePage = (href: string, pathname: string): boolean =>
  samePath(href.split("#")[0], pathname);
