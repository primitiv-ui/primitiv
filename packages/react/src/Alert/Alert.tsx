import type { ReactElement } from "react";

import { Slot } from "../Slot/index.ts";
import { AlertProps } from "./types";

/**
 * An assertive live region for high-priority, time-sensitive messages,
 * implementing the WAI-ARIA `alert` role.
 *
 * Renders a `<div role="alert">`. The `alert` role carries an implicit
 * `aria-live="assertive"` and `aria-atomic="true"`, so assistive
 * technology interrupts the user to announce the message as soon as it
 * appears — use it for errors and other content the user must see now.
 * For non-urgent updates, reach for `Status` instead.
 *
 * **Announce on appearance.** A live region announces content that
 * changes *after* the region is already in the DOM. Render `Alert`
 * conditionally so the message appears into an already-mounted tree:
 *
 * ```tsx
 * {submitError && <Alert>{submitError}</Alert>}
 * ```
 *
 * Mounting an `Alert` that already contains its message may not be
 * announced reliably by all assistive technology.
 *
 * **Styling hooks.** The component emits no `data-*` attributes — it
 * carries no internal state. Target the rendered element directly via
 * `className` or the `[role="alert"]` selector.
 *
 * **`asChild` composition.** Renders the consumer's element instead of
 * a `<div>`, merging `role="alert"` and all other props onto it via the
 * {@link Slot} utility. Useful when you already have a semantic element
 * (e.g. `<section>`, `<aside>`) that should also function as an ARIA
 * alert.
 *
 * **Ref forwarding.** Pass a `ref` prop to access the underlying
 * `HTMLDivElement` (or, under `asChild`, the consumer's element):
 *
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * <Alert ref={ref}>Something went wrong.</Alert>
 * ```
 *
 * @extends HTMLDivElement
 *
 * @example Form error
 * ```tsx
 * {error && <Alert>{error}</Alert>}
 * ```
 *
 * @example Inline styling via className
 * ```tsx
 * <Alert className="alert alert--error">Payment declined.</Alert>
 * ```
 *
 * @example asChild — apply the alert role to a semantic element
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
