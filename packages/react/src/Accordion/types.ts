import { ComponentProps, ReactNode, Ref } from "react";
import { HeadingLevel } from "../types";

/** Props shared by both control modes of `Accordion.Root`. `dir` is `Omit`ted
 * from the native `<div>` props because it is narrowed from the DOM's
 * `string` to {@link AccordionReadingDirection}; without the `Omit` the
 * docs-data extractor picks the wider native declaration and silently drops
 * the narrowed type and its JSDoc (§1.16). */
export type AccordionRootBaseProps = Omit<
  ComponentProps<"div">,
  "dir" | "defaultValue"
> & {
  /** Allow more than one section to be expanded at a time. When `false`,
   * opening an item collapses whichever item was previously open.
   * @default false */
  multiple?: boolean;
  /** Layout axis, controlling arrow-key navigation: `"vertical"` binds
   * ArrowUp/ArrowDown, `"horizontal"` binds ArrowLeft/ArrowRight. Surfaces as
   * `data-orientation` on the root.
   * @default "vertical" */
  orientation?: "vertical" | "horizontal";
  /** Reading direction; see {@link AccordionReadingDirection}. In `"rtl"` the
   * horizontal arrow keys are mirrored. Also set as the container's `dir`
   * attribute. Inherited from the nearest {@link DirectionProvider} when
   * omitted, falling back to `"ltr"`. */
  dir?: AccordionReadingDirection;
};

/** `Accordion.Root` props for the uncontrolled (self-managed) expanded state.
 * The component owns and updates the expanded set internally, and — matching
 * the Tabs contract — does **not** call `onValueChange` in this mode. */
export type AccordionRootUncontrolledProps = AccordionRootBaseProps & {
  /** Value of the item expanded on first render. A single value even in
   * `multiple` mode — uncontrolled accordions can seed only one open item;
   * pass controlled {@link AccordionRootControlledProps.value | `value`} to
   * start with several. Omit to start with everything collapsed. */
  defaultValue?: string;
  /** Forbidden in uncontrolled mode — use `defaultValue`. */
  value?: never;
  /** Forbidden in uncontrolled mode. */
  onValueChange?: never;
};

/** `Accordion.Root` props for the controlled expanded state — the parent owns
 * the expanded set and the component defers every change back through the
 * callback. */
export type AccordionRootControlledProps = AccordionRootBaseProps & {
  /** Forbidden in controlled mode — use `value`. */
  defaultValue?: never;
  /** The full set of currently expanded item values. Must be kept in sync by
   * the parent via `onValueChange`. In single (`multiple={false}`) mode this
   * holds at most one value. */
  value: string[];
  /** Called with the complete next array of expanded values whenever the user
   * toggles an item. */
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
  /** Section contents — typically an {@link AccordionHeaderProps | `Accordion.Header`}
   * + {@link AccordionContentProps | `Accordion.Content`} pair. */
  children: ReactNode;
  /** Stable identifier matched against the root's expanded set (and against
   * `value` / `defaultValue`). When omitted, a stable id is generated via
   * `useId()` — fine for anonymous items whose state is never driven from
   * outside. */
  value?: string;
};

/** Props for `Accordion.Trigger` — the button that toggles a section. */
export type AccordionTriggerProps<T extends HTMLElement = HTMLButtonElement> =
  Omit<ComponentProps<"button">, "disabled" | "ref"> & {
    /** Trigger label / contents — the visible section heading text, plus an
     * optional {@link AccordionTriggerIconProps | `Accordion.TriggerIcon`}. */
    children: ReactNode;
    /** Disable the trigger. Rendered as `aria-disabled` / `data-disabled`
     * rather than the native `disabled` attribute, so the button stays
     * focusable (discoverable by keyboard) but is excluded from arrow-key
     * navigation and cannot be activated.
     * @default false */
    disabled?: boolean;
    /** Render the consumer's own element instead of a `<button>`, merging all
     * accordion ARIA attributes, event handlers, and the ref onto it via the
     * {@link Slot} pattern. When combined with `disabled`, `role="button"` is
     * injected so `aria-disabled` is valid on non-button children.
     * @default false */
    asChild?: boolean;
    /** Ref to the rendered element. Defaults to `HTMLButtonElement`; when using
     * `asChild`, specify the child's element type (e.g. `HTMLAnchorElement`). */
    ref?: Ref<T>;
  };

/** Props for `Accordion.Header` — the heading wrapping a trigger. */
export type AccordionHeaderProps = ComponentProps<"h3"> & {
  /** Header contents — typically an
   * {@link AccordionTriggerProps | `Accordion.Trigger`}. */
  children: ReactNode;
  /** Heading level to render (`h1`–`h6`). Choose the level that fits the
   * surrounding document outline — the WAI-ARIA Accordion pattern requires
   * each trigger to be wrapped in a heading at the right level.
   * @default 3 */
  level?: HeadingLevel;
};

/** Props for `Accordion.Content` — the collapsible panel. */
export type AccordionContentProps = ComponentProps<"div"> & {
  /** Panel contents, revealed when the matching trigger is expanded. */
  children: ReactNode;
  /** Keep the panel mounted in the DOM even while collapsed (instead of
   * removing it from view with the `hidden` attribute), so CSS open/close
   * transitions can run. While closed it receives `aria-hidden="true"` so
   * assistive tech still ignores it; drive visibility yourself via
   * `[data-state="closed"]`.
   * @default false */
  forceMount?: boolean;
};

/** Props for `Accordion.TriggerIcon` — a decorative open/closed indicator. */
export type AccordionTriggerIconProps = ComponentProps<"span"> & {
  /** Icon contents — an inline `<svg>` or any icon component. Rendered inside
   * an `aria-hidden` `<span>` carrying a `data-state` open/close hook. */
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
  /** Registers a trigger element with the root's controller. */
  registerTrigger: (
    itemId: string,
    element: HTMLButtonElement | null,
    disabled?: boolean,
  ) => void;
  /** Ids of registered triggers, each of which must have a content panel. */
  registeredTriggerItemIds: string[];
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
