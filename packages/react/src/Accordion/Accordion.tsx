import { Ref, useEffect } from "react";
import type { ReactElement } from "react";

import { useDirection } from "../DirectionProvider/index.ts";
import { Slot } from "../Slot/index.ts";

import type {
  AccordionRootProps,
  AccordionItemProps,
  AccordionTriggerProps,
  AccordionHeaderProps,
  AccordionContentProps,
  AccordionTriggerIconProps,
} from "./types";

import type { HeadingTag } from "../types";

import { AccordionContext, AccordionItemContext } from "./AccordionContext";
import {
  useAccordionContext,
  useAccordionHeaderContext,
  useAccordionItem,
  useAccordionItemContext,
  useAccordionRoot,
} from "./hooks/index.ts";
import { useAccordionTrigger } from "./hooks/useAccordionTrigger";

/**
 * The root of an Accordion widget — owns the expanded-items state, provides
 * context to descendants, and renders a plain `<div>`.
 *
 * Supports two state modes, statically discriminated at the type level:
 *
 * - **Uncontrolled** — pass {@link AccordionRootUncontrolledProps.defaultValue | `defaultValue`}
 *   (or omit it to start with all items collapsed). The component owns and
 *   updates the expanded set internally.
 * - **Controlled** — pass {@link AccordionRootControlledProps.value | `value`} *and*
 *   {@link AccordionRootControlledProps.onValueChange | `onValueChange`} together.
 *   The parent owns the expanded set; the component defers every state change
 *   back through the callback.
 *
 * In both modes, `multiple` controls whether more than one item can be open
 * simultaneously. By default only one item can be expanded at a time — opening
 * a new item collapses the previous one.
 *
 * **Styling hooks.** `data-orientation="vertical" | "horizontal"` is set on
 * the rendered container. No `aria-orientation` is emitted because it is not
 * valid on a `<div>` according to the WAI-ARIA spec.
 *
 * **Reading direction.** `dir` (`"ltr"` / `"rtl"`) sets the arrow-key
 * direction for horizontal accordions and the container's `dir` attribute.
 * When omitted, it is inherited from the nearest {@link DirectionProvider},
 * falling back to `"ltr"` when there is no provider.
 *
 * @extends HTMLDivElement
 *
 * @example Uncontrolled — single open item
 * ```tsx
 * <Accordion.Root defaultValue="item-1">
 *   <Accordion.Item value="item-1">…</Accordion.Item>
 *   <Accordion.Item value="item-2">…</Accordion.Item>
 * </Accordion.Root>
 * ```
 *
 * @example Controlled — multiple open items
 * ```tsx
 * const [expanded, setExpanded] = useState<string[]>([]);
 *
 * <Accordion.Root multiple value={expanded} onValueChange={setExpanded}>
 *   <Accordion.Item value="shipping">…</Accordion.Item>
 *   <Accordion.Item value="returns">…</Accordion.Item>
 * </Accordion.Root>
 * ```
 */
export function AccordionRoot({
  children,
  multiple = false,
  defaultValue,
  value: controlledValue,
  onValueChange,
  orientation = "vertical",
  dir,
  ...rest
}: AccordionRootProps): ReactElement {
  const resolvedDir = dir ?? useDirection();
  const { contextValue } = useAccordionRoot(
    controlledValue,
    defaultValue,
    multiple,
    onValueChange,
    orientation,
    resolvedDir,
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <div data-orientation={orientation} dir={resolvedDir} {...rest}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

/** @internal */
// Stryker disable next-line StringLiteral: overwritten by the compound alias — an equivalent mutant.
AccordionRoot.displayName = "AccordionRoot";

/**
 * A single collapsible section within an accordion. Wraps one
 * `Accordion.Header` + `Accordion.Content` pair and tracks their shared
 * expanded / collapsed state via context.
 *
 * The {@link AccordionItemProps.value | `value`} prop is the stable identifier
 * used to match this item against the root's expanded set. If omitted, a
 * stable auto-generated ID is used via `useId()` — useful for fully anonymous
 * items where the consumer doesn't need to drive state from outside.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <Accordion.Item value="shipping">
 *   <Accordion.Header>
 *     <Accordion.Trigger>Shipping</Accordion.Trigger>
 *   </Accordion.Header>
 *   <Accordion.Content>Free on orders over £50.</Accordion.Content>
 * </Accordion.Item>
 * ```
 */
export function AccordionItem({
  children,
  value,
  ...rest
}: AccordionItemProps): ReactElement {
  const { contextValue } = useAccordionItem(value);

  return (
    <AccordionItemContext.Provider value={contextValue}>
      <div {...rest}>{children}</div>
    </AccordionItemContext.Provider>
  );
}

/** @internal */
AccordionItem.displayName = "AccordionItem";

/**
 * Renders the heading element that wraps an `Accordion.Trigger`. Defaults to
 * `<h3>` but the level is configurable via the
 * {@link AccordionHeaderProps.level | `level`} prop so the heading hierarchy
 * of the surrounding page is preserved.
 *
 * The WAI-ARIA Accordion pattern requires each trigger to be wrapped in a
 * heading at the appropriate level for its position in the document outline.
 *
 * @extends HTMLHeadingElement
 *
 * @example
 * ```tsx
 * <Accordion.Header level={2}>
 *   <Accordion.Trigger>Shipping policy</Accordion.Trigger>
 * </Accordion.Header>
 * ```
 */
export function AccordionHeader({
  children,
  level = 3,
  ...rest
}: AccordionHeaderProps): ReactElement {
  useAccordionHeaderContext();
  const HeadingTag: HeadingTag = `h${level}`;

  return <HeadingTag {...rest}>{children}</HeadingTag>;
}

/** @internal */
AccordionHeader.displayName = "AccordionHeader";

/**
 * The button that toggles an accordion item open or closed. Renders
 * `<button type="button">` by default and wires up all required ARIA
 * attributes, click handling, and keyboard navigation automatically.
 *
 * **Disabled behaviour.** When `disabled` is `true` the trigger is rendered
 * with `aria-disabled="true"` and `data-disabled="true"` instead of the
 * native HTML `disabled` attribute. This keeps the button focusable so
 * keyboard users can discover it, while preventing activation.  Disabled
 * triggers are excluded from arrow-key navigation.
 *
 * **`asChild` prop.** Pass `asChild` to render an arbitrary child element
 * instead of the default `<button>`. All accordion ARIA attributes, event
 * handlers, and the internal ref are merged onto the child following the
 * Composition pattern:
 * - Event handlers compose — the child's handler runs first, then the trigger's.
 * - `style` is shallow-merged (child wins on collisions).
 * - `className` strings are concatenated.
 * - Refs from both sides are composed via `composeRefs`.
 *
 * When `asChild` is `true` and `disabled` is `true`, `role="button"` is
 * automatically injected so that `aria-disabled` is semantically valid on
 * non-button elements (e.g. `<a>`, `<div>`). Without a button role the
 * `aria-disabled` attribute has no defined meaning in the ARIA spec.
 *
 * **Keyboard support** (WAI-ARIA Accordion pattern):
 *
 * | Key               | Behaviour                                    |
 * | ----------------- | -------------------------------------------- |
 * | `Enter` / `Space` | Toggle the focused item                      |
 * | `ArrowDown`       | Move focus to next trigger (vertical)        |
 * | `ArrowUp`         | Move focus to previous trigger (vertical)    |
 * | `ArrowRight`      | Move focus to next trigger (horizontal)      |
 * | `ArrowLeft`       | Move focus to previous trigger (horizontal)  |
 * | `Home`            | Move focus to first enabled trigger          |
 * | `End`             | Move focus to last enabled trigger           |
 *
 * Movement **wraps** at the ends. For horizontal orientation with
 * `dir="rtl"`, `ArrowLeft` moves forward and `ArrowRight` moves backward.
 *
 * **Ref forwarding.** A `ref` prop (React 19 ref-as-prop style) is forwarded
 * to the underlying DOM element — useful for imperative focus management.
 *
 * **Styling hooks.**
 * - `data-state="open" | "closed"` on the rendered element.
 * - `data-disabled="true" | "false"`.
 *
 * @extends HTMLButtonElement
 *
 * @example Basic
 * ```tsx
 * <Accordion.Trigger>Shipping policy</Accordion.Trigger>
 * ```
 *
 * @example Disabled
 * ```tsx
 * <Accordion.Trigger disabled>Unavailable section</Accordion.Trigger>
 * ```
 *
 * @example asChild — render a link with accordion semantics
 * ```tsx
 * <Accordion.Trigger asChild>
 *   <a href="#shipping">Shipping policy</a>
 * </Accordion.Trigger>
 * ```
 */
export function AccordionTrigger<T extends HTMLElement = HTMLButtonElement>({
  ref,
  children,
  onClick,
  disabled = false,
  asChild = false,
  ...rest
}: AccordionTriggerProps<T>): ReactElement {
  // Cast the external ref to match the internal button ref's element type —
  // RefObject<T> is invariant in React's types, but at runtime the callback
  // receives whatever DOM element is actually rendered (button or asChild).
  const { triggerProps } = useAccordionTrigger({
    ref: ref as Ref<HTMLButtonElement>,
    onClick,
    disabled,
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
AccordionTrigger.displayName = "AccordionTrigger";

/**
 * The panel that is revealed when the associated `Accordion.Trigger` is
 * activated. Renders a `<div role="region" aria-labelledby="…">` whose
 * visibility is controlled by the `hidden` attribute.
 *
 * **`forceMount` prop.** By default the panel is removed from visibility with
 * `hidden` when closed. Pass `forceMount` to keep the panel in the DOM at all
 * times. In `forceMount` mode the `hidden` attribute is never set, so
 * CSS transitions on open / close work correctly — consumers can use
 * `[data-state="closed"] { display: none; }` (or equivalent animation
 * classes) to control visibility themselves.
 *
 * When `forceMount` is `true` and the panel is closed, `aria-hidden="true"` is
 * set automatically so assistive technology ignores the off-screen content.
 * It is removed when the panel opens. Consumers can override this by passing
 * `aria-hidden` explicitly (it appears after the automatic value in the spread).
 *
 * **`role="region"` escape hatch.** Each panel renders with `role="region"` by
 * default, creating an ARIA landmark. Accordions with many items can produce
 * landmark overload in screen readers. Opt out by passing `role={undefined}`:
 * ```tsx
 * <Accordion.Content role={undefined}>…</Accordion.Content>
 * ```
 *
 * **Styling hooks.**
 * - `data-state="open" | "closed"` on the rendered element.
 *
 * @extends HTMLDivElement
 *
 * @example Default (hidden attribute)
 * ```tsx
 * <Accordion.Content>Free shipping on orders over £50.</Accordion.Content>
 * ```
 *
 * @example With forceMount for CSS animations
 * ```tsx
 * <Accordion.Content forceMount className="panel">
 *   Content that animates in and out.
 * </Accordion.Content>
 * ```
 */
export function AccordionContent({
  children,
  forceMount = false,
  ...rest
}: AccordionContentProps): ReactElement {
  const { panelId, buttonId, itemId, isExpanded } = useAccordionItemContext();
  const { registerPanel, unregisterPanel } = useAccordionContext();

  useEffect(
    () => {
      registerPanel(itemId);
      return () => unregisterPanel(itemId);
    },
    // `registerPanel`/`unregisterPanel` are stable, and `itemId` is effectively
    // immutable: changing an item's value produces a phantom-key validation
    // throw (the collection keeps unmounted keys), so it is never a supported
    // runtime transition. Emptying the deps is therefore equivalent.
    // Stryker disable next-line ArrayDeclaration: equivalent — stable/immutable dependencies.
    [itemId, registerPanel, unregisterPanel],
  );

  return (
    <div
      id={panelId}
      aria-labelledby={buttonId}
      role="region"
      hidden={forceMount ? undefined : !isExpanded}
      aria-hidden={forceMount && !isExpanded ? true : undefined}
      data-state={isExpanded ? "open" : "closed"}
      {...rest}
    >
      {children}
    </div>
  );
}

/** @internal */
AccordionContent.displayName = "AccordionContent";

/**
 * A wrapper that hides its icon child from the accessibility tree and
 * provides a `data-state` hook for open/close animations. Accepts any
 * renderable React content as a child — an inline `<svg>`, a component
 * from a third-party icon library (lucide-react, react-icons, etc.), or
 * any custom icon component.
 *
 * Renders a `<span>` with `aria-hidden="true"` around the child so the
 * icon is hidden from assistive technology regardless of whether the child
 * component forwards unknown props. Any additional props (`className`,
 * `data-*`, `ref`, etc.) are forwarded to that `<span>`.
 *
 * **Styling hooks.**
 * - `data-state="open" | "closed"` on the rendered `<span>`.
 * - `aria-hidden="true"` on the rendered `<span>`.
 *
 * @extends HTMLSpanElement
 *
 * @example Inline SVG
 * ```tsx
 * <Accordion.Trigger>
 *   Shipping policy
 *   <Accordion.TriggerIcon>
 *     <svg …><path d="…" /></svg>
 *   </Accordion.TriggerIcon>
 * </Accordion.Trigger>
 * ```
 *
 * @example Third-party icon component
 * ```tsx
 * import { ChevronDown } from "lucide-react";
 *
 * <Accordion.Trigger>
 *   Shipping policy
 *   <Accordion.TriggerIcon>
 *     <ChevronDown />
 *   </Accordion.TriggerIcon>
 * </Accordion.Trigger>
 * ```
 */
export function AccordionTriggerIcon({
  children,
  ...rest
}: AccordionTriggerIconProps): ReactElement {
  const { isExpanded } = useAccordionItemContext();

  return (
    <span
      {...rest}
      aria-hidden="true"
      data-state={isExpanded ? "open" : "closed"}
    >
      {children}
    </span>
  );
}

/** @internal */
AccordionTriggerIcon.displayName = "AccordionTriggerIcon";

/** @internal */
type AccordionCompound = typeof AccordionRoot & {
  Root: typeof AccordionRoot;
  Item: typeof AccordionItem;
  Header: typeof AccordionHeader;
  Trigger: typeof AccordionTrigger;
  Content: typeof AccordionContent;
  TriggerIcon: typeof AccordionTriggerIcon;
};

/**
 * Headless, accessible **Accordion** — a compound component for a vertically
 * (or horizontally) stacked set of collapsible sections, following the
 * [WAI-ARIA Accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)
 * with zero styles.
 *
 * `Accordion` is both callable (an alias of {@link AccordionRoot | `Accordion.Root`})
 * and carries its sub-components as static properties:
 *
 * - {@link AccordionRoot | `Accordion.Root`} — state owner and context provider.
 * - {@link AccordionItem | `Accordion.Item`} — one collapsible section.
 * - {@link AccordionHeader | `Accordion.Header`} — heading wrapper for the trigger.
 * - {@link AccordionTrigger | `Accordion.Trigger`} — button that toggles the section.
 * - {@link AccordionContent | `Accordion.Content`} — the collapsible panel.
 * - {@link AccordionTriggerIcon | `Accordion.TriggerIcon`} — decorative state indicator.
 */
const AccordionCompound: AccordionCompound = Object.assign(AccordionRoot, {
  Root: AccordionRoot,
  Item: AccordionItem,
  Header: AccordionHeader,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
  TriggerIcon: AccordionTriggerIcon,
});

AccordionCompound.displayName = "Accordion";

export { AccordionCompound as Accordion };
