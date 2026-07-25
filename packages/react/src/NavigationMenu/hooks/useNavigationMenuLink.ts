import { useContext } from "react";
import type { KeyboardEvent, MouseEvent, RefObject } from "react";

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
}: Pick<NavigationMenuLinkProps, "onKeyDown" | "onClick">): {
  linkRef: RefObject<HTMLAnchorElement | null>;
  handleKeyDown: (event: KeyboardEvent<HTMLAnchorElement>) => void;
  handleClick: (event: MouseEvent<HTMLAnchorElement>) => void;
} {
  const { setOpenValue, cancelOpen } = useNavigationMenuContext();
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

  return { linkRef, handleKeyDown, handleClick };
}
