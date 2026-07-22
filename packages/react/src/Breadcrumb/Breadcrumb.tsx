import type { ReactElement } from "react";

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
 * Stateless: `Breadcrumb.Root` holds no context and derives no state — it
 * is purely a semantic wrapper. All native `<nav>` attributes pass straight
 * through to the DOM, so there is no controlled/uncontrolled shape to
 * reason about.
 *
 * The `<nav>` defaults to `aria-label="Breadcrumb"` so assistive technology
 * announces it as the breadcrumb navigation landmark, distinguishing it
 * from any other `<nav>` on the page (e.g. primary site navigation).
 * Override `aria-label` if your product uses different terminology (e.g.
 * `"You are here"`).
 *
 * @extends HTMLElement
 *
 * @example
 * ```tsx
 * <Breadcrumb.Root>
 *   <Breadcrumb.List>…</Breadcrumb.List>
 * </Breadcrumb.Root>
 * ```
 *
 * @example Custom accessible name
 * ```tsx
 * <Breadcrumb.Root aria-label="You are here">
 *   <Breadcrumb.List>…</Breadcrumb.List>
 * </Breadcrumb.Root>
 * ```
 */
export function BreadcrumbRoot({
  children,
  ...rest
}: BreadcrumbRootProps): ReactElement {
  return (
    <nav aria-label="Breadcrumb" {...rest}>
      {children}
    </nav>
  );
}

// No displayName here: BreadcrumbRoot is the object the compound aliases via
// Object.assign (see below), which sets displayName once to "Breadcrumb". An
// assignment here would be dead — immediately overwritten at module load.

/**
 * The ordered list of breadcrumb entries — renders an `<ol>`.
 *
 * An ordered list is the correct semantic: breadcrumb entries have a
 * meaningful sequence from the site root to the current page (unlike a
 * `<ul>`, whose items are unordered). Renders as a direct child of
 * {@link BreadcrumbRoot | `Breadcrumb.Root`}'s `<nav>`, and contains
 * {@link BreadcrumbItem | `Breadcrumb.Item`}s interleaved with
 * {@link BreadcrumbSeparator | `Breadcrumb.Separator`}s. Stateless — no
 * context is read or provided.
 *
 * @extends HTMLOListElement
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
export function BreadcrumbList({
  children,
  ...rest
}: BreadcrumbListProps): ReactElement {
  return <ol {...rest}>{children}</ol>;
}

/** @internal */
BreadcrumbList.displayName = "BreadcrumbList";

/**
 * A single entry in the breadcrumb trail — renders an `<li>`.
 *
 * Wraps either a {@link BreadcrumbLink | `Breadcrumb.Link`} (an ancestor
 * page) or a {@link BreadcrumbPage | `Breadcrumb.Page`} (the current page),
 * as a child of {@link BreadcrumbList | `Breadcrumb.List`}'s `<ol>`.
 * {@link BreadcrumbSeparator | `Breadcrumb.Separator`}s are siblings of
 * `Breadcrumb.Item`, not nested inside it. Purely structural — no ARIA
 * attributes or state of its own.
 *
 * @extends HTMLLIElement
 *
 * @example
 * ```tsx
 * <Breadcrumb.Item>
 *   <Breadcrumb.Link href="/library">Library</Breadcrumb.Link>
 * </Breadcrumb.Item>
 * ```
 */
export function BreadcrumbItem({
  children,
  ...rest
}: BreadcrumbItemProps): ReactElement {
  return <li {...rest}>{children}</li>;
}

/** @internal */
BreadcrumbItem.displayName = "BreadcrumbItem";

/**
 * A link to an ancestor page — renders an `<a>`.
 *
 * Use for every entry except the current page (the last entry should be a
 * {@link BreadcrumbPage | `Breadcrumb.Page`} instead). Pass `href` (and any
 * other anchor attributes) directly; nothing is inferred or defaulted.
 *
 * **`asChild` composition.** Pass `asChild` to render a consumer-supplied
 * element — typically a routing library's `<Link>` — instead of the native
 * `<a>`, with all of `Breadcrumb.Link`'s props (`href`, event handlers,
 * `className`, `ref`, …) merged onto it via the {@link Slot} pattern. The
 * child **must** be a single React element that accepts a `ref`; the
 * native `<a>` is dropped entirely rather than wrapping the child.
 *
 * @extends HTMLAnchorElement
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
export function BreadcrumbLink({
  children,
  asChild = false,
  ...rest
}: BreadcrumbLinkProps): ReactElement {
  if (asChild) {
    return <Slot {...rest}>{children}</Slot>;
  }
  return <a {...rest}>{children}</a>;
}

/** @internal */
BreadcrumbLink.displayName = "BreadcrumbLink";

/**
 * The current page in the trail — renders a `<span aria-current="page">`.
 *
 * The last entry of a breadcrumb is the page the user is already on, so it
 * is deliberately not a {@link BreadcrumbLink | `Breadcrumb.Link`} — a link
 * to the current page is not a meaningful navigation target.
 * `aria-current="page"` is fixed by the component (not overridable) and
 * tells assistive technology this entry represents the current location.
 *
 * @extends HTMLSpanElement
 *
 * @example
 * ```tsx
 * <Breadcrumb.Item>
 *   <Breadcrumb.Page>Current article</Breadcrumb.Page>
 * </Breadcrumb.Item>
 * ```
 */
export function BreadcrumbPage({
  children,
  ...rest
}: BreadcrumbPageProps): ReactElement {
  return (
    <span aria-current="page" {...rest}>
      {children}
    </span>
  );
}

/** @internal */
BreadcrumbPage.displayName = "BreadcrumbPage";

/**
 * The visual divider between two breadcrumb entries — renders an
 * `<li role="presentation" aria-hidden="true">`.
 *
 * The separator sits inside the `<ol>` as a sibling of the
 * {@link BreadcrumbItem | `Breadcrumb.Item`}s (an `<ol>`'s valid children
 * are all `<li>`s, so the separator is one too), but `role="presentation"`
 * removes it from the list semantics — screen readers don't announce it as
 * a list item — and `aria-hidden="true"` hides it from the accessibility
 * tree entirely. Both attributes are fixed by the component and not
 * overridable; it is purely decorative.
 *
 * Defaults to a `"/"` glyph; pass `children` to use a custom separator (an
 * icon, a chevron, `"›"`, etc.) — whatever is passed replaces the default
 * entirely rather than being appended to it.
 *
 * @extends HTMLLIElement
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
export function BreadcrumbSeparator({
  children = "/",
  ...rest
}: BreadcrumbSeparatorProps): ReactElement {
  return (
    <li role="presentation" aria-hidden="true" {...rest}>
      {children}
    </li>
  );
}

/** @internal */
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

/** Type of the {@link Breadcrumb} compound: the root callable plus its attached sub-components. */
export type TBreadcrumbCompound = typeof BreadcrumbRoot & {
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
 * @see {@link BreadcrumbRoot} for the `aria-label` landmark default.
 * @see {@link BreadcrumbLink} for the `asChild` router-link pattern.
 * @see {@link BreadcrumbPage} for marking the current, non-linked entry.
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

/** @internal */
BreadcrumbCompound.displayName = "Breadcrumb";

export { BreadcrumbCompound as Breadcrumb };
