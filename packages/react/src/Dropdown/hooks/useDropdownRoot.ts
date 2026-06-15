import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
} from "react";

import { Direction } from "../../DirectionProvider/index.ts";
import { useControllableState } from "../../hooks/index.ts";

type UseDropdownRootArgs = {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  dir?: Direction;
};

export function useDropdownRoot({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  dir = "ltr",
}: UseDropdownRootArgs) {
  const contentId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpenBase] = useControllableState<boolean>(
    controlledOpen,
    defaultOpen,
    onOpenChange,
  );
  // Mirror `open` so setOpen can short-circuit repeat transitions within a
  // single event without a re-render in between. Without this, internal
  // paths that converge on the same close (e.g. a light-dismiss firing
  // both a `toggle` event and a document click) would double-notify
  // consumers via onOpenChange.
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  });

  const setOpen = useCallback(
    (next: boolean) => {
      if (openRef.current === next) return;
      openRef.current = next;
      setOpenBase(next);
    },
    [setOpenBase],
  );

  const contextValue = useMemo(
    () => ({ open, setOpen, contentId, triggerRef, dir }),
    [open, setOpen, contentId, dir],
  );

  return { open, setOpen, contextValue };
}
