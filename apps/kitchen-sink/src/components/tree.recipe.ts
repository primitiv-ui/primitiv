/*
 * Tree styled-surface recipe — generated from contract.json.
 *
 * Do not edit by hand: change registry/components/tree/contract.json and regenerate.
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const tree = cva("primitiv-tree", {
  variants: {
    size: {
      xs: "primitiv-tree--xs",
      sm: "primitiv-tree--sm",
      md: "primitiv-tree--md",
      lg: "primitiv-tree--lg",
      xl: "primitiv-tree--xl",
    },
    connectors: {
      lines: "primitiv-tree--connectors-lines",
      none: "primitiv-tree--connectors-none",
    },
  },
  defaultVariants: {
    size: "md",
    connectors: "lines",
  },
});

export type TreeVariants = VariantProps<typeof tree>;

export const treeItem = cva("primitiv-tree__item");

export type TreeItemVariants = VariantProps<typeof treeItem>;

export const treeBranch = cva("primitiv-tree__branch");

export type TreeBranchVariants = VariantProps<typeof treeBranch>;

export const treeBranchControl = cva("primitiv-tree__branch-control");

export type TreeBranchControlVariants = VariantProps<typeof treeBranchControl>;

export const treeBranchContent = cva("primitiv-tree__branch-content");

export type TreeBranchContentVariants = VariantProps<typeof treeBranchContent>;

export const treeBranchIndicator = cva("primitiv-tree__branch-indicator");

export type TreeBranchIndicatorVariants = VariantProps<typeof treeBranchIndicator>;

export const treeSelectionPath = cva("primitiv-tree__selection-path");

export type TreeSelectionPathVariants = VariantProps<typeof treeSelectionPath>;
