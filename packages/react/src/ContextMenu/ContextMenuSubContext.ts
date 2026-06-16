import { RefObject } from "react";

import { createStrictContext } from "../utils/index.ts";

export type ContextMenuSubContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  triggerRef: RefObject<HTMLLIElement | null>;
};

export const [ContextMenuSubContext, useContextMenuSubContext] =
  createStrictContext<ContextMenuSubContextValue>(
    "ContextMenu.SubTrigger and ContextMenu.SubContent must be rendered inside a <ContextMenu.Sub>.",
  );
