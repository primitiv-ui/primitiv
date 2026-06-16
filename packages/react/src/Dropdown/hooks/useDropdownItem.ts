import { MouseEventHandler, useState } from "react";
import { composeEventHandlers, SlotProps } from "../../Slot/index.ts";
import { useCloseSiblingSub } from "./useCloseSiblingSub";
import { useDropdownContext } from "./useDropdownContext";
import { DropdownItemProps } from "../types";

type UseDropdownItemArgs = {
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLLIElement>;
  onSelect?: (event: Event) => void;
  restProps: Omit<DropdownItemProps, "children" | "asChild">;
};

export function useDropdownItem({
  disabled,
  onClick,
  onSelect,
  restProps,
}: UseDropdownItemArgs) {
  const { setOpen, triggerRef } = useDropdownContext();
  const closeSiblingSub = useCloseSiblingSub();
  const [highlighted, setHighlighted] = useState(false);
  const handleClick = () => {
    if (disabled) return;
    const event = new Event("dropdown.select", { cancelable: true });
    onSelect?.(event);
    if (!event.defaultPrevented) {
      setOpen(false);
      triggerRef.current?.focus();
    }
  };
  const itemProps = {
    ...restProps,
    role: "menuitem" as const,
    tabIndex: -1,
    "aria-disabled": disabled || undefined,
    "data-highlighted": highlighted ? "" : undefined,
    onClick: composeEventHandlers(onClick, handleClick),
    onMouseEnter: composeEventHandlers(restProps.onMouseEnter, () => {
      setHighlighted(true);
      closeSiblingSub();
    }),
    onMouseLeave: composeEventHandlers(restProps.onMouseLeave, () =>
      setHighlighted(false),
    ),
  } as Omit<SlotProps, "children">;

  return { itemProps };
}
