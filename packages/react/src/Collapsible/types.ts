import { ComponentProps, ReactNode, Ref } from "react";

/**
 * Shared base for both {@link CollapsibleRootProps} variants — the native
 * `<div>` attributes (minus the conflicting `onChange`) plus the `disabled`
 * flag common to both state modes.
 */
export type CollapsibleRootBaseProps = Omit<
  ComponentProps<"div">,
  "onChange"
> & {
  /**
   * When `true`, disables the widget: the {@link CollapsibleTriggerProps |
   * Trigger} renders `aria-disabled="true"` (staying focusable) and both
   * click and keyboard activation are short-circuited. Mirrored as
   * `data-disabled` onto Root, Trigger, and Content.
   * @default false
   */
  disabled?: boolean;
};

/**
 * Uncontrolled variant of {@link CollapsibleRootProps}: the component owns
 * the open state. Pass `defaultOpen` (or omit it); `open` is forbidden.
 */
export type CollapsibleRootUncontrolledProps = CollapsibleRootBaseProps & {
  /**
   * Initial open state on first render. The component owns the value
   * thereafter.
   * @default false
   */
  defaultOpen?: boolean;
  /** Forbidden in uncontrolled mode — use `defaultOpen` instead. */
  open?: never;
  /** Called with the new open state on every toggle. Optional in
   * uncontrolled mode (Collapsible fires it in both modes). */
  onOpenChange?: (open: boolean) => void;
};

/**
 * Controlled variant of {@link CollapsibleRootProps}: the parent owns the
 * open value. Pass `open` and `onOpenChange` together; `defaultOpen` is
 * forbidden.
 */
export type CollapsibleRootControlledProps = CollapsibleRootBaseProps & {
  /** The controlled open state. Must be kept in sync by the parent via
   * `onOpenChange`. */
  open: boolean;
  /** Called with the requested open state on every toggle. Required in
   * controlled mode. */
  onOpenChange: (open: boolean) => void;
  /** Forbidden in controlled mode — use `open` instead. */
  defaultOpen?: never;
};

/**
 * Props for {@link CollapsibleRoot | `Collapsible.Root`}.
 *
 * Resolves to either {@link CollapsibleRootUncontrolledProps} or
 * {@link CollapsibleRootControlledProps} — only one shape is accepted by
 * TypeScript at a time.
 */
export type CollapsibleRootProps =
  | CollapsibleRootUncontrolledProps
  | CollapsibleRootControlledProps;

/**
 * Props for {@link CollapsibleTrigger | `Collapsible.Trigger`}, the button
 * that toggles the panel.
 *
 * Generic over the rendered element type so `asChild` consumers can type
 * the forwarded `ref` (e.g. `Collapsible.Trigger<HTMLAnchorElement>`).
 */
export type CollapsibleTriggerProps<T extends HTMLElement = HTMLButtonElement> =
  Omit<ComponentProps<"button">, "ref"> & {
    /** Trigger content (label, and optionally a
     * {@link CollapsibleTriggerIconProps | TriggerIcon}). */
    children: ReactNode;
    /**
     * Render a single consumer-supplied child element instead of the default
     * `<button>`, merging the Trigger's ARIA, handlers, and ref onto it via
     * the {@link Slot} pattern. When `asChild` and the Root is `disabled`,
     * `role="button"` is injected so `aria-disabled` is semantically valid.
     * @default false
     */
    asChild?: boolean;
    /** Forwarded to the rendered element. Defaults to `HTMLButtonElement`;
     * when using `asChild`, specify the child's element type (e.g.
     * `HTMLAnchorElement`). Composed with the library's internal ref. */
    ref?: Ref<T>;
  };

/**
 * Props for {@link CollapsibleContent | `Collapsible.Content`}, the panel
 * revealed when open.
 */
export type CollapsibleContentProps = ComponentProps<"div"> & {
  /** Panel content. */
  children: ReactNode;
  /**
   * Keep the panel mounted (and in the DOM) even when closed, so open/close
   * transitions can be CSS-driven. When closed under `forceMount`, the panel
   * gets `aria-hidden="true"` instead of the `hidden` attribute. Consumers
   * may override `aria-hidden` explicitly.
   * @default false
   */
  forceMount?: boolean;
};

/**
 * Props for {@link CollapsibleTriggerIcon | `Collapsible.TriggerIcon`}, the
 * `aria-hidden` icon wrapper carrying an open/closed `data-state` hook.
 */
export type CollapsibleTriggerIconProps = ComponentProps<"span"> & {
  /** The icon to render (inline SVG or an icon component). */
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
