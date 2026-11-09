import { useCallback, useId, useMemo } from "react";

import { CollapsibleController } from "@primitiv-ui/web";

import {
  useCollection,
  useControllableState,
  useHostedController,
} from "../../hooks/index.ts";

type TriggerMeta = { element: HTMLElement; disabled: boolean };

/** The one key the trigger registers under: a collapsible has one trigger. */
// Stryker disable next-line StringLiteral: equivalent — with one trigger, the key is never read.
const TRIGGER = "trigger";

export function useCollapsibleRoot(
  controlledOpen: boolean | undefined,
  defaultOpen: boolean,
  onOpenChange: ((open: boolean) => void) | undefined,
  disabled: boolean,
) {
  const collapsibleId = useId();
  const [open, setOpen] = useControllableState<boolean>(
    controlledOpen,
    defaultOpen,
    onOpenChange,
  );

  const {
    register,
    itemsRef: triggersRef,
    keys,
  } = useCollection<string, TriggerMeta>();

  const registerTrigger = useCallback(
    (element: HTMLElement | null) => {
      register(TRIGGER, element ? { element, disabled } : null);
    },
    [register, disabled],
  );

  const contextValue = useMemo(
    () => ({
      open,
      disabled,
      registerTrigger,
      triggerId: `${collapsibleId}-trigger`,
      contentId: `${collapsibleId}-content`,
    }),
    [open, disabled, registerTrigger, collapsibleId],
  );

  // ── The adapter (RFC 0033 §3.4, D28) ────────────────────────────────────
  // Collapsible's DOM behaviour — the click, Enter and Space that toggle it —
  // runs in the web implementation's CollapsibleController, the same code the
  // <primitiv-collapsible> element runs. React keeps rendering exactly the
  // markup it always has and keeps the state; the controller reads it through
  // `latest()` and asks for changes through `change`, which notifies
  // `onOpenChange` in both modes, as Collapsible always has.
  const rootRef = useHostedController(
    { open, setOpen },
    (root, latest) =>
      new CollapsibleController(root, {
        state: () => ({ open: latest().open }),
        change: (next) => latest().setOpen(next),
      }),
    { itemsRef: triggersRef, keys },
  );

  return { contextValue, rootRef };
}
