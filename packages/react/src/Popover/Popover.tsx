import { useEffect, useId } from "react";
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
  PopoverDescriptionProps,
  PopoverRootProps,
  PopoverTitleProps,
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

export function PopoverTitle({
  children,
  ...rest
}: PopoverTitleProps): ReactElement {
  const { registerTitle } = usePopoverContext();
  const id = useId();

  useEffect(() => {
    registerTitle(id);
    return () => registerTitle(undefined);
  }, [registerTitle, id]);

  return (
    <h2 id={id} {...rest}>
      {children}
    </h2>
  );
}

/** @internal */
PopoverTitle.displayName = "PopoverTitle";

export function PopoverDescription({
  children,
  ...rest
}: PopoverDescriptionProps): ReactElement {
  const { registerDescription } = usePopoverContext();
  const id = useId();

  useEffect(() => {
    registerDescription(id);
    return () => registerDescription(undefined);
  }, [registerDescription, id]);

  return (
    <p id={id} {...rest}>
      {children}
    </p>
  );
}

/** @internal */
PopoverDescription.displayName = "PopoverDescription";

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
  /** The popover's accessible name; auto-wires `aria-labelledby`. */
  Title: typeof PopoverTitle;
  /** The popover's accessible description; auto-wires `aria-describedby`. */
  Description: typeof PopoverDescription;
};

const PopoverCompound: PopoverCompound = Object.assign(PopoverRoot, {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Close: PopoverClose,
  Title: PopoverTitle,
  Description: PopoverDescription,
});

PopoverCompound.displayName = "Popover";

export { PopoverCompound as Popover };
