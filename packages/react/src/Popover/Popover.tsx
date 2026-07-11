import { useEffect, useId } from "react";
import type { ReactElement, Ref } from "react";

import { Slot, composeEventHandlers } from "../Slot/index.ts";
import { PopoverContext, usePopoverContext } from "./PopoverContext";
import {
  usePopoverContent,
  usePopoverRoot,
  usePopoverTrigger,
} from "./hooks/index.ts";

import type {
  PopoverAnchorProps,
  PopoverCloseProps,
  PopoverContentProps,
  PopoverDescriptionProps,
  PopoverRootProps,
  PopoverTitleProps,
  PopoverTriggerProps,
} from "./types";

/**
 * The root of a Popover — owns open state, generates the ids that wire the
 * trigger to the content, and provides context to descendants. Renders no DOM
 * of its own.
 *
 * Supports two state modes, statically discriminated at the type level:
 *
 * - **Uncontrolled** — pass {@link PopoverRootUncontrolledProps.defaultOpen | `defaultOpen`}
 *   (or omit it for closed-on-mount). The component owns the open flag
 *   internally; observe transitions with `onOpenChange`.
 * - **Controlled** — pass {@link PopoverRootControlledProps.open | `open`} *and*
 *   {@link PopoverRootControlledProps.onOpenChange | `onOpenChange`} together.
 *   The parent owns the flag; the component defers every change back through
 *   the callback.
 *
 * @example Uncontrolled
 * ```tsx
 * <Popover.Root>
 *   <Popover.Trigger>Open</Popover.Trigger>
 *   <Popover.Content>…</Popover.Content>
 * </Popover.Root>
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <Popover.Root open={open} onOpenChange={setOpen}>
 *   <Popover.Trigger>Open</Popover.Trigger>
 *   <Popover.Content>…</Popover.Content>
 * </Popover.Root>
 * ```
 */
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

/**
 * A button that toggles the popover. Renders `<button type="button">` with
 * full ARIA wiring:
 *
 * - `aria-haspopup="dialog"`
 * - `aria-expanded` tracks open state
 * - `aria-controls` points at the `Popover.Content` dialog's id
 *
 * Clicking toggles the popover; a consumer `onClick` composes (runs first, can
 * `event.preventDefault()` to veto the toggle).
 *
 * **`asChild` prop.** Pass `asChild` to render any consumer-supplied element
 * (e.g. an icon button of your own) with the trigger's ARIA, composed event
 * handlers, and ref merged in. Supply the child's element type via the generic
 * (e.g. `Popover.Trigger<HTMLAnchorElement>`).
 *
 * @example
 * ```tsx
 * <Popover.Trigger>Open</Popover.Trigger>
 *
 * <Popover.Trigger<HTMLAnchorElement> asChild>
 *   <a href="#panel">Open</a>
 * </Popover.Trigger>
 * ```
 */
export function PopoverTrigger<T extends HTMLElement = HTMLButtonElement>({
  children,
  asChild = false,
  ref,
  ...rest
}: PopoverTriggerProps<T>): ReactElement {
  const { triggerProps } = usePopoverTrigger({
    ref: ref as Ref<HTMLButtonElement>,
    asChild,
    ...rest,
  });

  if (asChild) {
    return <Slot {...triggerProps}>{children}</Slot>;
  }

  return (
    <button type="button" {...triggerProps}>
      {children}
    </button>
  );
}

/** @internal */
PopoverTrigger.displayName = "PopoverTrigger";

/**
 * The floating panel, rendered with the native HTML
 * [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
 * (`popover="auto"`) — no portal, no floating-ui. The browser manages the top
 * layer and light-dismiss (outside click / Escape); visual placement is your
 * CSS concern (use CSS anchor positioning against the trigger or
 * {@link PopoverAnchor | `Popover.Anchor`}).
 *
 * Renders a `<div role="dialog">`. On open, focus moves into the panel (first
 * focusable descendant, else the panel itself — it carries `tabIndex={-1}`).
 * `Escape` closes and returns focus to the trigger. `aria-labelledby` /
 * `aria-describedby` are wired automatically when `Popover.Title` /
 * `Popover.Description` are rendered inside.
 *
 * **`asChild` prop.** Pass `asChild` to render a consumer element (e.g. a
 * `<section>` or a motion wrapper) with the dialog props and internal ref
 * merged in. A consumer `ref` composes with the internal ref, so open state
 * keeps working.
 *
 * **Styling hook.** `data-state="open" | "closed"`.
 *
 * @example
 * ```tsx
 * <Popover.Content className="panel">
 *   <Popover.Title>Filters</Popover.Title>
 *   <Popover.Close>Done</Popover.Close>
 * </Popover.Content>
 * ```
 */
export function PopoverContent({
  children,
  onKeyDown,
  asChild = false,
  ref,
  ...rest
}: PopoverContentProps): ReactElement {
  const { contentProps } = usePopoverContent({
    onKeyDown,
    ref: ref as Ref<HTMLDivElement>,
  });

  if (asChild) {
    return (
      <Slot {...rest} {...contentProps}>
        {children}
      </Slot>
    );
  }

  return (
    <div {...rest} {...contentProps}>
      {children}
    </div>
  );
}

/** @internal */
PopoverContent.displayName = "PopoverContent";

/**
 * An optional positioning reference. By default the popover is positioned
 * against the trigger; render `Popover.Anchor` around (or in place of) another
 * element to anchor the panel there instead — useful when the trigger is a
 * small icon inside a larger control.
 *
 * Renders a `<div>`. Positioning is CSS-driven: attach a CSS `anchor-name` to
 * this element and a matching `position-anchor` to `Popover.Content`. Pass
 * `asChild` to project the anchor semantics onto an existing element.
 *
 * @example
 * ```tsx
 * <Popover.Anchor asChild>
 *   <div className="field" style={{ anchorName: "--popover" }}>
 *     <input />
 *     <Popover.Trigger>▾</Popover.Trigger>
 *   </div>
 * </Popover.Anchor>
 * ```
 */
export function PopoverAnchor({
  children,
  asChild = false,
  ...rest
}: PopoverAnchorProps): ReactElement {
  // Consume context so an Anchor rendered outside a Root throws, matching the
  // other sub-components. Positioning itself is a CSS (anchor-name) concern.
  usePopoverContext();

  if (asChild) {
    return <Slot {...rest}>{children}</Slot>;
  }

  return <div {...rest}>{children}</div>;
}

/** @internal */
PopoverAnchor.displayName = "PopoverAnchor";

/**
 * A button that closes the popover and returns focus to the trigger. Renders a
 * `<button type="button">` whose `onClick` composes with the close — consumer
 * handlers run first and can `event.preventDefault()` to veto closing.
 *
 * Pass `asChild` to render any element (e.g. a text link or your own icon
 * button) with the close behaviour merged in.
 *
 * @example
 * ```tsx
 * <Popover.Close>Done</Popover.Close>
 * ```
 */
export function PopoverClose({
  children,
  onClick,
  asChild = false,
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

  if (asChild) {
    return <Slot {...closeProps}>{children}</Slot>;
  }

  return (
    <button type="button" {...closeProps}>
      {children}
    </button>
  );
}

/** @internal */
PopoverClose.displayName = "PopoverClose";

/**
 * The popover's accessible name. Renders an `<h2>` by default and
 * auto-registers its generated id so `Popover.Content` wires it up as
 * `aria-labelledby`. Pass `asChild` to render your own heading element (e.g.
 * an `<h3>`); the id is still registered.
 *
 * @example
 * ```tsx
 * <Popover.Title>Filters</Popover.Title>
 * ```
 */
export function PopoverTitle({
  children,
  asChild = false,
  ...rest
}: PopoverTitleProps): ReactElement {
  const { registerTitle } = usePopoverContext();
  const id = useId();

  useEffect(() => {
    registerTitle(id);
    return () => registerTitle(undefined);
  }, [registerTitle, id]);

  if (asChild) {
    return (
      <Slot id={id} {...rest}>
        {children}
      </Slot>
    );
  }

  return (
    <h2 id={id} {...rest}>
      {children}
    </h2>
  );
}

/** @internal */
PopoverTitle.displayName = "PopoverTitle";

/**
 * The popover's accessible description. Renders a `<p>` by default and
 * auto-registers its generated id so `Popover.Content` wires it up as
 * `aria-describedby`. Pass `asChild` to render any element; the id is still
 * registered.
 *
 * @example
 * ```tsx
 * <Popover.Description>Narrow the results below.</Popover.Description>
 * ```
 */
export function PopoverDescription({
  children,
  asChild = false,
  ...rest
}: PopoverDescriptionProps): ReactElement {
  const { registerDescription } = usePopoverContext();
  const id = useId();

  useEffect(() => {
    registerDescription(id);
    return () => registerDescription(undefined);
  }, [registerDescription, id]);

  if (asChild) {
    return (
      <Slot id={id} {...rest}>
        {children}
      </Slot>
    );
  }

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
  /** An optional positioning reference used instead of the trigger. */
  Anchor: typeof PopoverAnchor;
  /** The floating panel. */
  Content: typeof PopoverContent;
  /** A button that closes the popover. */
  Close: typeof PopoverClose;
  /** The popover's accessible name; auto-wires `aria-labelledby`. */
  Title: typeof PopoverTitle;
  /** The popover's accessible description; auto-wires `aria-describedby`. */
  Description: typeof PopoverDescription;
};

/**
 * Headless, accessible **Popover** — a compound component built on the native
 * HTML Popover API (`popover="auto"`). A non-modal dialog anchored to a
 * trigger: the browser owns the top layer and light-dismiss, focus moves into
 * the panel on open and returns to the trigger on close, and the background
 * stays interactive (no focus trap — use `Modal` for that). Zero styles ship;
 * visual placement is your CSS concern (CSS anchor positioning).
 *
 * `Popover` is both callable (an alias of {@link PopoverRoot | `Popover.Root`})
 * and carries its sub-components as static properties.
 *
 * - {@link PopoverRoot | `Popover.Root`} — state owner and context provider.
 * - {@link PopoverTrigger | `Popover.Trigger`} — `<button>` that toggles the popover.
 * - {@link PopoverAnchor | `Popover.Anchor`} — optional positioning reference.
 * - {@link PopoverContent | `Popover.Content`} — the native-popover `role="dialog"` panel.
 * - {@link PopoverClose | `Popover.Close`} — `<button>` that closes the popover.
 * - {@link PopoverTitle | `Popover.Title`} — accessible name; auto-wires `aria-labelledby`.
 * - {@link PopoverDescription | `Popover.Description`} — auto-wires `aria-describedby`.
 *
 * @example Minimal usage
 * ```tsx
 * import { Popover } from "@primitiv-ui/react";
 *
 * <Popover.Root>
 *   <Popover.Trigger>Filters</Popover.Trigger>
 *   <Popover.Content>
 *     <Popover.Title>Filters</Popover.Title>
 *     <Popover.Description>Narrow the results.</Popover.Description>
 *     <Popover.Close>Done</Popover.Close>
 *   </Popover.Content>
 * </Popover.Root>;
 * ```
 *
 * @see {@link PopoverRoot} for the controlled/uncontrolled state modes.
 * @see {@link PopoverContent} for focus behaviour and ARIA auto-wiring.
 */
const PopoverCompound: PopoverCompound = Object.assign(PopoverRoot, {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Anchor: PopoverAnchor,
  Content: PopoverContent,
  Close: PopoverClose,
  Title: PopoverTitle,
  Description: PopoverDescription,
});

PopoverCompound.displayName = "Popover";

export { PopoverCompound as Popover };
