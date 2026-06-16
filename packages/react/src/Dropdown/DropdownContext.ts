import { RefObject } from "react";

import { Direction } from "../DirectionProvider/index.ts";
import { createStrictContext } from "../utils/index.ts";

export type DropdownContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  dir: Direction;
};

export const [DropdownContext, useDropdownContext] =
  createStrictContext<DropdownContextValue>(
    "Dropdown sub-components must be rendered inside a <Dropdown.Root>.",
  );
