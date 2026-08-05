import type { ReactElement } from "react";

import type { ListboxOptionProps, ListboxRootProps } from "./types";

export function ListboxRoot({
  type: _type,
  children,
  ref,
  ...rest
}: ListboxRootProps): ReactElement {
  return (
    <div {...rest} ref={ref} role="listbox">
      {children}
    </div>
  );
}

export function ListboxOption({
  value: _value,
  children,
  ref,
  ...rest
}: ListboxOptionProps): ReactElement {
  return (
    <div {...rest} ref={ref} role="option">
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
