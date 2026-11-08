import { useEffect, useRef, type RefObject } from "react";

/** What a `@primitiv-ui/web` controller offers its host (RFC 0033 §3.4). */
export type HostedController = {
  connect(): void;
  disconnect(): void;
  setTriggers(
    triggers: ReadonlyArray<{
      value: string;
      element: HTMLElement;
      disabled?: boolean;
    }>,
  ): void;
};

/** A component's registered triggers, as `useCollection` keeps them. */
type TriggerCollection = {
  itemsRef: RefObject<Map<string, { element: HTMLElement; disabled: boolean }>>;
  keys: readonly string[];
};

/**
 * Host a `@primitiv-ui/web` controller over the root this returns a ref for —
 * the React adapter half of RFC 0033 D28/D30. The controller owns the DOM
 * behaviour (clicks, keys, focus) and the component keeps its state: `create`
 * receives a `latest()` that always reads the current render's `snapshot`, so
 * the controller is built once per mount and never goes stale. It listens while
 * mounted — StrictMode's extra mount/unmount pair disconnects the first one — and
 * is handed the trigger collection whenever it changes; it orders the triggers
 * by DOM position itself.
 */
export function useHostedController<S, R extends HTMLElement = HTMLDivElement>(
  snapshot: S,
  create: (root: R, latest: () => S) => HostedController,
  triggers: TriggerCollection,
): RefObject<R | null> {
  const rootRef = useRef<R>(null);
  const controllerRef = useRef<HostedController | null>(null);
  const latest = useRef(snapshot);
  latest.current = snapshot;

  useEffect(
    () => {
      const controller = create(rootRef.current as R, () => latest.current);
      controllerRef.current = controller;
      controller.connect();
      return () => controller.disconnect();
    },
    // `create` is read once, at mount, like the controller it builds; the state
    // it needs later comes through `latest()`, so no dependency can go stale.
    // Stryker disable next-line ArrayDeclaration: equivalent — any constant dependency list runs this once per mount.
    [],
  );

  // `keys` is a fresh array on every registration — including a trigger
  // toggling `disabled` — so it is the only dependency the hand-over needs.
  const { itemsRef, keys } = triggers;
  useEffect(() => {
    (controllerRef.current as HostedController).setTriggers(
      [...itemsRef.current].map(([value, meta]) => ({
        value,
        element: meta.element,
        disabled: meta.disabled,
      })),
    );
  }, [keys, itemsRef]);

  return rootRef;
}
