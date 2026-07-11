import { ComponentProps, ReactNode, Ref, RefObject } from "react";

/** Props common to both controlled and uncontrolled `Popover.Root` modes. */
export type PopoverRootBaseProps = {
  /** The Popover sub-components. */
  children?: ReactNode;
};

/**
 * Props for `Popover.Root` in uncontrolled mode — the component owns the
 * open state. Pass `defaultOpen` to set the initial value; `open` is forbidden.
 */
export type PopoverRootUncontrolledProps = PopoverRootBaseProps & {
  /** Initial open state when uncontrolled. Defaults to `false`. */
  defaultOpen?: boolean;
  /** Forbidden in uncontrolled mode. */
  open?: never;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
};

/**
 * Props for `Popover.Root` in controlled mode — the parent owns the open
 * value. Pass `open` and `onOpenChange` together; `defaultOpen` is forbidden.
 */
export type PopoverRootControlledProps = PopoverRootBaseProps & {
  /** The controlled open state. */
  open: boolean;
  /** Called whenever the component requests an open-state change. */
  onOpenChange: (open: boolean) => void;
  /** Forbidden in controlled mode. */
  defaultOpen?: never;
};

/** Props for `Popover.Root` — discriminated controlled/uncontrolled union. */
export type PopoverRootProps =
  | PopoverRootUncontrolledProps
  | PopoverRootControlledProps;

/** Props for `Popover.Trigger`, the button that toggles the popover. */
export type PopoverTriggerProps<T extends HTMLElement = HTMLButtonElement> =
  Omit<ComponentProps<"button">, "ref"> & {
    /** Trigger content (label, icon, etc.). */
    children?: ReactNode;
    /** Render the child element instead of the default `<button>`. */
    asChild?: boolean;
    /** Ref to the rendered element. Defaults to `HTMLButtonElement`; when using
     * `asChild`, specify the child's element type (e.g. `HTMLAnchorElement`). */
    ref?: Ref<T>;
  };

/** Props for `Popover.Content`, the floating panel. */
export type PopoverContentProps = ComponentProps<"div"> & {
  /** Panel content. */
  children?: ReactNode;
  /** Render the child element instead of the default `<div>`. */
  asChild?: boolean;
  /** Ref to the rendered element. */
  ref?: Ref<HTMLDivElement>;
};

/**
 * Props for `Popover.Anchor`, an optional element the popover is positioned
 * against instead of the trigger. Attach a CSS `anchor-name` to it and a
 * matching `position-anchor` to `Popover.Content`.
 */
export type PopoverAnchorProps = ComponentProps<"div"> & {
  /** Anchor content. */
  children?: ReactNode;
  /** Render the child element instead of the default `<div>`. */
  asChild?: boolean;
};

/** Props for `Popover.Close`, the button that closes the popover. */
export type PopoverCloseProps = ComponentProps<"button"> & {
  /** Close-button content (label, icon, etc.). */
  children?: ReactNode;
  /** Render the child element instead of the default `<button>`. */
  asChild?: boolean;
};

/** Props for `Popover.Title`, the popover's accessible name. */
export type PopoverTitleProps = ComponentProps<"h2"> & {
  /** Title content. */
  children?: ReactNode;
  /** Render the child element instead of the default `<h2>`. */
  asChild?: boolean;
};

/** Props for `Popover.Description`, the popover's accessible description. */
export type PopoverDescriptionProps = ComponentProps<"p"> & {
  /** Description content. */
  children?: ReactNode;
  /** Render the child element instead of the default `<p>`. */
  asChild?: boolean;
};

/** Value shared through Popover context to all sub-components. */
export type PopoverContextValue = {
  /** Whether the popover is currently open. */
  open: boolean;
  /** Request an open-state change. */
  setOpen: (open: boolean) => void;
  /** Ref to the trigger element, used for focus return. */
  triggerRef: RefObject<HTMLButtonElement | null>;
  /** Generated id of the content panel. */
  contentId: string;
  /** Id of the rendered `Popover.Title`, or `undefined` when absent. */
  titleId: string | undefined;
  /** Id of the rendered `Popover.Description`, or `undefined` when absent. */
  descriptionId: string | undefined;
  /** Register (or clear) the title id for `aria-labelledby`. */
  registerTitle: (id: string | undefined) => void;
  /** Register (or clear) the description id for `aria-describedby`. */
  registerDescription: (id: string | undefined) => void;
};
