import { ComponentProps } from "react";

/** Props for {@link Breadcrumb.Root} — all `<nav>` attributes. */
export type BreadcrumbRootProps = ComponentProps<"nav">;

/** Props for {@link Breadcrumb.List} — all `<ol>` attributes. */
export type BreadcrumbListProps = ComponentProps<"ol">;

/** Props for {@link Breadcrumb.Item} — all `<li>` attributes. */
export type BreadcrumbItemProps = ComponentProps<"li">;

/** Props for {@link Breadcrumb.Link} — all `<a>` attributes plus `asChild`. */
export type BreadcrumbLinkProps = ComponentProps<"a"> & {
  /** Render the consumer's own element instead of the native `<a>`. */
  asChild?: boolean;
};

/** Props for {@link Breadcrumb.Page} — all `<span>` attributes. */
export type BreadcrumbPageProps = ComponentProps<"span">;

/** Props for {@link Breadcrumb.Separator} — all `<li>` attributes. */
export type BreadcrumbSeparatorProps = ComponentProps<"li">;
