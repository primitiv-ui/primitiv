import { useMemo, type ReactElement } from "react";

import { composeEventHandlers } from "../Slot/index.ts";

import { ListboxProvider, useListboxContext } from "./ListboxContext";
import { useListboxRoot } from "./hooks/index.ts";
import type { ListboxOptionProps, ListboxRootProps } from "./types";

export function ListboxRoot({
  type: _type,
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  ref,
  ...rest
}: ListboxRootProps): ReactElement {
  const { selectedValues, select } = useListboxRoot({
    defaultValue,
    value: controlledValue,
    onValueChange,
  });

  const contextValue = useMemo(
    () => ({ selectedValues, select }),
    [selectedValues, select],
  );

  return (
    <ListboxProvider value={contextValue}>
      <div {...rest} ref={ref} role="listbox">
        {children}
      </div>
    </ListboxProvider>
  );
}

export function ListboxOption({
  value,
  onClick,
  children,
  ref,
  ...rest
}: ListboxOptionProps): ReactElement {
  const { selectedValues, select } = useListboxContext();
  const selected = selectedValues.includes(value);

  return (
    <div
      {...rest}
      ref={ref}
      role="option"
      aria-selected={selected}
      onClick={composeEventHandlers(onClick, () => select(value))}
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
