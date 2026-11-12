import { KeyboardEventHandler, useEffect, useRef } from "react";

import { SelectController } from "@primitiv-ui/web";

import { useSelectContext } from "../SelectContext";
import type { SelectContentProps } from "../types";

type UseSelectContentArgs = {
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  restProps: Omit<SelectContentProps, "children" | "onKeyDown" | "asChild">;
};

export function useSelectContent({ onKeyDown, restProps }: UseSelectContentArgs) {
  const { open, setOpen, select, contentId, triggerRef, optionsRef, optionKeys } = useSelectContext();
  const listRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<SelectController | null>(null);
  // Stryker disable next-line ObjectLiteral: equivalent — reassigned on every render, before any effect reads it.
  const latest = useRef({ open, setOpen, select });
  latest.current = { open, setOpen, select };

  // ── The adapter (RFC 0033 §3.4, D28) ────────────────────────────────────
  // The list's DOM behaviour — showPopover/hidePopover with focus on the
  // selected option, light dismiss, the arrow / Home / End / Enter / Space /
  // Escape keyboard and typeahead, and choosing an option by click — runs in
  // the web implementation's SelectController, the same code <primitiv-select>
  // runs. React keeps rendering the list it always has and keeps the state; the
  // controller reads it through `latest`. No `source` is passed, so the list's
  // positioning stays the consumer's `anchor-name` wiring, as before.
  useEffect(
    () => {
      const controller = new SelectController(listRef.current!, {
        state: () => ({ open: latest.current.open }),
        change: (next) => latest.current.setOpen(next),
        select: (value) => latest.current.select(value),
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
    (controllerRef.current as SelectController).sync();
  }, [open]);

  // `optionKeys` is a fresh array on every registration — including an option
  // toggling `disabled` — so it is the only dependency the hand-over needs.
  useEffect(() => {
    (controllerRef.current as SelectController).setTriggers(
      [...optionsRef.current].map(([value, option]) => ({ value, ...option })),
    );
  }, [optionKeys, optionsRef]);

  const contentProps = {
    ...restProps,
    ref: listRef,
    id: contentId,
    role: "listbox" as const,
    tabIndex: -1,
    popover: "auto" as const,
    // The keyboard is the controller's; a consumer's own handler runs beside it.
    onKeyDown,
  };

  return { contentProps };
}
