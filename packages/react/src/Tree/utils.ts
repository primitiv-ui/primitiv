import { Children, Fragment, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";

import { TreeBranchControl, TreeBranchContent } from "./Tree";

/**
 * The property a component sets on itself to declare which `Tree` part it
 * stands in for.
 *
 * `Tree.Branch` finds its control and content by inspecting its children before
 * rendering them, so it sees the component the consumer wrote — not what that
 * component renders. A styled layer wraps every part in its own component to
 * attach classes (that is exactly what `primitiv add tree` copies), and without
 * a marker those wrappers are unrecognisable, making `Tree` the one primitive
 * in the library that cannot be wrapped at all.
 *
 * Set it on the wrapper and it partitions like the part it renders:
 *
 * ```tsx
 * function StyledBranchControl(props: TreeBranchControlProps) {
 *   return <Tree.BranchControl {...props} className="row" />;
 * }
 * StyledBranchControl[TREE_PART] = "branch-control";
 * ```
 */
export const TREE_PART: "__primitivTreePart" = "__primitivTreePart";

/** The part names {@link TREE_PART} accepts. */
export type TreePartName = "branch-control" | "branch-content";

/** Read a component's {@link TREE_PART} marker, if it declares one. */
function treePartOf(type: unknown): TreePartName | undefined {
  return (type as Record<string, TreePartName | undefined> | null)?.[TREE_PART];
}

/**
 * Whether `node` is a `Tree.BranchControl` element — either the part itself, or
 * a component that marks itself as standing in for it (see {@link TREE_PART}).
 */
export function isBranchControlElement(node: ReactNode): node is ReactElement {
  return (
    isValidElement(node) &&
    (node.type === TreeBranchControl || treePartOf(node.type) === "branch-control")
  );
}

/**
 * Whether `node` is a `Tree.BranchContent` element — either the part itself, or
 * a component that marks itself as standing in for it (see {@link TREE_PART}).
 */
export function isBranchContentElement(node: ReactNode): node is ReactElement {
  return (
    isValidElement(node) &&
    (node.type === TreeBranchContent || treePartOf(node.type) === "branch-content")
  );
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
