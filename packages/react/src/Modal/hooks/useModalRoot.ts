import {
  Ref,
  useCallback,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { useControllableState } from "../../hooks/index.ts";

import {
  ModalContentCallbacks,
  ModalContextValue,
  ModalImperativeApi,
} from "../types";

type UseModalRootArgs = {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function useModalRoot(
  { defaultOpen = false, open: controlledOpen, onOpenChange }: UseModalRootArgs,
  ref?: Ref<ModalImperativeApi>,
) {
  const [open, setOpen] = useControllableState<boolean>(
    controlledOpen,
    defaultOpen,
    onOpenChange,
  );
  const contentId = useId();
  const contentCallbacksRef = useRef<ModalContentCallbacks>({});
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

  useImperativeHandle(
    ref,
    () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
    }),
    [setOpen],
  );

  const contextValue = useMemo<ModalContextValue>(
    () => ({
      open,
      setOpen,
      contentId,
      contentCallbacksRef,
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
