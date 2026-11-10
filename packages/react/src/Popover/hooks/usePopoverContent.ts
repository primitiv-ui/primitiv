import { KeyboardEventHandler, Ref, useEffect, useRef } from "react";

import { PopoverController } from "@primitiv-ui/web";

import { composeRefs } from "../../Slot/index.ts";
import { usePopoverContext } from "../PopoverContext";

type UsePopoverContentArgs = {
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  ref?: Ref<HTMLDivElement>;
};

export function usePopoverContent({
  onKeyDown,
  ref,
}: UsePopoverContentArgs = {}) {
  const { open, setOpen, contentId, triggerRef, titleId, descriptionId } =
    usePopoverContext();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const composedRef = ref ? composeRefs(contentRef, ref) : contentRef;
  const controllerRef = useRef<PopoverController | null>(null);
  const latest = useRef({ open, setOpen });
  latest.current = { open, setOpen };

  // ── The adapter (RFC 0033 §3.4, D28) ────────────────────────────────────
  // The panel's DOM behaviour — showPopover/hidePopover with focus moving in,
  // light dismiss, Escape back to the trigger, and the outside-press fallback
  // for environments without the Popover API — runs in the web
  // implementation's PopoverController, the same code <primitiv-popover>
  // runs. React keeps rendering the panel it always has and keeps the state;
  // the controller reads it through `latest`. No `source` is passed, so the
  // panel's positioning stays the consumer's `anchor-name` wiring, as before.
  useEffect(
    () => {
      const controller = new PopoverController(contentRef.current!, {
        state: () => ({ open: latest.current.open }),
        change: (next) => latest.current.setOpen(next),
        trigger: () => triggerRef.current,
      });
      controllerRef.current = controller;
      controller.connect();
      return () => controller.disconnect();
    },
    // The controller is built once per mount; the state it needs later comes
    // through `latest` and the trigger ref, so no dependency can go stale.
    // Stryker disable next-line ArrayDeclaration: equivalent — any constant dependency list runs this once per mount.
    [],
  );

  useEffect(() => {
    (controllerRef.current as PopoverController).sync();
  }, [open]);

  const contentProps = {
    ref: composedRef,
    id: contentId,
    role: "dialog" as const,
    popover: "auto" as const,
    tabIndex: -1,
    "aria-labelledby": titleId,
    "aria-describedby": descriptionId,
    "data-state": (open ? "open" : "closed") as "open" | "closed",
    // Escape is the controller's; a consumer's own handler runs beside it.
    onKeyDown,
  };

  return { contentProps };
}
