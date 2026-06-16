import { Slot } from "../Slot/index.ts";

import {
  BreadcrumbItemProps,
  BreadcrumbLinkProps,
  BreadcrumbListProps,
  BreadcrumbPageProps,
  BreadcrumbRootProps,
  BreadcrumbSeparatorProps,
} from "./types";

/**
 * The root of a Breadcrumb — a `<nav>` landmark that wraps the breadcrumb
 * trail.
 *
 * The `<nav>` defaults to `aria-label="Breadcrumb"` so assistive technology
 * announces it as the breadcrumb navigation landmark. Override `aria-label`
 * if your product uses different terminology.
 *
 * @example
 * ```tsx
 * <Breadcrumb.Root>
 *   <Breadcrumb.List>…</Breadcrumb.List>
 * </Breadcrumb.Root>
 * ```
 */
function BreadcrumbRoot({ children, ...rest }: BreadcrumbRootProps) {
  return (
    <nav aria-label="Breadcrumb" {...rest}>
      {children}
    </nav>
  );
}

BreadcrumbRoot.displayName = "BreadcrumbRoot";

/**
 * The ordered list of breadcrumb entries — renders an `<ol>`.
 *
 * An ordered list is the correct semantic: breadcrumb entries have a
 * meaningful sequence from the site root to the current page. Contains
 * {@link BreadcrumbItem | `Breadcrumb.Item`}s interleaved with
 * {@link BreadcrumbSeparator | `Breadcrumb.Separator`}s.
 *
 * @example
 * ```tsx
 * <Breadcrumb.List>
 *   <Breadcrumb.Item>…</Breadcrumb.Item>
 *   <Breadcrumb.Separator />
 *   <Breadcrumb.Item>…</Breadcrumb.Item>
 * </Breadcrumb.List>
 * ```
 */
function BreadcrumbList({ children, ...rest }: BreadcrumbListProps) {
  return <ol {...rest}>{children}</ol>;
}

BreadcrumbList.displayName = "BreadcrumbList";

/**
 * A single entry in the breadcrumb trail — renders an `<li>`.
 *
 * Wraps either a {@link BreadcrumbLink | `Breadcrumb.Link`} (an ancestor
 * page) or a {@link BreadcrumbPage | `Breadcrumb.Page`} (the current page).
 *
 * @example
 * ```tsx
 * <Breadcrumb.Item>
 *   <Breadcrumb.Link href="/library">Library</Breadcrumb.Link>
 * </Breadcrumb.Item>
 * ```
 */
function BreadcrumbItem({ children, ...rest }: BreadcrumbItemProps) {
  return <li {...rest}>{children}</li>;
}

BreadcrumbItem.displayName = "BreadcrumbItem";

/**
 * A link to an ancestor page — renders an `<a>`.
 *
 * Use for every entry except the current page. Pass `href` (and any other
 * anchor attributes) directly.
 *
 * **`asChild` prop.** Pass `asChild` to render a consumer-supplied element —
 * typically a routing library's `<Link>` — with the breadcrumb link's props
 * merged in. The native `<a>` is dropped.
 *
 * @example
 * ```tsx
 * <Breadcrumb.Link href="/library">Library</Breadcrumb.Link>
 * ```
 *
 * @example With a router link
 * ```tsx
 * <Breadcrumb.Link asChild>
 *   <RouterLink to="/library">Library</RouterLink>
 * </Breadcrumb.Link>
 * ```
 */
function BreadcrumbLink({
  children,
  asChild = false,
  ...rest
}: BreadcrumbLinkProps) {
  if (asChild) {
    return <Slot {...rest}>{children}</Slot>;
  }
  return <a {...rest}>{children}</a>;
}

BreadcrumbLink.displayName = "BreadcrumbLink";

/**
 * The current page in the trail — renders a `<span aria-current="page">`.
 *
 * The last entry of a breadcrumb is the page the user is on, so it is not a
 * link. `aria-current="page"` tells assistive technology this entry
 * represents the current location.
 *
 * @example
 * ```tsx
 * <Breadcrumb.Item>
 *   <Breadcrumb.Page>Current article</Breadcrumb.Page>
 * </Breadcrumb.Item>
 * ```
 */
function BreadcrumbPage({ children, ...rest }: BreadcrumbPageProps) {
  return (
    <span aria-current="page" {...rest}>
      {children}
    </span>
  );
}

BreadcrumbPage.displayName = "BreadcrumbPage";

/**
 * The visual divider between two breadcrumb entries — renders an
 * `<li role="presentation" aria-hidden="true">`.
 *
 * The separator sits inside the `<ol>` as a sibling of the
 * {@link BreadcrumbItem | `Breadcrumb.Item`}s, but `role="presentation"`
 * removes it from the list semantics and `aria-hidden` hides it from the
 * accessibility tree — it is purely decorative.
 *
 * Defaults to a `"/"` glyph; pass `children` to use a custom separator (an
 * icon, a chevron, etc.).
 *
 * @example Default separator
 * ```tsx
 * <Breadcrumb.Separator />
 * ```
 *
 * @example Custom separator
 * ```tsx
 * <Breadcrumb.Separator><ChevronRight /></Breadcrumb.Separator>
 * ```
 */
function BreadcrumbSeparator({
  children = "/",
  ...rest
}: BreadcrumbSeparatorProps) {
  return (
    <li role="presentation" aria-hidden="true" {...rest}>
      {children}
    </li>
  );
}

BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

type TBreadcrumbCompound = typeof BreadcrumbRoot & {
  Root: typeof BreadcrumbRoot;
  List: typeof BreadcrumbList;
  Item: typeof BreadcrumbItem;
  Link: typeof BreadcrumbLink;
  Page: typeof BreadcrumbPage;
  Separator: typeof BreadcrumbSeparator;
};

/**
 * Headless, accessible **Breadcrumb** — a compound component implementing the
 * [WAI-ARIA breadcrumb pattern](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/):
 * a `<nav>` landmark wrapping an ordered list of links to ancestor pages,
 * ending with the current page. Stateless — purely structural. Zero styles
 * ship.
 *
 * `Breadcrumb` is both callable (an alias of
 * {@link BreadcrumbRoot | `Breadcrumb.Root`}) and carries its sub-components
 * as static properties.
 *
 * - {@link BreadcrumbRoot | `Breadcrumb.Root`} — `<nav aria-label="Breadcrumb">`.
 * - {@link BreadcrumbList | `Breadcrumb.List`} — `<ol>`, the ordered trail.
 * - {@link BreadcrumbItem | `Breadcrumb.Item`} — `<li>`, one entry.
 * - {@link BreadcrumbLink | `Breadcrumb.Link`} — `<a>`, an ancestor-page link.
 * - {@link BreadcrumbPage | `Breadcrumb.Page`} — `<span aria-current="page">`, the current page.
 * - {@link BreadcrumbSeparator | `Breadcrumb.Separator`} — decorative `<li>` divider.
 *
 * @example Minimal usage
 * ```tsx
 * import { Breadcrumb } from "@primitiv-ui/react";
 *
 * <Breadcrumb.Root>
 *   <Breadcrumb.List>
 *     <Breadcrumb.Item>
 *       <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
 *     </Breadcrumb.Item>
 *     <Breadcrumb.Separator />
 *     <Breadcrumb.Item>
 *       <Breadcrumb.Link href="/library">Library</Breadcrumb.Link>
 *     </Breadcrumb.Item>
 *     <Breadcrumb.Separator />
 *     <Breadcrumb.Item>
 *       <Breadcrumb.Page>Current article</Breadcrumb.Page>
 *     </Breadcrumb.Item>
 *   </Breadcrumb.List>
 * </Breadcrumb.Root>
 * ```
 *
 * @see {@link BreadcrumbSeparator} for customising the divider glyph.
 */
const BreadcrumbCompound: TBreadcrumbCompound = Object.assign(BreadcrumbRoot, {
  Root: BreadcrumbRoot,
  List: BreadcrumbList,
  Item: BreadcrumbItem,
  Link: BreadcrumbLink,
  Page: BreadcrumbPage,
  Separator: BreadcrumbSeparator,
});

BreadcrumbCompound.displayName = "Breadcrumb";

export { BreadcrumbCompound as Breadcrumb };
