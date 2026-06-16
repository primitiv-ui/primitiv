import type { ReactElement } from "react";

import { Slot } from "../Slot/index.ts";
import { AlertProps } from "./types";

/**
 * An assertive live region for high-priority, time-sensitive messages.
 *
 * Renders a `<div role="alert">`. The `alert` role carries an implicit
 * `aria-live="assertive"` and `aria-atomic="true"`, so assistive
 * technology interrupts the user to announce the message as soon as it
 * appears — use it for errors and other content the user must see now.
 * For non-urgent updates, reach for `Status` instead.
 *
 * Render the `Alert` conditionally: the live region announces content
 * that appears *after* it is already in the DOM. Mounting an `Alert`
 * that already contains its message may not be announced reliably.
 *
 * **`asChild` composition.** Renders the consumer's element instead of
 * a `<div>`, merging `role="alert"` and all other props in via the
 * {@link Slot} utility.
 *
 * @example Form error
 * ```tsx
 * {error && <Alert>{error}</Alert>}
 * ```
 *
 * @example asChild — keep semantic markup
 * ```tsx
 * <Alert asChild>
 *   <section>Upload failed — try again.</section>
 * </Alert>
 * ```
 */
export function Alert({
  asChild = false,
  children,
  ...rest
}: AlertProps): ReactElement {
  const rootProps = { role: "alert", ...rest };

  if (asChild) {
    return <Slot {...rootProps}>{children}</Slot>;
  }

  return <div {...rootProps}>{children}</div>;
}

/** @internal */
Alert.displayName = "Alert";
