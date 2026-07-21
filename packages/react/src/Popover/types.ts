import { ComponentProps, ReactNode, Ref, RefObject } from "react";

/** Props common to both controlled and uncontrolled `Popover.Root` modes. */
export type PopoverRootBaseProps = {
  /** The Popover sub-components — typically a {@link PopoverTriggerProps | `Popover.Trigger`}
   * and a {@link PopoverContentProps | `Popover.Content`}, optionally a
   * {@link PopoverAnchorProps | `Popover.Anchor`}. */
  children?: ReactNode;
};

/**
 * Props for {@link PopoverRoot | `Popover.Root`} in uncontrolled mode — the
 * component owns the open state. Pass `defaultOpen` to set the initial value;
 * `open` is forbidden.
 */
export type PopoverRootUncontrolledProps = PopoverRootBaseProps & {
  /**
   * Whether the popover is open on first render. The component owns the flag
   * from then on (trigger toggles, `Popover.Close`, Escape, and light-dismiss
   * all mutate it internally).
   * @default false
   */
  defaultOpen?: boolean;
  /** Forbidden in uncontrolled mode — use `defaultOpen` instead. */
  open?: never;
  /** Called with the new open state after every transition. Optional in
   * uncontrolled mode; use it to observe (not drive) open/close. */
  onOpenChange?: (open: boolean) => void;
};

/**
 * Props for {@link PopoverRoot | `Popover.Root`} in controlled mode — the
 * parent owns the open value. Pass `open` and `onOpenChange` together;
 * `defaultOpen` is forbidden.
 */
export type PopoverRootControlledProps = PopoverRootBaseProps & {
  /** The current open state. Must be kept in sync by the parent via
   * `onOpenChange`. */
  open: boolean;
  /** Called with the requested open state whenever the popover wants to open
   * or close (trigger click, `Popover.Close`, Escape, outside dismiss).
   * Required in controlled mode — the popover will not move unless the parent
   * updates `open`. */
  onOpenChange: (open: boolean) => void;
  /** Forbidden in controlled mode — use `open` instead. */
  defaultOpen?: never;
};

/**
 * Props for {@link PopoverRoot | `Popover.Root`} — a discriminated union that
 * resolves to either {@link PopoverRootUncontrolledProps} or
 * {@link PopoverRootControlledProps}, so TypeScript accepts exactly one mode.
 */
export type PopoverRootProps =
  | PopoverRootUncontrolledProps
  | PopoverRootControlledProps;

/**
 * Props for {@link PopoverTrigger | `Popover.Trigger`}, the button that toggles
 * the popover. Extends the native `<button>` attributes (with `ref` re-typed to
 * the generic element `T`); the trigger's `aria-haspopup` / `aria-expanded` /
 * `aria-controls` and toggle `onClick` are added by the component (a consumer
 * `onClick` composes and can `preventDefault()` to veto the toggle).
 */
export type PopoverTriggerProps<T extends HTMLElement = HTMLButtonElement> =
  Omit<ComponentProps<"button">, "ref"> & {
    /** Trigger content (label, icon, etc.). */
    children?: ReactNode;
    /**
     * Render the single child element instead of the default `<button>`,
     * merging the trigger's ARIA, composed event handlers, and ref onto it via
     * the {@link Slot} pattern.
     * @default false
     */
    asChild?: boolean;
    /** Ref to the rendered element, composed with Root's internal trigger ref
     * (used for focus return on close). Defaults to `HTMLButtonElement`; with
     * `asChild`, set the generic to the child's element type
     * (e.g. `HTMLAnchorElement`). */
    ref?: Ref<T>;
  };

/**
 * Props for {@link PopoverContent | `Popover.Content`}, the floating panel.
 * Extends the native `<div>` attributes; the component adds `role="dialog"`,
 * `popover="auto"`, `tabIndex={-1}`, the `aria-labelledby` / `aria-describedby`
 * wiring (from {@link PopoverTitleProps | `Popover.Title`} /
 * {@link PopoverDescriptionProps | `Popover.Description`}), and the
 * `data-state` hook. Open/close, focus movement into the panel, Escape, and
 * light-dismiss are all handled internally — no props needed.
 */
export type PopoverContentProps = ComponentProps<"div"> & {
  /** Panel content — typically {@link PopoverTitleProps | `Popover.Title`},
   * body markup, and a {@link PopoverCloseProps | `Popover.Close`}. */
  children?: ReactNode;
  /**
   * Render the single child element (e.g. a `<section>` or motion wrapper)
   * instead of the default `<div>`, merging the dialog props and internal ref
   * onto it via the {@link Slot} pattern.
   * @default false
   */
  asChild?: boolean;
  /** Ref to the rendered element, composed with Root's internal content ref so
   * open/close and focus management keep working. */
  ref?: Ref<HTMLDivElement>;
};

/**
 * Props for {@link PopoverAnchor | `Popover.Anchor`}, an optional element the
 * popover is positioned against instead of the trigger. Attach a CSS
 * `anchor-name` to it and a matching `position-anchor` to
 * {@link PopoverContentProps | `Popover.Content`}. Renders no behaviour of its
 * own — positioning is purely a CSS concern.
 */
export type PopoverAnchorProps = ComponentProps<"div"> & {
  /** Anchor content — the element(s) the popover should be positioned against. */
  children?: ReactNode;
  /**
   * Render the single child element instead of the default `<div>`, projecting
   * the anchor onto an existing element via the {@link Slot} pattern.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Props for {@link PopoverClose | `Popover.Close`}, the button that closes the
 * popover and returns focus to the trigger. Extends the native `<button>`
 * attributes; a consumer `onClick` composes with the close (runs first, can
 * `preventDefault()` to veto closing).
 */
export type PopoverCloseProps = ComponentProps<"button"> & {
  /** Close-button content (label, icon, etc.). */
  children?: ReactNode;
  /**
   * Render the single child element (e.g. a text link or icon button) instead
   * of the default `<button>`, merging the close behaviour onto it via the
   * {@link Slot} pattern.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Props for {@link PopoverTitle | `Popover.Title`}, the popover's accessible
 * name. Extends the native `<h2>` attributes; the component supplies a
 * generated `id` and registers it so `Popover.Content` exposes it via
 * `aria-labelledby`.
 */
export type PopoverTitleProps = ComponentProps<"h2"> & {
  /** Title content, rendered as the popover's accessible name. */
  children?: ReactNode;
  /**
   * Render the single child element (e.g. an `<h3>`) instead of the default
   * `<h2>` via the {@link Slot} pattern; the generated `id` is still applied
   * and registered.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Props for {@link PopoverDescription | `Popover.Description`}, the popover's
 * accessible description. Extends the native `<p>` attributes; the component
 * supplies a generated `id` and registers it so `Popover.Content` exposes it
 * via `aria-describedby`.
 */
export type PopoverDescriptionProps = ComponentProps<"p"> & {
  /** Description content, exposed as the popover's accessible description. */
  children?: ReactNode;
  /**
   * Render the single child element instead of the default `<p>` via the
   * {@link Slot} pattern; the generated `id` is still applied and registered.
   * @default false
   */
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
