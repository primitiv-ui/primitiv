import { MouseEventHandler } from "react";
import { useModalContext } from "./index.ts";
import { composeEventHandlers } from "../../Slot/index.ts";
import type { ModalTriggerProps } from "../types";

export function useModalTrigger(
  onClick?: MouseEventHandler,
  rest: Omit<ModalTriggerProps, "asChild" | "onClick" | "type"> = {},
) {
  const { open, setOpen, contentId } = useModalContext();

  function getTriggerProps() {
    return {
      ...rest,
      "aria-haspopup": "dialog" as const,
      "aria-expanded": open,
      "aria-controls": contentId,
      onClick: composeEventHandlers(onClick, () => setOpen(true)),
    };
  }

  return {
    getTriggerProps,
  };
}
