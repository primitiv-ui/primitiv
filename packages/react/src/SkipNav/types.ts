import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";

/**
 * Props for {@link SkipNavLink | `SkipNav.Link`} — `children`, an optional
 * `contentId`, plus all native `<a>` attributes.
 */
export type SkipNavLinkProps = {
  /** The visible link text (e.g. `"Skip to main content"`). */
  children?: ReactNode;
  /**
   * Id of the matching {@link SkipNavContent | `SkipNav.Content`} target.
   * The link's `href` is derived as `#${contentId}`. Defaults to the shared
   * id (`"primitiv-skip-nav"`), so an unconfigured
   * `SkipNav.Link` / `SkipNav.Content` pair works out of the box. Override
   * only when you also set a matching native `id` prop on `SkipNav.Content`.
   * @default "primitiv-skip-nav"
   */
  contentId?: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

/**
 * Props for {@link SkipNavContent | `SkipNav.Content`} — `children` plus
 * all native `<div>` attributes.
 *
 * The component always renders with `tabIndex={-1}` (making it a valid
 * programmatic focus target) and sets `id` to `"primitiv-skip-nav"` by
 * default. Pass a native `id` prop to override the default; when you do,
 * set the same value as `contentId` on {@link SkipNavLink | `SkipNav.Link`}
 * so the anchor's `href` resolves correctly.
 */
export type SkipNavContentProps = {
  /** The main page content that follows the skip target. */
  children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;
