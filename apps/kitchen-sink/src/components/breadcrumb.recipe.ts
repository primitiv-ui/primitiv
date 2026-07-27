/*
 * Breadcrumb styled-surface recipe — generated from contract.json.
 *
 * Do not edit by hand: change registry/components/breadcrumb/contract.json and regenerate.
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const breadcrumb = cva("primitiv-breadcrumb", {
  variants: {
    size: {
      xs: "primitiv-breadcrumb--xs",
      sm: "primitiv-breadcrumb--sm",
      md: "primitiv-breadcrumb--md",
      lg: "primitiv-breadcrumb--lg",
      xl: "primitiv-breadcrumb--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type BreadcrumbVariants = VariantProps<typeof breadcrumb>;

export const breadcrumbList = cva("primitiv-breadcrumb__list");

export type BreadcrumbListVariants = VariantProps<typeof breadcrumbList>;

export const breadcrumbItem = cva("primitiv-breadcrumb__item");

export type BreadcrumbItemVariants = VariantProps<typeof breadcrumbItem>;

export const breadcrumbLink = cva("primitiv-breadcrumb__link");

export type BreadcrumbLinkVariants = VariantProps<typeof breadcrumbLink>;

export const breadcrumbPage = cva("primitiv-breadcrumb__page");

export type BreadcrumbPageVariants = VariantProps<typeof breadcrumbPage>;

export const breadcrumbSeparator = cva("primitiv-breadcrumb__separator");

export type BreadcrumbSeparatorVariants = VariantProps<typeof breadcrumbSeparator>;
