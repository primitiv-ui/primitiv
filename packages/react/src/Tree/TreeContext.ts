import { createStrictContext } from "../utils/index.ts";

import type {
  TreeContextValue,
  TreeLevelContextValue,
  TreeItemContextValue,
} from "./types";

export const [TreeContext, useTreeContext] = createStrictContext<TreeContextValue>(
  "Tree sub-components must be rendered inside <Tree.Root>.",
  "TreeContext",
);

export const [TreeLevelContext, useTreeLevelContext] =
  createStrictContext<TreeLevelContextValue>(
    "Tree sub-components must be rendered inside <Tree.Root>.",
    "TreeLevelContext",
  );

export const [TreeItemContext, useTreeItemContext] =
  createStrictContext<TreeItemContextValue>(
    "Tree.BranchControl must be rendered inside a <Tree.Branch>.",
    "TreeItemContext",
  );
