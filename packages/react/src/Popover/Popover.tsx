import type { ReactElement } from "react";

import { composeEventHandlers } from "../Slot/index.ts";
import { PopoverContext, usePopoverContext } from "./PopoverContext";
import {
  usePopoverContent,
  usePopoverRoot,
  usePopoverTrigger,
} from "./hooks/index.ts";

import type {
  PopoverCloseProps,
  PopoverContentProps,
  PopoverRootProps,
  PopoverTriggerProps,
} from "./types";

export function PopoverRoot({
  children,
  defaultOpen,
  open,
  onOpenChange,
}: PopoverRootProps): ReactElement {
  const { contextValue } = usePopoverRoot({ defaultOpen, open, onOpenChange });

  return (
    <PopoverContext.Provider value={contextValue}>
      {children}
    </PopoverContext.Provider>
  );
}

/** @internal */
PopoverRoot.displayName = "PopoverRoot";

export function PopoverTrigger<T extends HTMLElement = HTMLButtonElement>({
  children,
  ...rest
}: PopoverTriggerProps<T>): ReactElement {
  const { triggerProps } = usePopoverTrigger(rest);

  return (
    <button type="button" {...triggerProps}>
      {children}
    </button>
  );
}

/** @internal */
PopoverTrigger.displayName = "PopoverTrigger";

export function PopoverContent({
  children,
  onKeyDown,
  ...rest
}: PopoverContentProps): ReactElement {
  const { contentProps } = usePopoverContent({ onKeyDown });

  return (
    <div {...rest} {...contentProps}>
      {children}
    </div>
  );
}

/** @internal */
PopoverContent.displayName = "PopoverContent";

export function PopoverClose({
  children,
  onClick,
  ...rest
}: PopoverCloseProps): ReactElement {
  const { setOpen, triggerRef } = usePopoverContext();

  const closeProps = {
    ...rest,
    onClick: composeEventHandlers(onClick, () => {
      setOpen(false);
      triggerRef.current?.focus();
    }),
  };

  return (
    <button type="button" {...closeProps}>
      {children}
    </button>
  );
}

/** @internal */
PopoverClose.displayName = "PopoverClose";

/** Type of the {@link Popover} compound — the Root callable plus its sub-components. */
type PopoverCompound = typeof PopoverRoot & {
  /** The root, owning open state and context. */
  Root: typeof PopoverRoot;
  /** The button that toggles the popover. */
  Trigger: typeof PopoverTrigger;
  /** The floating panel. */
  Content: typeof PopoverContent;
  /** A button that closes the popover. */
  Close: typeof PopoverClose;
};

const PopoverCompound: PopoverCompound = Object.assign(PopoverRoot, {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Close: PopoverClose,
});

PopoverCompound.displayName = "Popover";

export { PopoverCompound as Popover };
