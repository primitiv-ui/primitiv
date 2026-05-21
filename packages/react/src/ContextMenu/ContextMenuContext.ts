import { RefObject } from "react";

import { Direction } from "../DirectionProvider";
import { createStrictContext } from "../utils";

export type ContextMenuPosition = { x: number; y: number };

export type ContextMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  position: ContextMenuPosition | null;
  setPosition: (position: ContextMenuPosition | null) => void;
  contentId: string;
  triggerRef: RefObject<HTMLElement | null>;
  dir: Direction;
};

export const [ContextMenuContext, useContextMenuContext] =
  createStrictContext<ContextMenuContextValue>(
    "ContextMenu sub-components must be rendered inside a <ContextMenu.Root>.",
  );
