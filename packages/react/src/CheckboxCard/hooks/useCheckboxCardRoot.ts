import { useEffect } from "react";

import { CheckboxCardController } from "@primitiv-ui/web";

import { useCollection, useControllableState, useHostedController } from "../../hooks/index.ts";

import type { CheckedState } from "../../Checkbox/types";

type UseCheckboxCardRootArgs = {
  defaultChecked?: CheckedState;
  checked?: CheckedState;
  onCheckedChange?: (checked: boolean) => void;
  disabled: boolean;
};

type CardMeta = { element: HTMLElement; disabled: boolean };

export function useCheckboxCardRoot({
  defaultChecked,
  checked: controlledChecked,
  onCheckedChange,
  disabled,
}: UseCheckboxCardRootArgs) {
  const [checked, setChecked] = useControllableState<CheckedState>(controlledChecked, defaultChecked ?? false);

  const { register, itemsRef, keys } = useCollection<string, CardMeta>();

  // The click that toggles the card runs in the shared CheckboxCardController
  // (@primitiv-ui/web, RFC 0033 D30) — the code <primitiv-checkbox-card> runs.
  // React keeps the state and answers it. The card is both the root the
  // controller listens on and its one trigger.
  const rootRef = useHostedController<
    { checked: CheckedState; setChecked: typeof setChecked; onCheckedChange: typeof onCheckedChange },
    HTMLButtonElement
  >(
    { checked, setChecked, onCheckedChange },
    (root, latest) =>
      new CheckboxCardController(root, {
        state: () => ({ checked: latest().checked }),
        change: (next) => {
          const { setChecked, onCheckedChange } = latest();
          setChecked(next);
          onCheckedChange?.(next);
        },
      }),
    { itemsRef, keys },
  );

  // The card registers once mounted, and again as `disabled` changes. No
  // cleanup: the card is the root itself, so once it unmounts the controller
  // and the collection go with it.
  useEffect(() => {
    // Stryker disable next-line StringLiteral: equivalent — the card is the collection's only key, so any key names it.
    register("card", { element: rootRef.current as HTMLElement, disabled });
  }, [register, rootRef, disabled]);

  return { checked, rootRef };
}
