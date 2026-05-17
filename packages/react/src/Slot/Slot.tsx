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
 * `undefined` — any of which may be mixed freely.
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
 * Used to implement the `asChild` pattern: a component that normally renders
 * its own DOM element can instead delegate to a consumer-supplied element
 * while preserving all of its own behaviour (ARIA attributes, event handlers,
 * `ref`, etc.).
 *
 * **Prop-merging rules**:
 * - **Event handlers** compose — child's handler fires first, then Slot's.
 * - **`style`** is shallow-merged — child wins on key collisions.
 * - **`className`** strings are concatenated (`slotClass childClass`).
 * - **All other props** default to the child's value; Slot provides the
 *   fallback when the child doesn't specify one.
 * - **Refs** from both sides are composed via {@link composeRefs}.
 *
 * **Constraints**
 * - Exactly one React element child is required; Slot throws otherwise.
 * - The child must accept a `ref` (i.e. a DOM element or a `forwardRef`
 *   component).
 *
 * **React version compatibility.** Slot reads the child's ref from
 * `element.props.ref` (React 19+) with a fallback to `element.ref`
 * (React ≤18) so both runtime versions compose refs correctly.
 *
 * @example
 * ```tsx
 * // Inside a component that normally renders <button>:
 * if (asChild) {
 *   return <Slot {...buttonProps}>{children}</Slot>;
 * }
 * return <button {...buttonProps}>{children}</button>;
 * ```
 */
export const Slot = forwardRef<HTMLElement, SlotProps>(
  ({ children, ...slotProps }, forwardedRef) => {
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
