import { useRef, useEffect, useMemo, KeyboardEventHandler } from "react";

import { DropdownController } from "@primitiv-ui/web";

import { useDropdownContext } from "./useDropdownContext";
import { DropdownContentProps } from "../types";

type UseDropdownContentArgs = {
  onKeyDown?: KeyboardEventHandler;
  restProps: Omit<DropdownContentProps, "children" | "onKeyDown" | "asChild">;
};

export function useDropdownContent({
  onKeyDown,
  restProps,
}: UseDropdownContentArgs) {
  const { open, setOpen, contentId, triggerRef } = useDropdownContext();
  const menuRef = useRef<HTMLMenuElement | null>(null);
  const controllerRef = useRef<DropdownController | null>(null);
  const latest = useRef({ open, setOpen });
  latest.current = { open, setOpen };

  // ── The adapter (RFC 0033 §3.4, D28) ────────────────────────────────────
  // The menu's DOM behaviour — showPopover/hidePopover with focus on the first
  // item, light dismiss and the outside-press fallback, the arrow / Home / End
  // / Enter / Space / Escape keyboard and typeahead — runs in the web
  // implementation's DropdownController, the same code <primitiv-dropdown>
  // runs. React keeps rendering the menu it always has and keeps the state;
  // the controller reads it through `latest`. No `source` is passed, so the
  // menu's positioning stays the consumer's `anchor-name` wiring, as before.
  useEffect(
    () => {
      const controller = new DropdownController(menuRef.current!, {
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
    (controllerRef.current as DropdownController).sync();
  }, [open]);

  const closeOpenSubRef = useRef<(() => void) | null>(null);
  const contentContextValue = useMemo(() => ({ closeOpenSubRef }), []);

  const contentProps = {
    ...restProps,
    ref: menuRef,
    id: contentId,
    role: "menu" as const,
    popover: "auto" as const,
    // The keyboard is the controller's; a consumer's own handler runs beside it.
    onKeyDown,
  };

  return {
    contentContextValue,
    contentProps,
  };
}
