import { ComponentProps } from "react";

/**
 * Props for {@link BreadcrumbRoot | `Breadcrumb.Root`} — all native `<nav>`
 * attributes. `aria-label` defaults to `"Breadcrumb"` when omitted; pass it
 * explicitly to override the accessible name announced to assistive
 * technology.
 *
 * @extends HTMLElement
 */
export type BreadcrumbRootProps = ComponentProps<"nav">;

/**
 * Props for {@link BreadcrumbList | `Breadcrumb.List`} — all native `<ol>`
 * attributes. No props are added; content is
 * {@link BreadcrumbItem | `Breadcrumb.Item`}s interleaved with
 * {@link BreadcrumbSeparator | `Breadcrumb.Separator`}s.
 *
 * @extends HTMLOListElement
 */
export type BreadcrumbListProps = ComponentProps<"ol">;

/**
 * Props for {@link BreadcrumbItem | `Breadcrumb.Item`} — all native `<li>`
 * attributes. No props are added; wraps a single
 * {@link BreadcrumbLink | `Breadcrumb.Link`} or
 * {@link BreadcrumbPage | `Breadcrumb.Page`}.
 *
 * @extends HTMLLIElement
 */
export type BreadcrumbItemProps = ComponentProps<"li">;

/**
 * Props for {@link BreadcrumbLink | `Breadcrumb.Link`} — all native `<a>`
 * attributes plus the `asChild` escape hatch.
 *
 * @extends HTMLAnchorElement
 */
export type BreadcrumbLinkProps = ComponentProps<"a"> & {
  /**
   * Renders the child element instead of a native `<a>`, merging all of
   * `Breadcrumb.Link`'s props — `href`, event handlers, `className`,
   * `ref` — onto it via {@link Slot}. Use for routing-library link
   * components (e.g. React Router's `<Link>`) that need breadcrumb
   * semantics. See the `asChild` example on {@link BreadcrumbLink}.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Props for {@link BreadcrumbPage | `Breadcrumb.Page`} — all native
 * `<span>` attributes. `aria-current="page"` is fixed by the component and
 * cannot be overridden through these props.
 *
 * @extends HTMLSpanElement
 */
export type BreadcrumbPageProps = ComponentProps<"span">;

/**
 * Props for {@link BreadcrumbSeparator | `Breadcrumb.Separator`} — all
 * native `<li>` attributes. `role="presentation"` and `aria-hidden="true"`
 * are fixed by the component; `children` defaults to a `"/"` glyph when
 * omitted (see {@link BreadcrumbSeparator}'s custom-separator example).
 *
 * @extends HTMLLIElement
 */
export type BreadcrumbSeparatorProps = ComponentProps<"li">;
