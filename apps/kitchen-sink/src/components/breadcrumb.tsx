import "../styles/primitiv/breadcrumb/styles.css";
/*
 * Breadcrumb — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/breadcrumb/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { Breadcrumb as BreadcrumbPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { breadcrumb, breadcrumbList, breadcrumbItem, breadcrumbLink, breadcrumbPage, breadcrumbSeparator, breadcrumbEllipsis } from "./breadcrumb.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * A WAI-ARIA breadcrumb trail — a nav landmark wrapping an ordered list of ancestor-page links, ending with the current page.
 *
 * @see https://primitiv-ui.dev/docs/components/breadcrumb
 */
export type BreadcrumbProps = DistributiveOmit<ComponentPropsWithRef<typeof BreadcrumbPrimitive.Root>, "size"> & {
  /**
   * Control size; `data-density` scales each size further.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/breadcrumb
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

export function Breadcrumb({ size, className, ...props }: BreadcrumbProps) {
  return <BreadcrumbPrimitive.Root className={[breadcrumb({ size }), className].filter(Boolean).join(" ")} {...props} />;
}

export type BreadcrumbListProps = ComponentPropsWithRef<typeof BreadcrumbPrimitive.List>;

export function BreadcrumbList({ className, ...props }: BreadcrumbListProps) {
  return <BreadcrumbPrimitive.List className={[breadcrumbList(), className].filter(Boolean).join(" ")} {...props} />;
}

export type BreadcrumbItemProps = ComponentPropsWithRef<typeof BreadcrumbPrimitive.Item>;

export function BreadcrumbItem({ className, ...props }: BreadcrumbItemProps) {
  return <BreadcrumbPrimitive.Item className={[breadcrumbItem(), className].filter(Boolean).join(" ")} {...props} />;
}

export type BreadcrumbLinkProps = ComponentPropsWithRef<typeof BreadcrumbPrimitive.Link>;

export function BreadcrumbLink({ className, ...props }: BreadcrumbLinkProps) {
  return <BreadcrumbPrimitive.Link className={[breadcrumbLink(), className].filter(Boolean).join(" ")} {...props} />;
}

export type BreadcrumbPageProps = ComponentPropsWithRef<typeof BreadcrumbPrimitive.Page>;

export function BreadcrumbPage({ className, ...props }: BreadcrumbPageProps) {
  return <BreadcrumbPrimitive.Page className={[breadcrumbPage(), className].filter(Boolean).join(" ")} {...props} />;
}

export type BreadcrumbSeparatorProps = ComponentPropsWithRef<typeof BreadcrumbPrimitive.Separator>;

export function BreadcrumbSeparator({ className, ...props }: BreadcrumbSeparatorProps) {
  return <BreadcrumbPrimitive.Separator className={[breadcrumbSeparator(), className].filter(Boolean).join(" ")} {...props} />;
}

export type BreadcrumbEllipsisProps = ComponentPropsWithRef<typeof BreadcrumbPrimitive.Ellipsis>;

export function BreadcrumbEllipsis({ className, ...props }: BreadcrumbEllipsisProps) {
  return <BreadcrumbPrimitive.Ellipsis className={[breadcrumbEllipsis(), className].filter(Boolean).join(" ")} {...props} />;
}
