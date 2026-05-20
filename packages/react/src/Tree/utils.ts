import { Children, Fragment, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";

import { TreeBranchControl, TreeBranchContent } from "./Tree";

/** Whether `node` is a `Tree.BranchControl` element. */
export function isBranchControlElement(node: ReactNode): node is ReactElement {
  return isValidElement(node) && node.type === TreeBranchControl;
}

/** Whether `node` is a `Tree.BranchContent` element. */
export function isBranchContentElement(node: ReactNode): node is ReactElement {
  return isValidElement(node) && node.type === TreeBranchContent;
}

/**
 * Splits a `Tree.Branch`'s children into its single `<Tree.BranchControl>`
 * (the clickable row) and its optional `<Tree.BranchContent>` (the nested
 * group). Both are matched however deeply they are wrapped in fragments,
 * since `Children.toArray` does not descend into fragments — so
 * `{open && <BranchContent/>}` is partitioned the same as a bare element.
 */
export function partitionBranchChildren(children: ReactNode): {
  control: ReactElement;
  content: ReactElement | null;
} {
  let control: ReactElement | null = null;
  let content: ReactElement | null = null;

  const visit = (nodes: ReactNode): void => {
    for (const child of Children.toArray(nodes)) {
      if (isBranchControlElement(child)) {
        if (control !== null) {
          throw new Error(
            "A Tree.Branch may contain at most one <Tree.BranchControl>.",
          );
        }
        control = child;
      } else if (isBranchContentElement(child)) {
        if (content !== null) {
          throw new Error(
            "A Tree.Branch may contain at most one <Tree.BranchContent>.",
          );
        }
        content = child;
      } else if (isValidElement(child) && child.type === Fragment) {
        visit((child.props as { children?: ReactNode }).children);
      }
    }
  };

  visit(children);

  if (control === null) {
    throw new Error("A Tree.Branch must contain a <Tree.BranchControl>.");
  }

  return { control, content };
}
