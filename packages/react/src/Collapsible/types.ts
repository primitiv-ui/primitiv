import { ComponentProps, ReactNode, Ref } from "react";

/** Props common to both controlled and uncontrolled `Collapsible.Root` modes. */
export type CollapsibleRootBaseProps = Omit<
  ComponentProps<"div">,
  "onChange"
> & {
  /** When `true`, disables the widget and short-circuits trigger activation. */
  disabled?: boolean;
};

/**
 * Props for `Collapsible.Root` in uncontrolled mode — the component owns the
 * open state. Pass `defaultOpen` to set the initial value; `open` is forbidden.
 */
export type CollapsibleRootUncontrolledProps = CollapsibleRootBaseProps & {
  /** Initial open state when uncontrolled. Defaults to `false`. */
  defaultOpen?: boolean;
  /** Forbidden in uncontrolled mode. */
  open?: never;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
};

/**
 * Props for `Collapsible.Root` in controlled mode — the parent owns the open
 * value. Pass `open` and `onOpenChange` together; `defaultOpen` is forbidden.
 */
export type CollapsibleRootControlledProps = CollapsibleRootBaseProps & {
  /** The controlled open state. */
  open: boolean;
  /** Called whenever the component requests an open-state change. */
  onOpenChange: (open: boolean) => void;
  /** Forbidden in controlled mode. */
  defaultOpen?: never;
};

/** Props for `Collapsible.Root` — discriminated controlled/uncontrolled union. */
export type CollapsibleRootProps =
  | CollapsibleRootUncontrolledProps
  | CollapsibleRootControlledProps;

/** Props for `Collapsible.Trigger`, the button that toggles the panel. */
export type CollapsibleTriggerProps<T extends HTMLElement = HTMLButtonElement> =
  Omit<ComponentProps<"button">, "ref"> & {
    /** Trigger content (label, icon, etc.). */
    children: ReactNode;
    /** Render the child element instead of the default `<button>`. */
    asChild?: boolean;
    /** Ref to the rendered element. Defaults to `HTMLButtonElement`; when using
     * `asChild`, specify the child's element type (e.g. `HTMLAnchorElement`). */
    ref?: Ref<T>;
  };

/** Props for `Collapsible.Content`, the panel revealed when open. */
export type CollapsibleContentProps = ComponentProps<"div"> & {
  /** Panel content. */
  children: ReactNode;
  /** Keep the panel mounted when closed so transitions can be CSS-driven. */
  forceMount?: boolean;
};

/** Props for `Collapsible.TriggerIcon`, the aria-hidden icon wrapper. */
export type CollapsibleTriggerIconProps = ComponentProps<"span"> & {
  /** The icon to render (inline SVG or icon component). */
  children: ReactNode;
};

/** Value shared through Collapsible context to all sub-components. */
export type CollapsibleContextValue = {
  /** Whether the panel is currently open. */
  open: boolean;
  /** Whether the widget is disabled. */
  disabled: boolean;
  /** Toggle the open state. */
  toggle: () => void;
  /** Generated id linking trigger to content. */
  triggerId: string;
  /** Generated id of the content panel. */
  contentId: string;
};
