import type { ReactElement } from "react";

import { Slot } from "../Slot/index.ts";
import { StatusProps } from "./types";

/**
 * A polite live region for low-priority, non-urgent status messages,
 * implementing the WAI-ARIA `status` role.
 *
 * Renders a `<div role="status">`. The `status` role carries an implicit
 * `aria-live="polite"` and `aria-atomic="true"`, so assistive technology
 * announces the message once the user is idle, without interrupting
 * them — use it for confirmations, counts, and background progress. For
 * errors the user must see immediately, reach for `Alert` instead.
 *
 * **Live region timing.** A live region only announces content that
 * changes *after* the region is already in the DOM. Either render
 * `Status` conditionally (mount when a message is ready), or keep it
 * mounted and update its text:
 *
 * ```tsx
 * // Conditional mount — announces on first appearance
 * {saved && <Status>All changes saved.</Status>}
 *
 * // Persistent — announces on every content change
 * <Status>{count} items in your cart</Status>
 * ```
 *
 * **`asChild` composition.** Pass `asChild` to render the consumer's own
 * element instead of a `<div>`, merging `role="status"` and all other
 * props onto it via the {@link Slot} utility. Event handlers compose with
 * the child's own handlers (child runs first).
 *
 * @extends HTMLDivElement
 *
 * @example Confirmation message
 * ```tsx
 * import { Status } from "@primitiv-ui/react";
 *
 * function SaveIndicator({ saved }: { saved: boolean }) {
 *   return saved ? <Status>All changes saved.</Status> : null;
 * }
 * ```
 *
 * @example Cart count — persistent live region
 * ```tsx
 * <Status>{count} items in your cart</Status>
 * ```
 *
 * @example asChild — apply the status role to a semantic element
 * ```tsx
 * <Status asChild>
 *   <output>{count} items in your cart</output>
 * </Status>
 * ```
 */
export function Status({
  asChild = false,
  children,
  ...rest
}: StatusProps): ReactElement {
  const rootProps = { role: "status", ...rest };

  if (asChild) {
    return <Slot {...rootProps}>{children}</Slot>;
  }

  return <div {...rootProps}>{children}</div>;
}

/** @internal */
Status.displayName = "Status";
