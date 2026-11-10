import { useEffect, useRef } from "react";

import { ModalController } from "@primitiv-ui/web";

import { useModalContext } from "./useModalContext";

export function useModalContent() {
  const { open, setOpen, contentId, contentCallbacksRef } = useModalContext();
  const ref = useRef<HTMLDialogElement>(null);
  const controllerRef = useRef<ModalController | null>(null);
  const latest = useRef({ open, setOpen });
  latest.current = { open, setOpen };

  // ── The adapter (RFC 0033 §3.4, D28) ────────────────────────────────────
  // The dialog's DOM behaviour — showModal/close, Escape, a press on the
  // backdrop and the Tab wrap — runs in the web implementation's
  // ModalController, the same code the <primitiv-modal> element runs. React
  // keeps rendering the dialog it always has and keeps the state; the
  // controller reads it through `latest` and asks for changes through
  // `change`, and the escape hatches reach it through the content callbacks.
  useEffect(
    () => {
      // React guarantees the ref is populated before effects run for a
      // successfully-committed element, and Content always renders the
      // dialog — so ref.current is non-null here.
      const controller = new ModalController(ref.current as HTMLDialogElement, {
        state: () => ({ open: latest.current.open }),
        change: (next) => latest.current.setOpen(next),
        escapeKeyDown: (event) => contentCallbacksRef.current.onEscapeKeyDown?.(event),
        pointerDownOutside: (event) => contentCallbacksRef.current.onPointerDownOutside?.(event),
      });
      controllerRef.current = controller;
      controller.connect();
      return () => controller.disconnect();
    },
    // The controller is built once per mount; the state it needs later comes
    // through `latest` and the callbacks ref, so no dependency can go stale.
    // Stryker disable next-line ArrayDeclaration: equivalent — any constant dependency list runs this once per mount.
    [],
  );

  useEffect(() => {
    (controllerRef.current as ModalController).sync();
  }, [open]);

  return { ref, open, contentId };
}
