import type { ReactElement } from "react";

import { PopoverContext } from "./PopoverContext";
import {
  usePopoverContent,
  usePopoverRoot,
  usePopoverTrigger,
} from "./hooks/index.ts";

import type {
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
  ...rest
}: PopoverContentProps): ReactElement {
  const { contentProps } = usePopoverContent();

  return (
    <div {...contentProps} {...rest}>
      {children}
    </div>
  );
}

/** @internal */
PopoverContent.displayName = "PopoverContent";

/** Type of the {@link Popover} compound — the Root callable plus its sub-components. */
type PopoverCompound = typeof PopoverRoot & {
  /** The root, owning open state and context. */
  Root: typeof PopoverRoot;
  /** The button that toggles the popover. */
  Trigger: typeof PopoverTrigger;
  /** The floating panel. */
  Content: typeof PopoverContent;
};

const PopoverCompound: PopoverCompound = Object.assign(PopoverRoot, {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
});

PopoverCompound.displayName = "Popover";

export { PopoverCompound as Popover };
