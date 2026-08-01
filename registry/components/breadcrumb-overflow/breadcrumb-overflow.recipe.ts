/*
 * BreadcrumbOverflow styled-surface recipe — authored alongside the bespoke wrapper.
 *
 * Unlike the generated registry components, BreadcrumbOverflow's wrapper is
 * hand-authored (breadcrumb-overflow.tsx) — it composes Breadcrumb's own
 * List/Item/Separator/Ellipsis parts (plus Dropdown + Button for the overflow
 * trigger) rather than introducing new trail anatomy. This recipe adds a
 * single reserved `.primitiv-breadcrumb-overflow` marker class alongside
 * Breadcrumb's own `breadcrumb({size})` classes, carrying no declarations of
 * its own today. Change registry/components/breadcrumb-overflow/contract.json
 * + this file together.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const breadcrumbOverflow = cva("primitiv-breadcrumb-overflow");

export type BreadcrumbOverflowVariants = VariantProps<typeof breadcrumbOverflow>;
