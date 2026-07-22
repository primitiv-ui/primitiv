/**
 * Slot — a React composition utility following the asChild pattern.
 *
 * When a component renders `<Slot {...ownProps}>{child}</Slot>`, the child
 * element is cloned with ownProps merged in:
 * - Event handlers are **composed** (child's handler runs first, then Slot's).
 * - `style` objects are shallow-merged (child wins on collisions).
 * - `className` strings are concatenated.
 * - All other props default to the child's value, with Slot providing the
 *   fallback when the child doesn't specify one.
 * - Refs from both sides are composed via {@link composeRefs}.
 *
 * This file is intentionally self-contained — no external dependencies
 * beyond React itself.
 */

import {
  forwardRef,
  isValidElement,
  cloneElement,
  Children,
  RefObject,
  type ForwardRefExoticComponent,
  type PropsWithoutRef,
  type RefAttributes,
} from "react";
import { SlotProps } from "./types";
import { AnyProps, PossibleRef } from "../types";

// ---------------------------------------------------------------------------
// composeRefs
// ---------------------------------------------------------------------------

function setRef<T>(ref: PossibleRef<T>, value: T) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref !== null && ref !== undefined) {
    (ref as RefObject<T>).current = value;
  }
}

/**
 * Combines multiple refs into a single callback ref that sets all of them
 * simultaneously. Handles function refs, object refs (`{ current }`), and
 * `undefined` — any of which may be mixed freely, in any order, and any
 * number of them.
 *
 * Used throughout the headless components whenever a sub-component owns an
 * internal ref (for measuring, focus management, roving-tabindex, etc.)
 * *and* needs to forward the consumer's own `ref` to the same DOM node —
 * two refs, one element, one callback ref that satisfies both. `Slot`
 * itself uses `composeRefs` internally to merge its `forwardedRef` with the
 * child element's own ref (see {@link Slot}).
 *
 * @example Compose an internal ref with a consumer-supplied external ref:
 * ```tsx
 * const internalRef = useRef<HTMLButtonElement>(null);
 * const composedRef = externalRef
 *   ? composeRefs(internalRef, externalRef)
 *   : internalRef;
 *
 * return <button ref={composedRef} />;
 * ```
 */
export function composeRefs<T>(...refs: PossibleRef<T>[]) {
  return (node: T) => refs.forEach((ref) => setRef(ref, node));
}

// ---------------------------------------------------------------------------
// mergeProps — follows the asChild composition pattern rules exactly
// ---------------------------------------------------------------------------

function getRef(element: React.ReactElement): PossibleRef<unknown> {
  // React 19 exposes ref via props; React ≤18 via element.ref
  const { props, ref } = element as React.ReactElement & {
    ref?: PossibleRef<unknown>;
  };
  // Stryker disable next-line ConditionalExpression: in React 19, element.ref
  // returns the same ref as props.ref for real elements, so preferring props.ref
  // vs. falling back to ref is indistinguishable at runtime — an equivalent
  // mutant. The ternary stays for the React <=18 shape, where the two differ.
  return (props as AnyProps).ref !== undefined
    ? ((props as AnyProps).ref as PossibleRef<unknown>)
    : ref;
}

function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  // Child props override by default; event handlers and style/className are
  // special-cased.
  const merged = { ...childProps };

  for (const key in childProps) {
    const slotVal = slotProps[key];
    const childVal = childProps[key];
    const isEventHandler = /^on[A-Z]/.test(key);

    if (isEventHandler) {
      if (slotVal && childVal) {
        // Both sides provide a handler — compose: child first, then slot.
        merged[key] = (...args: unknown[]) => {
          (childVal as (...a: unknown[]) => unknown)(...args);
          (slotVal as (...a: unknown[]) => unknown)(...args);
        };
      } else if (slotVal) {
        merged[key] = slotVal;
      }
    } else if (key === "style") {
      merged[key] = { ...(slotVal as object), ...(childVal as object) };
    } else if (key === "className") {
      merged[key] = [slotVal, childVal].filter(Boolean).join(" ");
    }
  }

  return { ...slotProps, ...merged };
}

// ---------------------------------------------------------------------------
// Slot component
// ---------------------------------------------------------------------------

/**
 * Renders its single child element with the Slot's own props merged in.
 *
 * `Slot` is the composition primitive behind every `asChild` prop in this
 * library (`Button`, `Tabs.Trigger`, `Select.Root`, `Breadcrumb.Link`, and
 * more). A component that normally renders its own DOM element (say,
 * `<button>`) can instead delegate rendering to a single consumer-supplied
 * element — typically a routing library's `<Link>` or a custom styled
 * element — while preserving all of its own behaviour: ARIA attributes,
 * data attributes, event handlers, and `ref` all still land on the
 * rendered DOM node, just not the node `Slot` itself would have created.
 * The pattern avoids an extra wrapper element in the DOM, which matters for
 * layout (no unwanted `<button><a>…</a></button>` nesting) and for CSS
 * selectors that expect a single element.
 *
 * **Usage shape** — every component using `Slot` follows the same
 * branch:
 *
 * ```tsx
 * if (asChild) {
 *   return <Slot {...ownProps}>{children}</Slot>;
 * }
 * return <button {...ownProps}>{children}</button>;
 * ```
 *
 * `ownProps` is the exact same object passed to both branches — `Slot`'s
 * job is only to change *where* those props land, never to change what
 * they are.
 *
 * **Prop-merging rules** (`Slot`'s own props are the "slot" side, the
 * single child's own props are the "child" side):
 * - **Event handlers** (any prop matching `/^on[A-Z]/`) compose — the
 *   **child's** handler fires first, then the **slot's**. This is the
 *   opposite composition direction, and a different merge strategy, from
 *   the standalone {@link composeEventHandlers} helper (their-handler-first
 *   with a `preventDefault()` veto) — the two are unrelated mechanisms
 *   that happen to solve adjacent problems. `Slot`'s handlers always both
 *   run; there is no opt-out.
 * - **`style`** is shallow-merged — the child's style object wins on key
 *   collisions, so a consumer's inline `style` can override individual
 *   properties Slot would otherwise set.
 * - **`className`** strings are concatenated (`"slotClass childClass"`),
 *   so both the component's own class hooks and the consumer's class
 *   survive.
 * - **All other props** default to the child's value; Slot's value is only
 *   used as a fallback when the child doesn't specify that prop at all
 *   (key absent, or explicitly `undefined`).
 * - **Refs** from both sides are composed via {@link composeRefs}, so
 *   neither the component's internal ref nor the consumer's own ref on the
 *   child element is lost.
 *
 * **Constraints.** Exactly one React element child is required — `Slot`
 * throws `"Slot requires exactly one React element child."` for zero
 * children or a non-element child (e.g. a plain string). The child must
 * also accept a `ref` (a DOM element or a `forwardRef` component); passing
 * a plain function component as the child silently drops the ref.
 *
 * **React version compatibility.** Slot reads the child's own ref from
 * `element.props.ref` (React 19+) with a fallback to `element.ref`
 * (React ≤18) so both runtime versions compose refs correctly.
 *
 * @extends HTMLElement
 *
 * @example Basic `asChild` branch inside a component
 * ```tsx
 * // Inside a component that normally renders <button>:
 * if (asChild) {
 *   return <Slot {...buttonProps}>{children}</Slot>;
 * }
 * return <button {...buttonProps}>{children}</button>;
 * ```
 *
 * @example Consumer rendering a router link in place of the default element
 * ```tsx
 * <Button asChild onClick={trackClick}>
 *   <RouterLink to="/settings" className="settings-link">
 *     Settings
 *   </RouterLink>
 * </Button>
 * // Rendered DOM: a single <a class="…settings-link"> — trackClick and the
 * // link's own onClick both fire; no wrapping <button>.
 * ```
 */
export const Slot: ForwardRefExoticComponent<
  PropsWithoutRef<SlotProps> & RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, SlotProps>(
  ({ children, ...slotProps }, forwardedRef) => {
    // Stryker disable next-line ConditionalExpression: forcing this guard false
    // lets invalid children fall through to a *different* throw (the destructure
    // in getRef below), which the error tests do catch — but Stryker's vitest
    // runner does not attribute that React render-time throw to a covering test
    // (the same limitation seen on Avatar's ref guard). The operator/block twins
    // of this line are scored; only this variant can't be. Not equivalent.
    if (Children.count(children) !== 1 || !isValidElement(children)) {
      throw new Error("Slot requires exactly one React element child.");
    }

    const childRef = getRef(children);
    const composedRef = forwardedRef
      ? composeRefs(forwardedRef, childRef)
      : childRef;

    return cloneElement(children, {
      ...mergeProps(slotProps as AnyProps, children.props as AnyProps),
      ref: composedRef,
    } as AnyProps);
  },
);

Slot.displayName = "Slot";
