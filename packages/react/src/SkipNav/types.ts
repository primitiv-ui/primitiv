import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";

/**
 * Props for {@link SkipNav.Link} — `children`, an optional `contentId`,
 * plus all `AnchorHTMLAttributes` on the rendered `<a>`.
 */
export type SkipNavLinkProps = {
  children?: ReactNode;
  /**
   * Id of the matching {@link SkipNav.Content} target. The link's `href`
   * is derived as `#${contentId}`. Defaults to a shared id, so an
   * unconfigured `SkipNav.Link` / `SkipNav.Content` pair works as-is.
   */
  contentId?: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

/**
 * Props for {@link SkipNav.Content} — `children` plus all `HTMLAttributes`
 * on the rendered `<div>`.
 *
 * Pass a custom `id` only if you set a matching `contentId` on
 * {@link SkipNav.Link}; it defaults to the same shared id.
 */
export type SkipNavContentProps = {
  children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;
