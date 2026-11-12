import { useEffect, useRef, type RefObject } from "react";

import { ComboboxController, type ComboboxControllerHost } from "@primitiv-ui/web";

/** What the root's state looks like to the controller, read fresh on every call. */
export type ComboboxHostSnapshot = Omit<ComboboxControllerHost, "input" | "content">;

type UseComboboxRootArgs = {
  /** The current render's state and setters, which the controller reads through. */
  snapshot: ComboboxHostSnapshot;
  /** Whether the popup is open: the controller shows or hides it as this changes. */
  open: boolean;
  /** The registered items, keyed by value, with their element and committed text. */
  itemsRef: RefObject<Map<string, { element: HTMLElement; label: string }>>;
  /** A fresh array on every registration, so the hand-over follows each one. */
  keys: readonly string[];
  inputRef: RefObject<HTMLInputElement | null>;
  contentRef: RefObject<HTMLElement | null>;
};

/**
 * Host the shared `ComboboxController` from `@primitiv-ui/web` over the root
 * element — the React adapter half of RFC 0033 D28/D30. The field's typing and
 * keys, choosing by click, showing the popup in the top layer and the
 * browser's light dismiss all run in the code `<primitiv-combobox>` runs;
 * React keeps the state and the controller reads it through `snapshot`.
 */
export function useComboboxRoot({
  snapshot,
  open,
  itemsRef,
  keys,
  inputRef,
  contentRef,
}: UseComboboxRootArgs): RefObject<HTMLDivElement | null> {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<ComboboxController | null>(null);
  const latest = useRef(snapshot);
  latest.current = snapshot;

  useEffect(
    () => {
      const controller = new ComboboxController(rootRef.current!, {
        state: () => latest.current.state(),
        input: () => inputRef.current,
        content: () => contentRef.current,
        change: (next) => latest.current.change(next),
        query: (text) => latest.current.query(text),
        select: (value, label) => latest.current.select(value, label),
        clear: () => latest.current.clear(),
        dismiss: () => latest.current.dismiss(),
        moveCursor: (value) => latest.current.moveCursor(value),
      });
      controllerRef.current = controller;
      controller.connect();
      return () => controller.disconnect();
    },
    // The controller is built once per mount; the state it needs later comes
    // through `latest` and the refs, so no dependency can go stale.
    // Stryker disable next-line ArrayDeclaration: equivalent — any constant dependency list runs this once per mount.
    [],
  );

  // The popup mounts as it opens, so by the time this runs it is in the DOM.
  useEffect(() => {
    controllerRef.current!.sync();
  }, [open]);

  useEffect(() => {
    controllerRef.current!.setTriggers([...itemsRef.current].map(([value, meta]) => ({ value, ...meta })));
  }, [keys, itemsRef]);

  return rootRef;
}
