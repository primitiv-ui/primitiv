import { useEffect, useMemo, useRef } from "react";
import type { ReactElement } from "react";

import { useDirection } from "../DirectionProvider/index.ts";
import { useRovingTabindex } from "../hooks/index.ts";
import { Slot, composeEventHandlers, composeRefs } from "../Slot/index.ts";

import { SegmentedControlContext } from "./SegmentedControlContext";
import {
  useSegmentedControlContext,
  useSegmentedControlRoot,
} from "./hooks/index.ts";
import {
  SegmentedControlItemProps,
  SegmentedControlRootProps,
} from "./types";

export function SegmentedControlRoot({
  defaultValue,
  value: controlledValue,
  onValueChange,
  orientation = "horizontal",
  dir,
  disabled = false,
  asChild = false,
  children,
  ...rest
}: SegmentedControlRootProps): ReactElement {
  const resolvedDir = dir ?? useDirection();
  const { value, select, registerItem, itemValues, disabledValues, focusItem } =
    useSegmentedControlRoot({
      defaultValue,
      value: controlledValue,
      onValueChange,
    });
  const contextValue = useMemo(
    () => ({
      value,
      select,
      registerItem,
      itemValues,
      disabledValues,
      focusItem,
      orientation,
      dir: resolvedDir,
      disabled,
    }),
    [
      value,
      select,
      registerItem,
      itemValues,
      disabledValues,
      focusItem,
      orientation,
      resolvedDir,
      disabled,
    ],
  );
  const rootProps = {
    role: "radiogroup" as const,
    "aria-orientation": orientation,
    "data-orientation": orientation,
    "data-disabled": disabled ? "" : undefined,
    dir: resolvedDir,
    ...rest,
  };
  return (
    <SegmentedControlContext.Provider value={contextValue}>
      {asChild ? (
        <Slot {...rootProps}>{children}</Slot>
      ) : (
        <div {...rootProps}>{children}</div>
      )}
    </SegmentedControlContext.Provider>
  );
}

/** @internal */
// Runtime-dead: the compound alias below (same object via Object.assign)
// overwrites this to "SegmentedControl" at load, so the value is never
// observable. The assignment stays because it declares `displayName` on
// `typeof SegmentedControlRoot`, which TSegmentedControlCompound extends.
// Stryker disable next-line StringLiteral: overwritten by the compound alias — an equivalent mutant.
SegmentedControlRoot.displayName = "SegmentedControlRoot";

export function SegmentedControlItem({
  value,
  children,
  onClick,
  onKeyDown,
  disabled: itemDisabled,
  asChild = false,
  ref,
  ...rest
}: SegmentedControlItemProps): ReactElement {
  const {
    value: selectedValue,
    select,
    registerItem,
    itemValues,
    disabledValues,
    focusItem,
    orientation,
    dir,
    disabled: groupDisabled,
  } = useSegmentedControlContext();
  const isChecked = selectedValue === value;
  const isDisabled = itemDisabled || groupDisabled;
  // When the whole control is disabled, nothing is navigable; otherwise the
  // per-item disabled set is excluded from arrow-key navigation.
  const enabledValues = useMemo(
    () =>
      groupDisabled ? [] : itemValues.filter((v) => !disabledValues.has(v)),
    [groupDisabled, itemValues, disabledValues],
  );
  const isTabStop =
    selectedValue !== undefined ? isChecked : enabledValues[0] === value;

  const localRef = useRef<HTMLButtonElement | null>(null);
  const setRef = useMemo(() => composeRefs(localRef, ref), [ref]);

  useEffect(() => {
    registerItem(value, localRef.current, itemDisabled);
    return () => registerItem(value, null);
  }, [value, itemDisabled, registerItem]);

  const { handleKeyDown } = useRovingTabindex<string>({
    orientation,
    dir,
    navigable: enabledValues,
    currentKey: value,
    onNavigate: (target) => {
      select(target);
      focusItem(target);
    },
  });

  const itemProps = {
    ...rest,
    ref: setRef,
    role: "radio" as const,
    "aria-checked": isChecked,
    "data-state": isChecked ? ("checked" as const) : ("unchecked" as const),
    "data-disabled": isDisabled ? "" : undefined,
    tabIndex: isTabStop ? 0 : -1,
    disabled: isDisabled,
    onClick: composeEventHandlers(onClick, () => select(value)),
    onKeyDown: composeEventHandlers(onKeyDown, handleKeyDown),
  };

  return asChild ? (
    <Slot {...itemProps}>{children}</Slot>
  ) : (
    <button type="button" {...itemProps}>
      {children}
    </button>
  );
}

/** @internal */
SegmentedControlItem.displayName = "SegmentedControlItem";

/** Type of the {@link SegmentedControl} compound: the root callable plus its attached sub-components. */
export type TSegmentedControlCompound = typeof SegmentedControlRoot & {
  Root: typeof SegmentedControlRoot;
  Item: typeof SegmentedControlItem;
};

const SegmentedControlCompound: TSegmentedControlCompound = Object.assign(
  SegmentedControlRoot,
  {
    Root: SegmentedControlRoot,
    Item: SegmentedControlItem,
  },
);

/** @internal */
SegmentedControlCompound.displayName = "SegmentedControl";

export { SegmentedControlCompound as SegmentedControl };
