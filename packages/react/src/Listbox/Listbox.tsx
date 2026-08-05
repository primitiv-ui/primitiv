import { useEffect, useMemo, useRef, type ReactElement } from "react";

import { composeEventHandlers, composeRefs } from "../Slot/index.ts";

import { ListboxProvider, useListboxContext } from "./ListboxContext";
import { useListboxRoot } from "./hooks/index.ts";
import type { ListboxOptionProps, ListboxRootProps } from "./types";

export function ListboxRoot({
  type,
  defaultValue,
  value: controlledValue,
  onValueChange,
  selectionFollowsFocus = false,
  onFocus,
  onBlur,
  onKeyDown,
  children,
  ref,
  ...rest
}: ListboxRootProps): ReactElement {
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
  });

  const contextValue = useMemo(
    () => ({ selectedValues, select, activeValue, registerOption, getOptionId }),
    [selectedValues, select, activeValue, registerOption, getOptionId],
  );

  return (
    <ListboxProvider value={contextValue}>
      <div
        {...rest}
        ref={ref}
        role="listbox"
        tabIndex={0}
        aria-multiselectable={type === "multiple" ? true : undefined}
        aria-activedescendant={
          activeValue === undefined ? undefined : getOptionId(activeValue)
        }
        onFocus={composeEventHandlers(onFocus, seedActiveValue)}
        onBlur={composeEventHandlers(onBlur, clearActiveValue)}
        onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
      >
        {children}
      </div>
    </ListboxProvider>
  );
}

export function ListboxOption({
  value,
  disabled = false,
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

  return (
    <div
      {...rest}
      ref={setRef}
      id={getOptionId(value)}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      data-disabled={disabled ? "" : undefined}
      data-highlighted={activeValue === value ? "" : undefined}
      onClick={composeEventHandlers(onClick, () => {
        if (disabled) return;
        select(value);
      })}
    >
      {children}
    </div>
  );
}

/** The shape of the exported `Listbox` value. */
export type TListboxCompound = typeof ListboxRoot & {
  Root: typeof ListboxRoot;
  Option: typeof ListboxOption;
};

const ListboxCompound: TListboxCompound = Object.assign(ListboxRoot, {
  Root: ListboxRoot,
  Option: ListboxOption,
});

ListboxCompound.displayName = "Listbox";

export { ListboxCompound as Listbox };
