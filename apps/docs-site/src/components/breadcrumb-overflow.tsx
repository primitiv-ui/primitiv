import "../styles/primitiv/breadcrumb-overflow/styles.css";
/*
 * BreadcrumbOverflow — styled wrapper, HAND-AUTHORED (composes the registry
 * Breadcrumb and Dropdown).
 *
 * Copied into the consumer repo by `primitiv add breadcrumb-overflow`. It
 * owns no keyboard model or focus management of its own — Dropdown already
 * covers the menu's open/close and roving-focus behaviour, and Breadcrumb's
 * Link/Page own their own semantics — so there is nothing for a
 * `packages/react` primitive to own here beyond the headless
 * `Breadcrumb.Ellipsis` glyph it already composes. The only thing this
 * component owns is the truncation arithmetic, a pure function of its
 * children, exactly like `avatar-group`'s `max` truncation. Carries no
 * drift-guard test; keep contract.json + the stylesheet + this file in sync
 * by hand.
 *
 * Takes `children` — plain `BreadcrumbLink`/`BreadcrumbPage` elements, not a
 * `label`/`href` data array — matching every other Primitiv compound's
 * refusal to own a data model (RFC 0019 §4c; `avatar-group`'s own header
 * comment). The hidden middle crumbs are re-rendered, unmodified, as
 * `DropdownItem asChild` children inside the overflow menu — the elements
 * themselves become real, navigable menu items.
 *
 * The trigger is a bare `<button>` styled by `__trigger` (styles.css), NOT
 * the registry `Button` component — Figma's own Overflow=true variant
 * renders "..." as a zero-padding, zero-fill plain-text crumb (see styles.css's
 * header), and Button's framed-control padding scale reads far too heavy
 * against that inline context (visually "a secondary button" sitting inside
 * a text trail, confirmed against a real render). `__trigger` matches the
 * Figma spec at rest and adds only a code-only hover/active affordance.
 *
 * The trigger/panel pair uses CSS anchor positioning, like every other
 * Dropdown consumption — but since this component can appear more than once
 * on a page, it derives its own unique `anchor-name` from `useId()` rather
 * than asking the consumer to wire one (contrast the bare `dropdown`
 * component, which leaves that to the consumer). Mirrors NavigationMenu's
 * `toAnchorIdentFragment` (`packages/react/src/NavigationMenu/utils.ts`):
 * `useId()`'s colon-bracketed output isn't a valid CSS `<custom-ident>`, so
 * every character outside `[A-Za-z0-9_-]` is replaced with a hyphen.
 */
import { Children, isValidElement, useId, Fragment, type ComponentPropsWithRef, type ReactElement, type ReactNode } from "react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbEllipsis } from "./breadcrumb";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "./dropdown";
import { breadcrumbOverflow } from "./breadcrumb-overflow.recipe";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

function toAnchorIdentFragment(id: string): string {
  return id.replace(/[^A-Za-z0-9_-]/g, "-");
}

export type BreadcrumbOverflowProps = Omit<ComponentPropsWithRef<typeof Breadcrumb>, "children" | "size"> & {
  /**
   * Matches `Breadcrumb`'s own size; also sizes the overflow trigger button
   * and the menu it opens.
   * @default "md"
   */
  size?: Size;
  /**
   * How many crumbs to always show at the start of the trail before the
   * overflow menu.
   * @default 1
   */
  keepStart?: number;
  /**
   * How many crumbs to always show at the end of the trail (typically
   * including the current page) after the overflow menu.
   * @default 1
   */
  keepEnd?: number;
  /**
   * Accessible label for the overflow trigger button.
   * @default "Show hidden pages"
   */
  menuLabel?: string;
  /** The trail's `BreadcrumbLink` / `BreadcrumbPage` elements, in order. */
  children?: ReactNode;
};

/**
 * A Breadcrumb trail that collapses its middle entries behind an overflow
 * menu once it has more crumbs than `keepStart + keepEnd` can show. Below
 * that threshold it renders every crumb, exactly like a plain `Breadcrumb`.
 *
 * @example
 * ```tsx
 * <BreadcrumbOverflow keepStart={1} keepEnd={1}>
 *   <BreadcrumbLink href="/">Home</BreadcrumbLink>
 *   <BreadcrumbLink href="/library">Library</BreadcrumbLink>
 *   <BreadcrumbLink href="/library/fiction">Fiction</BreadcrumbLink>
 *   <BreadcrumbLink href="/library/fiction/mystery">Mystery</BreadcrumbLink>
 *   <BreadcrumbPage>Neuromancer</BreadcrumbPage>
 * </BreadcrumbOverflow>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/breadcrumb-overflow
 */
export function BreadcrumbOverflow({
  size,
  keepStart = 1,
  keepEnd = 1,
  menuLabel = "Show hidden pages",
  className,
  children,
  ...props
}: BreadcrumbOverflowProps) {
  const anchorName = `--primitiv-breadcrumb-overflow-trigger-${toAnchorIdentFragment(useId())}`;
  const crumbs = Children.toArray(children).filter(isValidElement) as ReactElement[];
  // Collapsing a single hidden crumb into a menu saves nothing over just
  // showing it — the trail only truncates once there's more than one crumb
  // to hide.
  const collapse = crumbs.length - keepStart - keepEnd > 1;

  const leading = collapse ? crumbs.slice(0, keepStart) : [];
  const hidden = collapse ? crumbs.slice(keepStart, crumbs.length - keepEnd) : [];
  const trailing = collapse ? crumbs.slice(crumbs.length - keepEnd) : crumbs;

  return (
    <Breadcrumb size={size} className={[breadcrumbOverflow(), className].filter(Boolean).join(" ")} {...props}>
      <BreadcrumbList>
        {leading.map((crumb, i) => (
          <Fragment key={`leading-${i}`}>
            <BreadcrumbItem>{crumb}</BreadcrumbItem>
            <BreadcrumbSeparator />
          </Fragment>
        ))}
        {collapse && (
          <Fragment>
            <BreadcrumbItem>
              <Dropdown>
                <DropdownTrigger asChild>
                  <button
                    type="button"
                    className="primitiv-breadcrumb-overflow__trigger"
                    aria-label={menuLabel}
                    style={{ anchorName }}
                  >
                    <BreadcrumbEllipsis />
                  </button>
                </DropdownTrigger>
                <DropdownContent size={size} style={{ positionAnchor: anchorName }}>
                  {hidden.map((crumb, i) => (
                    <DropdownItem key={i} asChild>
                      {crumb}
                    </DropdownItem>
                  ))}
                </DropdownContent>
              </Dropdown>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </Fragment>
        )}
        {trailing.map((crumb, i) => (
          <Fragment key={`trailing-${i}`}>
            <BreadcrumbItem>{crumb}</BreadcrumbItem>
            {i < trailing.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
