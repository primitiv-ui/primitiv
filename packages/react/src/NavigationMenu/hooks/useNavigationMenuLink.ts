import { useContext } from "react";
import type {
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  RefObject,
} from "react";

import { composeEventHandlers } from "../../Slot/index.ts";
import {
  NavigationMenuPanelContext,
  useNavigationMenuContext,
} from "../NavigationMenuContext";
import type { NavigationMenuLinkProps } from "../types";

import { useNavigationMenuTopLevelEntry } from "./useNavigationMenuTopLevelEntry";

export function useNavigationMenuLink({
  onKeyDown,
  onClick,
  onPointerEnter,
}: Pick<
  NavigationMenuLinkProps,
  "onKeyDown" | "onClick" | "onPointerEnter"
>): {
  linkRef: RefObject<HTMLAnchorElement | null>;
  handleKeyDown: (event: KeyboardEvent<HTMLAnchorElement>) => void;
  handleClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  handlePointerEnter: (event: PointerEvent<HTMLAnchorElement>) => void;
} {
  const { setOpenValue, cancelOpen, openOnHover } = useNavigationMenuContext();
  // A link directly inside an Item is a top-level entry and joins the
  // arrow-key travel order; a link inside a Content panel is reached by Tab
  // instead, so it must stay out of that order.
  const insidePanel = useContext(NavigationMenuPanelContext);
  const { entryRef: linkRef, handleKeyDown: handleArrowKeyDown } =
    useNavigationMenuTopLevelEntry<HTMLAnchorElement>(!insidePanel);

  const handleKeyDown = composeEventHandlers<KeyboardEvent<HTMLAnchorElement>>(
    onKeyDown,
    handleArrowKeyDown,
  );
  // Following a link ends the interaction, so the menu closes — whether the
  // link was in a panel or a top-level entry alongside one. Leaving a panel
  // hanging open over the page the user just navigated to is the bug this
  // avoids.
  const handleClick = composeEventHandlers<MouseEvent<HTMLAnchorElement>>(
    onClick,
    () => {
      cancelOpen();
      setOpenValue("");
    },
  );

  // Hovering a top-level link dismisses whatever is open, so travelling along the
  // bar past a plain entry behaves like travelling onto another trigger. Without
  // this, moving from an open trigger onto a link beside it leaves that panel
  // hanging over the page with the pointer nowhere near it.
  //
  // Panel links are exempt for the obvious reason: hovering a row inside a panel
  // must not close the panel it lives in. And it follows `openOnHover`, so a
  // click-only nav stays click-only in both directions.
  const handlePointerEnter = composeEventHandlers<
    PointerEvent<HTMLAnchorElement>
  >(onPointerEnter, () => {
    if (insidePanel || !openOnHover) return;
    cancelOpen();
    setOpenValue("");
  });

  return { linkRef, handleKeyDown, handleClick, handlePointerEnter };
}
