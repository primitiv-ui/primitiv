import { Ref } from "react";
import type { ReactElement } from "react";

import { Slot } from "../Slot/index.ts";

import {
  CollapsibleContext,
  useCollapsibleContext,
} from "./CollapsibleContext";
import { useCollapsibleRoot, useCollapsibleTrigger } from "./hooks/index.ts";

import type {
  CollapsibleRootProps,
  CollapsibleTriggerProps,
  CollapsibleContentProps,
  CollapsibleTriggerIconProps,
} from "./types";

/**
 * The root of a Collapsible widget — owns the open/closed state, provides
 * context to descendants, and renders a plain `<div>`.
 *
 * Supports two state modes, statically discriminated at the type level:
 *
 * - **Uncontrolled** — pass `defaultOpen` (or omit it to start closed).
 *   The component owns and updates the open state internally; consumers
 *   may still observe transitions by passing `onOpenChange`.
 * - **Controlled** — pass `open` *and* `onOpenChange` together. The parent
 *   owns the open value; the component defers every state change back
 *   through the callback. Passing `defaultOpen` alongside `open` is a type
 *   error.
 *
 * Unlike Accordion in this library, Collapsible fires `onOpenChange` in
 * **both** uncontrolled and controlled modes.
 *
 * **Disabled.** Pass `disabled` to render `aria-disabled="true"` on the
 * Trigger and short-circuit click and keyboard activation. The Trigger
 * remains focusable so keyboard users can discover it. `data-disabled` is
 * mirrored onto Root, Trigger, and Content so a single selector covers
 * every sub-component.
 *
 * **Context.** Root establishes {@link CollapsibleContext}, from which
 * {@link CollapsibleTrigger}, {@link CollapsibleContent}, and
 * {@link CollapsibleTriggerIcon} read the open state, the `disabled` flag,
 * the `toggle` action, and the generated `triggerId` / `contentId` that
 * wire the Trigger's `aria-controls` to the Content's `id`. Rendering any
 * sub-component outside a Root throws.
 *
 * **Styling hooks.** `data-state="open" | "closed"` and
 * `data-disabled="true" | "false"` are emitted on the rendered container.
 *
 * @extends HTMLDivElement
 *
 * @example Uncontrolled
 * ```tsx
 * <Collapsible.Root defaultOpen>
 *   <Collapsible.Trigger>Toggle</Collapsible.Trigger>
 *   <Collapsible.Content>Hidden content</Collapsible.Content>
 * </Collapsible.Root>
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <Collapsible.Root open={open} onOpenChange={setOpen}>
 *   <Collapsible.Trigger>Toggle</Collapsible.Trigger>
 *   <Collapsible.Content>Hidden content</Collapsible.Content>
 * </Collapsible.Root>
 * ```
 */
export function CollapsibleRoot({
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  disabled = false,
  ...rest
}: CollapsibleRootProps): ReactElement {
  const { contextValue } = useCollapsibleRoot(
    controlledOpen,
    defaultOpen,
    onOpenChange,
    disabled,
  );

  return (
    <CollapsibleContext.Provider value={contextValue}>
      <div
        data-state={contextValue.open ? "open" : "closed"}
        data-disabled={disabled}
        {...rest}
      >
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}

/** @internal */
// Stryker disable next-line StringLiteral: overwritten by the compound alias — an equivalent mutant.
CollapsibleRoot.displayName = "CollapsibleRoot";

/**
 * The button that toggles the collapsible open or closed. Renders
 * `<button type="button">` by default and wires up all required ARIA
 * attributes, click handling, and keyboard activation automatically.
 *
 * **Disabled behaviour.** When the parent `Collapsible.Root` is `disabled`
 * the Trigger is rendered with `aria-disabled="true"` and
 * `data-disabled="true"` instead of the native HTML `disabled` attribute.
 * This keeps the button focusable so keyboard users can discover it,
 * while preventing toggle activation. Click handlers and keyboard
 * activation are short-circuited entirely — no toggle, no consumer
 * `onClick`.
 *
 * **`asChild` prop.** Pass `asChild` to render an arbitrary child element
 * instead of the default `<button>`. All ARIA attributes, event handlers,
 * and the internal ref are merged onto the child following the standard
 * composition rules:
 * - Event handlers compose — child's handler runs first, then the trigger's.
 * - `style` is shallow-merged (child wins on collisions).
 * - `className` strings are concatenated.
 * - Refs from both sides are composed via `composeRefs`.
 *
 * When `asChild` is `true` and the parent is `disabled`, `role="button"`
 * is automatically injected so that `aria-disabled` is semantically valid
 * on non-button elements (e.g. `<a>`, `<div>`). Without a button role the
 * `aria-disabled` attribute has no defined meaning in the ARIA spec.
 *
 * **Keyboard activation.** Native `<button>` activates on `Enter` and
 * `Space` for free. Under `asChild`, the rendered element may not (e.g.
 * `<div role="button">`), so the Trigger handles `Enter` and `Space`
 * explicitly: `preventDefault` suppresses any native activation (such as
 * an anchor following its `href`) and the toggle is dispatched directly.
 *
 * **Ref forwarding.** A `ref` prop (React 19 ref-as-prop style) is
 * forwarded to the underlying DOM element — useful for imperative focus
 * management. The generic defaults to `HTMLButtonElement`; supply a
 * different type when using `asChild` with a non-button element.
 *
 * **Styling hooks.**
 * - `data-state="open" | "closed"` on the rendered element.
 * - `data-disabled="true" | "false"`.
 *
 * @extends HTMLButtonElement
 *
 * @example Basic
 * ```tsx
 * <Collapsible.Trigger>Toggle</Collapsible.Trigger>
 * ```
 *
 * @example asChild — render an anchor with collapsible semantics
 * ```tsx
 * <Collapsible.Trigger<HTMLAnchorElement> asChild>
 *   <a href="#section">Toggle</a>
 * </Collapsible.Trigger>
 * ```
 */
export function CollapsibleTrigger<T extends HTMLElement = HTMLButtonElement>({
  ref,
  children,
  onClick,
  onKeyDown,
  asChild = false,
  ...rest
}: CollapsibleTriggerProps<T>): ReactElement {
  const { triggerProps } = useCollapsibleTrigger({
    ref: ref as Ref<HTMLButtonElement>,
    onClick,
    onKeyDown,
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
CollapsibleTrigger.displayName = "CollapsibleTrigger";

/**
 * The panel that is revealed when the associated `Collapsible.Trigger` is
 * activated. Renders a `<div>` whose visibility is controlled by the
 * `hidden` attribute and whose `id` is automatically wired to the
 * Trigger's `aria-controls`.
 *
 * **`forceMount` prop.** By default the panel is removed from the visual
 * and accessibility trees with `hidden` when closed. Pass `forceMount` to
 * keep the panel in the DOM at all times so consumers can drive open /
 * close transitions with CSS — for instance with CSS Grid:
 *
 * ```css
 * .panel {
 *   display: grid;
 *   grid-template-rows: 0fr;
 *   transition: grid-template-rows 250ms;
 * }
 * .panel[data-state="open"] {
 *   grid-template-rows: 1fr;
 * }
 * .panel > * {
 *   overflow: hidden;
 * }
 * ```
 *
 * When `forceMount` is `true` and the panel is closed, `aria-hidden="true"`
 * is set automatically so assistive technology ignores the off-screen
 * content. It is removed when the panel opens. Consumers can override
 * this by passing `aria-hidden` explicitly (it appears after the
 * automatic value in the spread).
 *
 * **Styling hooks.**
 * - `data-state="open" | "closed"` on the rendered element.
 * - `data-disabled="true" | "false"`.
 *
 * @extends HTMLDivElement
 *
 * @example Default (hidden attribute)
 * ```tsx
 * <Collapsible.Content>Hidden content</Collapsible.Content>
 * ```
 *
 * @example With forceMount for CSS-driven animation
 * ```tsx
 * <Collapsible.Content forceMount className="panel">
 *   Content that animates open and closed.
 * </Collapsible.Content>
 * ```
 */
export function CollapsibleContent({
  children,
  forceMount = false,
  ...rest
}: CollapsibleContentProps): ReactElement {
  const { open, disabled, contentId } = useCollapsibleContext();

  return (
    <div
      id={contentId}
      hidden={forceMount ? undefined : !open}
      aria-hidden={forceMount && !open ? true : undefined}
      data-state={open ? "open" : "closed"}
      data-disabled={disabled}
      {...rest}
    >
      {children}
    </div>
  );
}

/** @internal */
CollapsibleContent.displayName = "CollapsibleContent";

/**
 * A wrapper that hides its icon child from the accessibility tree and
 * provides a `data-state` hook for open/close animations. Accepts any
 * renderable React content as a child — an inline `<svg>`, a component
 * from a third-party icon library (lucide-react, react-icons, etc.), or
 * any custom icon component.
 *
 * Renders a `<span>` with `aria-hidden="true"` around the child so the
 * icon is hidden from assistive technology regardless of whether the
 * child component forwards unknown props or emits its own ARIA surface.
 *
 * **Styling hooks.**
 * - `data-state="open" | "closed"` on the rendered `<span>`.
 * - `aria-hidden="true"` on the rendered `<span>`.
 *
 * @extends HTMLSpanElement
 *
 * @example Inline SVG
 * ```tsx
 * <Collapsible.Trigger>
 *   Toggle
 *   <Collapsible.TriggerIcon>
 *     <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
 *   </Collapsible.TriggerIcon>
 * </Collapsible.Trigger>
 * ```
 *
 * @example Third-party icon component
 * ```tsx
 * import { ChevronDown } from "lucide-react";
 *
 * <Collapsible.Trigger>
 *   Toggle
 *   <Collapsible.TriggerIcon>
 *     <ChevronDown />
 *   </Collapsible.TriggerIcon>
 * </Collapsible.Trigger>
 * ```
 */
export function CollapsibleTriggerIcon({
  children,
  ...rest
}: CollapsibleTriggerIconProps): ReactElement {
  const { open } = useCollapsibleContext();

  return (
    <span aria-hidden="true" data-state={open ? "open" : "closed"} {...rest}>
      {children}
    </span>
  );
}

/** @internal */
CollapsibleTriggerIcon.displayName = "CollapsibleTriggerIcon";

/** Type of the {@link Collapsible} compound — the Root callable plus its sub-components. */
type CollapsibleCompound = typeof CollapsibleRoot & {
  /** The root, owning open/closed state and context. */
  Root: typeof CollapsibleRoot;
  /** The button that toggles the panel. */
  Trigger: typeof CollapsibleTrigger;
  /** The collapsible panel. */
  Content: typeof CollapsibleContent;
  /** An aria-hidden icon wrapper with an open/closed `data-state` hook. */
  TriggerIcon: typeof CollapsibleTriggerIcon;
};

/**
 * Collapsible — a single disclosure widget pairing a trigger with a panel
 * that expands and collapses. Use as a namespace (`Collapsible.Root`,
 * `Collapsible.Trigger`, `Collapsible.Content`, `Collapsible.TriggerIcon`);
 * the default export is also callable as the Root.
 */
const CollapsibleCompound: CollapsibleCompound = Object.assign(
  CollapsibleRoot,
  {
    Root: CollapsibleRoot,
    Trigger: CollapsibleTrigger,
    Content: CollapsibleContent,
    TriggerIcon: CollapsibleTriggerIcon,
  },
);

CollapsibleCompound.displayName = "Collapsible";

export { CollapsibleCompound as Collapsible };
