import { RefObject } from "react";

import { Direction } from "../DirectionProvider";
import { createStrictContext } from "../utils";

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
