import type { KeyboardEvent, MouseEvent, PointerEvent, RefObject } from "react";

import { composeEventHandlers } from "../../Slot/index.ts";
import { useNavigationMenuContext } from "../NavigationMenuContext";
import type { NavigationMenuTriggerProps } from "../types";
import { getTriggerAnchorName } from "../utils";

import { useNavigationMenuEntry } from "./useNavigationMenuEntry";
import { useNavigationMenuTopLevelEntry } from "./useNavigationMenuTopLevelEntry";

export function useNavigationMenuTrigger({
  onClick,
  onPointerEnter,
  onPointerLeave,
  onKeyDown,
}: Pick<
  NavigationMenuTriggerProps,
  "onClick" | "onPointerEnter" | "onPointerLeave" | "onKeyDown"
>): {
  triggerRef: RefObject<HTMLButtonElement | null>;
  triggerId: string;
  panelId: string;
  open: boolean;
  state: "open" | "closed";
  /** This trigger's own `anchor-name`, so the shared Viewport can position
   * its panel relative to whichever trigger opened it. */
  anchorName: string;
  handleClick: (event: MouseEvent<HTMLButtonElement>) => void;
  handlePointerEnter: (event: PointerEvent<HTMLButtonElement>) => void;
  handlePointerLeave: (event: PointerEvent<HTMLButtonElement>) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
} {
  const { controller } = useNavigationMenuContext();
  const { value, triggerId, panelId, open, state } = useNavigationMenuEntry();
  // Joins the top-level travel order; the keys themselves are the controller's,
  // which travels too once the enter-panel arrow has had its turn.
  const { entryRef: triggerRef } =
    useNavigationMenuTopLevelEntry<HTMLButtonElement>();

  // The controller remembers what was open when the pointer arrived: a pointer
  // that comes to click fires `pointerenter` first, which — with hover-to-open
  // — opens the panel *before* the click lands, so the click toggles against
  // what the user saw, not against their own hover.
  const toggle = () => controller.toggle(value);
  const hoverOpen = () => controller.hoverStart(value);
  const pointerLeave = () => controller.hoverEnd();
  // The arrow across the bar's axis opens the panel and moves focus into it
  // (once it renders, on the Root's sync); every other key travels.
  const keydown = (event: KeyboardEvent<HTMLButtonElement>) =>
    controller.keydown(value, event.currentTarget, event.nativeEvent);

  const handleClick = composeEventHandlers<MouseEvent<HTMLButtonElement>>(
    onClick,
    toggle,
  );
  const handlePointerEnter = composeEventHandlers<
    PointerEvent<HTMLButtonElement>
  >(onPointerEnter, hoverOpen);
  const handlePointerLeave = composeEventHandlers<
    PointerEvent<HTMLButtonElement>
  >(onPointerLeave, pointerLeave);
  const handleKeyDown = composeEventHandlers<KeyboardEvent<HTMLButtonElement>>(
    onKeyDown,
    keydown,
  );

  return {
    triggerRef,
    triggerId,
    panelId,
    open,
    state,
    anchorName: getTriggerAnchorName(triggerId),
    handleClick,
    handlePointerEnter,
    handlePointerLeave,
    handleKeyDown,
  };
}
