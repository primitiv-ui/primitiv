import { useEffect, useMemo, useRef, type ReactElement } from "react";

import { useDirection } from "../DirectionProvider/index.ts";
import { Slot, composeEventHandlers, composeRefs } from "../Slot/index.ts";

import { ListboxProvider, useListboxContext } from "./ListboxContext";
import { useListboxRoot } from "./hooks/index.ts";
import type {
  ListboxGroupProps,
  ListboxOptionProps,
  ListboxRootProps,
} from "./types";

export function ListboxRoot({
  type,
  defaultValue,
  value: controlledValue,
  onValueChange,
  selectionFollowsFocus = false,
  orientation = "vertical",
  dir,
  asChild = false,
  onFocus,
  onBlur,
  onKeyDown,
  children,
  ref,
  ...rest
}: ListboxRootProps): ReactElement {
  const resolvedDir = dir ?? useDirection();
  const {
    selectedValues,
    select,
    activeValue,
    registerOption,
    getOptionId,
    seedActiveValue,
    clearActiveValue,
    handleKeyDown,
  } = useListboxRoot({
    type,
    defaultValue,
    value: controlledValue,
    onValueChange,
    selectionFollowsFocus,
    orientation,
    dir: resolvedDir,
  });

  const contextValue = useMemo(
    () => ({ selectedValues, select, activeValue, registerOption, getOptionId }),
    [selectedValues, select, activeValue, registerOption, getOptionId],
  );

  const rootProps = {
    ...rest,
    ref,
    role: "listbox" as const,
    tabIndex: 0,
    "aria-multiselectable": type === "multiple" ? true : undefined,
    "aria-orientation":
      orientation === "horizontal" ? ("horizontal" as const) : undefined,
    "data-orientation": orientation,
    "aria-activedescendant":
      activeValue === undefined ? undefined : getOptionId(activeValue),
    onFocus: composeEventHandlers(onFocus, seedActiveValue),
    onBlur: composeEventHandlers(onBlur, clearActiveValue),
    onKeyDown: composeEventHandlers(onKeyDown, handleKeyDown),
  };

  return (
    <ListboxProvider value={contextValue}>
      {asChild ? (
        <Slot {...rootProps}>{children}</Slot>
      ) : (
        <div {...rootProps}>{children}</div>
      )}
    </ListboxProvider>
  );
}

export function ListboxOption({
  value,
  disabled = false,
  asChild = false,
  onClick,
  children,
  ref,
  ...rest
}: ListboxOptionProps): ReactElement {
  const { selectedValues, select, activeValue, registerOption, getOptionId } =
    useListboxContext();
  const selected = selectedValues.includes(value);

  const localRef = useRef<HTMLDivElement | null>(null);
  const setRef = useMemo(() => composeRefs(localRef, ref), [ref]);

  useEffect(() => {
    registerOption(value, localRef.current, disabled);
    return () => registerOption(value, null);
  }, [value, disabled, registerOption]);

  const optionProps = {
    ...rest,
    ref: setRef,
    id: getOptionId(value),
    role: "option" as const,
    "aria-selected": selected,
    "aria-disabled": disabled || undefined,
    "data-disabled": disabled ? "" : undefined,
    "data-highlighted": activeValue === value ? "" : undefined,
    onClick: composeEventHandlers(onClick, () => {
      if (disabled) return;
      select(value);
    }),
  };

  return asChild ? (
    <Slot {...optionProps}>{children}</Slot>
  ) : (
    <div {...optionProps}>{children}</div>
  );
}

export function ListboxGroup({
  label,
  asChild = false,
  children,
  ref,
  ...rest
}: ListboxGroupProps): ReactElement {
  const groupProps = {
    ...rest,
    ref,
    role: "group" as const,
    "aria-label": label,
  };

  return asChild ? (
    <Slot {...groupProps}>{children}</Slot>
  ) : (
    <div {...groupProps}>{children}</div>
  );
}

/** The shape of the exported `Listbox` value. */
export type TListboxCompound = typeof ListboxRoot & {
  Root: typeof ListboxRoot;
  Option: typeof ListboxOption;
  Group: typeof ListboxGroup;
};

const ListboxCompound: TListboxCompound = Object.assign(ListboxRoot, {
  Root: ListboxRoot,
  Option: ListboxOption,
  Group: ListboxGroup,
});

ListboxCompound.displayName = "Listbox";

export { ListboxCompound as Listbox };
