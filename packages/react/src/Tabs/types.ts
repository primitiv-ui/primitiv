import { ComponentProps, Ref } from "react";

/** Layout axis of the tab list. `"horizontal"` arranges triggers in a row and
 * binds ArrowLeft/ArrowRight; `"vertical"` stacks them and binds
 * ArrowUp/ArrowDown. */
export type TabsOrientation = "horizontal" | "vertical";

/** Reading direction of the tab list. In `"rtl"` the horizontal arrow keys are
 * mirrored so navigation follows the visual order. */
export type TabsReadingDirection = "ltr" | "rtl";

/** When a focused trigger becomes active. `"automatic"` activates a tab as soon
 * as it receives focus via the arrow keys; `"manual"` requires Enter/Space. */
export type TabsActivationMode = "automatic" | "manual";

/**
 * Payload delivered to the {@link BaseTabsRootProps.onChange | `onChange`} callback
 * on every user-driven tab activation.
 *
 * - `index` — zero-based position of the activated trigger in registration order.
 * - `name`  — the programmatic **value** string passed to `Tabs.Trigger` (e.g.
 *   `"settings"`), **not** the human-readable label text rendered inside the
 *   trigger. Use the `children` of the trigger for the visible label.
 */
export type TabMetadata = { index: number; name: string };

/** Props common to both controlled and uncontrolled `Tabs.Root` usage. */
export type BaseTabsRootProps = {
  /** Fired on every user-driven activation with the activated tab's metadata. */
  onChange?: ({ index, name }: TabMetadata) => void;
};

/** Uncontrolled `Tabs.Root` props: the component owns the active tab, seeded by
 * an optional `defaultValue`. Mutually exclusive with the controlled props. */
export type UncontrolledTabsRootProps = {
  /** Value of the tab active on first render. */
  defaultValue?: string;
  value?: never;
  onValueChange?: never;
};

/** Controlled `Tabs.Root` props: the caller owns the active tab via `value` and
 * is notified of activation requests through `onValueChange`. */
export type ControlledTabsRootProps = {
  /** Value of the currently active tab. */
  value: string;
  /** Called with the requested value when the user activates a tab. */
  onValueChange: (value: string) => void;
  defaultValue?: never;
};

/** Props for `Tabs.Root` — the state owner and context provider. Extends the
 * native `<div>` props (minus `onChange`) and resolves to either the
 * controlled or uncontrolled prop shape. */
export type TabsRootProps = Omit<ComponentProps<"div">, "onChange"> & {
  orientation?: TabsOrientation;
  dir?: TabsReadingDirection;
  activationMode?: TabsActivationMode;
  /** When `true`, a panel's children are not rendered until that tab is first
   * activated. Once mounted they remain in the DOM across subsequent tab
   * switches (lazy mount, not unmount-on-hide). Useful for panels that own
   * expensive initialisation — e.g. a scroll-snap carousel whose initial
   * scroll position must be set while the panel is visible. */
  lazyMount?: boolean;
} & BaseTabsRootProps &
  (UncontrolledTabsRootProps | ControlledTabsRootProps);

/** The value shared by `Tabs.Root` with its descendants through context:
 * resolved configuration, the active tab and its setter, and the registry of
 * triggers used for roving focus and keyboard navigation. */
export type TabsContextValue = {
  orientation: TabsOrientation;
  dir: TabsReadingDirection;
  activationMode: TabsActivationMode;
  activeValue: string | undefined;
  isControlled: boolean;
  setActiveValue: (next: string) => void;
  onValueChange?: (value: string) => void;
  onChange?: ({ index, name }: TabMetadata) => void;
  tabsId: string;
  lazyMount: boolean;
  registerTrigger: (
    value: string,
    element: HTMLButtonElement | null,
    disabled?: boolean,
  ) => void;
  triggerValues: string[];
  disabledTriggerValues: Set<string>;
  focusTrigger: (value: string) => void;
};

/** Props for `Tabs.List` — the `role="tablist"` container. Requires exactly one
 * accessible name source: either an inline `label` or an `ariaLabelledBy` id
 * referencing existing label text. */
export type TabsListProps = Omit<
  ComponentProps<"div">,
  "label" | "aria-labelledby"
> &
  (
    | { label: string; ariaLabelledBy?: never }
    | { label?: never; ariaLabelledBy: string }
  );
/** Props for `Tabs.Trigger` — an individual `role="tab"` button. Identified by
 * its required `value`, which links it to the `Tabs.Content` of the same value.
 * The element type defaults to `HTMLButtonElement` and can be overridden via
 * `asChild` and the `ref` type parameter. */
export type TabsTriggerProps<T extends HTMLElement = HTMLButtonElement> = Omit<
  ComponentProps<"button">,
  "ref"
> & {
  disabled?: boolean;
  value: string;
  /** Render the child element instead of the default `<button>`. All tab
   * ARIA attributes and event handlers are merged onto the child. The child
   * must accept a `ref`. Useful for routing links that need tab semantics. */
  asChild?: boolean;
  /** Ref to the rendered element. Defaults to `HTMLButtonElement`; when using
   * `asChild`, specify the child's element type (e.g. `HTMLAnchorElement`). */
  ref?: Ref<T>;
};

/** Props for `Tabs.Content` — a `role="tabpanel"`. Its required `value` links
 * it to the `Tabs.Trigger` of the same value. */
export type TabsContentProps = ComponentProps<"div"> & {
  /** Value of the trigger this panel belongs to. */
  value: string;
};

/** Imperative handle exposed on the `Tabs.Root` ref for programmatic control. */
export type TabsImperativeApi = {
  /** Activate the tab with the given value. */
  setActiveTab: (value: string) => void;
};
