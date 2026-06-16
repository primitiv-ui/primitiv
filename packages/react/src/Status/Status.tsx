import type { ReactElement } from "react";

import { Slot } from "../Slot/index.ts";
import { StatusProps } from "./types";

/**
 * A polite live region for low-priority, non-urgent status messages.
 *
 * Renders a `<div role="status">`. The `status` role carries an
 * implicit `aria-live="polite"` and `aria-atomic="true"`, so assistive
 * technology announces the message once the user is idle, without
 * interrupting them — use it for confirmations, counts, and background
 * progress. For errors the user must see immediately, reach for
 * `Alert` instead.
 *
 * Render the `Status` conditionally, or update its text content while
 * it stays mounted: the live region announces content that changes
 * *after* it is already in the DOM.
 *
 * **`asChild` composition.** Renders the consumer's element instead of
 * a `<div>`, merging `role="status"` and all other props in via the
 * {@link Slot} utility.
 *
 * @example Confirmation message
 * ```tsx
 * {saved && <Status>All changes saved.</Status>}
 * ```
 *
 * @example asChild — keep semantic markup
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

Status.displayName = "Status";
