import { useCallback, useId, useState, type RefObject } from "react";

import { ListboxController } from "@primitiv-ui/web";

import { useCollection, useControllableState, useHostedController } from "../../hooks/index.ts";
import { deriveId } from "../../utils/index.ts";

type OptionMeta = { element: HTMLElement; disabled: boolean };

type UseListboxRootArgs = {
  type: "single" | "multiple";
  defaultValue: string | string[] | undefined;
  value: string | string[] | undefined;
  onValueChange: ((value: string) => void) | ((value: string[]) => void) | undefined;
  selectionFollowsFocus: boolean;
  orientation: "horizontal" | "vertical";
  dir: "ltr" | "rtl";
};

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return typeof value === "string" ? [value] : value;
}

/**
 * Owns the Listbox's selection state and its virtual-focus cursor; the
 * behaviour — focus seeding and clearing, the keymap, range selection,
 * typeahead and choosing by click — runs in the shared `ListboxController`
 * (`@primitiv-ui/web`, RFC 0033 D30), which asks this hook for state and tells
 * it what changed.
 *
 * Selection is normalised into an array so options only ever ask "am I in
 * the selected set?". The cursor (`activeValue`) is the option
 * `aria-activedescendant` points at — real DOM focus stays on the root, so the
 * controller seeds it when the root takes focus and clears it when it loses
 * it. The controller reads the options in DOM order on every event, so a
 * reorder in place (APG's rearrangeable example) is picked up without the
 * options re-registering.
 */
export function useListboxRoot({
  type,
  defaultValue,
  value: controlledValue,
  onValueChange,
  selectionFollowsFocus,
  orientation,
  dir,
}: UseListboxRootArgs): {
  rootRef: RefObject<HTMLDivElement | null>;
  selectedValues: string[];
  activeValue: string | undefined;
  registerOption: (optionValue: string, element: HTMLElement | null, disabled?: boolean) => void;
  getOptionId: (optionValue: string) => string;
} {
  const rootId = useId();
  const [selectedValues, setSelectedValues] = useControllableState<string[]>(
    controlledValue === undefined ? undefined : toArray(controlledValue),
    toArray(defaultValue),
  );
  const [activeValue, setActiveValue] = useState<string | undefined>(undefined);
  const { register: registerBase, itemsRef, keys } = useCollection<string, OptionMeta>();

  const registerOption = useCallback(
    // Stryker disable next-line BooleanLiteral: equivalent — the only caller that omits this argument is the unmount path, which passes a null element and so never reads it.
    (optionValue: string, element: HTMLElement | null, disabled = false) => {
      registerBase(optionValue, element ? { element, disabled } : null);
    },
    // Stryker disable next-line ArrayDeclaration: equivalent — registerBase is a stable useCollection callback, so an empty dep array memoises identically.
    [registerBase],
  );

  const getOptionId = useCallback(
    // Stryker disable next-line StringLiteral: equivalent — the suffix only has to be stable; every assertion compares against the element's own id.
    (optionValue: string) => deriveId(rootId, "option", optionValue),
    // Stryker disable next-line ArrayDeclaration: equivalent — rootId is a useId() constant.
    [rootId],
  );

  const rootRef = useHostedController(
    { selectedValues, activeValue, type, selectionFollowsFocus, orientation, dir, setSelectedValues, onValueChange },
    (root, latest) =>
      new ListboxController(root, {
        state: () => {
          const { selectedValues, activeValue, type, selectionFollowsFocus, orientation, dir } = latest();
          return {
            selected: selectedValues,
            active: activeValue,
            multiple: type === "multiple",
            selectionFollowsFocus,
            orientation,
            dir,
          };
        },
        change: (next) => {
          const { type, setSelectedValues, onValueChange } = latest();
          setSelectedValues(next);
          if (type === "single") (onValueChange as ((value: string) => void) | undefined)?.(next[0]);
          else (onValueChange as ((value: string[]) => void) | undefined)?.(next);
        },
        moveCursor: setActiveValue,
      }),
    { itemsRef, keys },
  );

  return { rootRef, selectedValues, activeValue, registerOption, getOptionId };
}
