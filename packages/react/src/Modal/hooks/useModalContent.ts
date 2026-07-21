import { useEffect, useRef } from "react";

import { FOCUSABLE_SELECTOR } from "../../utils/index.ts";
import { useModalContext } from "./useModalContext";

export function useModalContent() {
  const { open, setOpen, contentId, contentCallbacksRef } = useModalContext();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // React guarantees the ref is populated before effects run for a
    // successfully-committed element, and Content always renders the
    // dialog — so ref.current is non-null here.
    const dialog = ref.current as HTMLDialogElement;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current as HTMLDialogElement;
    const handleClose = () => setOpen(false);
    const handleCancel = (event: Event) => {
      contentCallbacksRef.current?.onEscapeKeyDown?.(event);
      const consumerVetoed = event.defaultPrevented;
      // Always block the browser's native auto-close so React drives the
      // open state — otherwise the native close fires a `close` event and
      // we'd race with React's effect-driven dialog.close().
      event.preventDefault();
      if (consumerVetoed) return;
      setOpen(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      // Native <dialog>.showModal() puts the dialog in the top layer and
      // paints its own ::backdrop over any sibling overlay, so clicks on
      // the visual backdrop target the <dialog> itself — not the overlay.
      // Bounding-rect check: pointer inside the dialog's box (content or
      // padding) is "inside"; anything else is a backdrop click.
      const rect = dialog.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (inside) return;
      contentCallbacksRef.current?.onPointerDownOutside?.(event);
      if (event.defaultPrevented) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      // WAI-ARIA APG Modal Dialog: Tab must cycle within the dialog. A native
      // modal <dialog> inerts the background (Tab can't reach the page) but
      // does NOT wrap — Tab past the last element escapes to the browser
      // chrome, then returns. Close only the two boundary gaps here; interior
      // Tabs stay native so the browser's inert-aware order (radio groups,
      // etc.) keeps working.
      if (event.key !== "Tab") return;
      if (!dialog.open) return;
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusables.length === 0) {
        // Nothing tabbable inside — block Tab so focus can't leak to the
        // browser chrome (native <dialog> would otherwise let it out).
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      }
    };
    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("pointerdown", handlePointerDown);
    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("pointerdown", handlePointerDown);
      dialog.removeEventListener("keydown", handleKeyDown);
    };
  }, [setOpen, contentCallbacksRef]);

  return { ref, open, contentId };
}
