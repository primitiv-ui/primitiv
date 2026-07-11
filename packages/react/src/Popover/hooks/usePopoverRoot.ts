import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { useControllableState } from "../../hooks/index.ts";
import { PopoverContextValue } from "../types";

type UsePopoverRootArgs = {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function usePopoverRoot({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: UsePopoverRootArgs) {
  const contentId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpenBase] = useControllableState<boolean>(
    controlledOpen,
    defaultOpen,
    onOpenChange,
  );

  // Mirror `open` so setOpen can short-circuit repeat transitions within a
  // single event without a re-render in between. Without this, internal
  // paths that converge on the same close (e.g. a light-dismiss firing both
  // a `toggle` event and a document click) would double-notify consumers.
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

  const [titleId, setTitleId] = useState<string | undefined>(undefined);
  const [descriptionId, setDescriptionId] = useState<string | undefined>(
    undefined,
  );
  const registerTitle = useCallback((id: string | undefined) => {
    setTitleId(id);
  }, []);
  const registerDescription = useCallback((id: string | undefined) => {
    setDescriptionId(id);
  }, []);

  const contextValue = useMemo<PopoverContextValue>(
    () => ({
      open,
      setOpen,
      triggerRef,
      contentId,
      titleId,
      descriptionId,
      registerTitle,
      registerDescription,
    }),
    [
      open,
      setOpen,
      contentId,
      titleId,
      descriptionId,
      registerTitle,
      registerDescription,
    ],
  );

  return { contextValue };
}
