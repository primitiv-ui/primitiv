import { useContext } from "react";
import type { KeyboardEvent, RefObject } from "react";

import { composeEventHandlers } from "../../Slot/index.ts";
import { NavigationMenuPanelContext } from "../NavigationMenuContext";
import type { NavigationMenuLinkProps } from "../types";

import { useNavigationMenuTopLevelEntry } from "./useNavigationMenuTopLevelEntry";

export function useNavigationMenuLink({
  onKeyDown,
}: Pick<NavigationMenuLinkProps, "onKeyDown">): {
  linkRef: RefObject<HTMLAnchorElement | null>;
  handleKeyDown: (event: KeyboardEvent<HTMLAnchorElement>) => void;
} {
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

  return { linkRef, handleKeyDown };
}
