import { ComponentProps, ReactNode, Ref } from "react";
import { HeadingLevel } from "../types";

/** Props shared by both control modes of `Accordion.Root`. */
export type AccordionRootBaseProps = ComponentProps<"div"> & {
  /** Allow more than one section to be expanded at a time. */
  multiple?: boolean;
  /** Layout axis, controlling arrow-key navigation. Defaults to `"vertical"`. */
  orientation?: "vertical" | "horizontal";
  /** Reading direction, controlling left/right key semantics. */
  dir?: AccordionReadingDirection;
};

/** `Accordion.Root` props for the uncontrolled (self-managed) expanded state. */
export type AccordionRootUncontrolledProps = AccordionRootBaseProps & {
  /** Initially expanded item value when uncontrolled. */
  defaultValue?: string;
  value?: never;
  onValueChange?: never;
};

/** `Accordion.Root` props for the controlled expanded state. */
export type AccordionRootControlledProps = AccordionRootBaseProps & {
  defaultValue?: never;
  /** Controlled set of expanded item values. */
  value: string[];
  /** Called whenever the set of expanded item values changes. */
  onValueChange: (values: string[]) => void;
};

/** Reading direction for an accordion. */
export type AccordionReadingDirection = "ltr" | "rtl";

/** Props for `Accordion.Root`, in either the controlled or uncontrolled mode. */
export type AccordionRootProps =
  | AccordionRootUncontrolledProps
  | AccordionRootControlledProps;

/** Props for `Accordion.Item` — a single collapsible section. */
export type AccordionItemProps = ComponentProps<"div"> & {
  /** Section contents — typically a `Header` + `Content` pair. */
  children: ReactNode;
  /** Stable value identifying the item; auto-generated via `useId()` when omitted. */
  value?: string; // Optional - if not provided, useId() will generate one
};

/** Props for `Accordion.Trigger` — the button that toggles a section. */
export type AccordionTriggerProps<T extends HTMLElement = HTMLButtonElement> =
  Omit<ComponentProps<"button">, "disabled" | "ref"> & {
    /** Trigger label / contents. */
    children: ReactNode;
    /** Disable the trigger, removing it from keyboard navigation. */
    disabled?: boolean;
    /** Render into the consumer's own element instead of a `<button>`. */
    asChild?: boolean;
    /** Ref to the rendered element. Defaults to `HTMLButtonElement`; when using
     * `asChild`, specify the child's element type (e.g. `HTMLAnchorElement`). */
    ref?: Ref<T>;
  };

/** Props for `Accordion.Header` — the heading wrapping a trigger. */
export type AccordionHeaderProps = ComponentProps<"h3"> & {
  /** Header contents — typically an `Accordion.Trigger`. */
  children: ReactNode;
  /** Heading level rendered (`h1`–`h6`). Defaults to `3`. */
  level?: HeadingLevel;
};

/** Props for `Accordion.Content` — the collapsible panel. */
export type AccordionContentProps = ComponentProps<"div"> & {
  /** Panel contents. */
  children: ReactNode;
  /** Keep the panel mounted even while collapsed. */
  forceMount?: boolean;
};

/** Props for `Accordion.TriggerIcon` — a decorative open/closed indicator. */
export type AccordionTriggerIconProps = ComponentProps<"span"> & {
  /** Icon contents. */
  children: ReactNode;
};

/** Context value published by `Accordion.Root` to coordinate its sections. */
export type AccordionContextValue = {
  /** Generated id namespacing the accordion's element ids. */
  accordionId: string;
  /** Set of currently expanded item values. */
  expandedItems: Set<string>;
  /** Layout axis used for arrow-key navigation. */
  orientation: "vertical" | "horizontal";
  /** Reading direction used for left/right key semantics. */
  dir: AccordionReadingDirection;
  /** Toggles the expanded state of the given item. */
  toggleItem: (itemId: string) => void;
  /** Registers a trigger element so roving focus can reach it. */
  registerTrigger: (
    itemId: string,
    element: HTMLButtonElement | null,
    disabled?: boolean,
  ) => void;
  /** Ordered ids of registered triggers, used for focus movement. */
  registeredTriggerItemIds: string[];
  /** Set of item ids whose triggers are disabled. */
  disabledItemIds: Set<string>;
  /** Moves focus to the given item's trigger. */
  focusTrigger: (itemId: string) => void;
  /** Registers a content panel as mounted. */
  registerPanel: (itemId: string) => void;
  /** Removes a previously registered content panel. */
  unregisterPanel: (itemId: string) => void;
};

/** Context value published by `Accordion.Item` to its header and content. */
export type AccordionItemContextValue = {
  /** Id of the trigger button. */
  buttonId: string;
  /** Id of the content panel. */
  panelId: string;
  /** Stable value identifying this item. */
  itemId: string;
  /** Whether this item is currently expanded. */
  isExpanded: boolean;
};
