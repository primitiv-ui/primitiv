import { createStrictContext } from "../utils";

import type { TreeLevelContextValue } from "./types";

export const [TreeLevelContext, useTreeLevelContext] =
  createStrictContext<TreeLevelContextValue>(
    "Tree sub-components must be rendered inside <Tree.Root>.",
    "TreeLevelContext",
  );
