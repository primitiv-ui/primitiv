import type { ReactElement } from "react";

import { Slot } from "../Slot/index.ts";
import { ButtonProps } from "./types";

/**
 * A headless, accessible `<button>` element.
 *
 * Renders a native `<button type="button">` by default, preventing
 * accidental form submission. The `type` prop can override this to
 * `"submit"` or `"reset"` when the button lives inside a form.
 *
 * **Ref forwarding.** Pass a `ref` prop to access the underlying
 * `HTMLButtonElement` directly:
 *
 * ```tsx
 * const ref = useRef<HTMLButtonElement>(null);
 * <Button ref={ref}>Click me</Button>
 * ```
 *
 * **Disabled.** Sets native `disabled` (removing the button from the
 * tab order and suppressing clicks) plus `data-disabled=""` so CSS can
 * target `[data-disabled]` without relying on the `:disabled` pseudo-class:
 *
 * ```tsx
 * <Button disabled>Save</Button>
 * ```
 *
 * ```css
 * button[data-disabled] { opacity: 0.5; cursor: not-allowed; }
 * ```
 *
 * **`asChild` composition.** Renders the consumer's element instead of
 * `<button>`, merging all props (aria-*, data-*, event handlers, ref)
 * via the {@link Slot} utility. Event handlers compose with the child's
 * own handlers (child runs first). `type` is **not** forwarded in this
 * mode — the child element owns its own type semantics.
 *
 * **Icon-only buttons.** Provide `aria-label` or `aria-labelledby`
 * when the button has no visible text label. Mark decorative icons
 * `aria-hidden="true"`:
 *
 * ```tsx
 * <Button aria-label="Close dialog">
 *   <CloseIcon aria-hidden="true" />
 * </Button>
 * ```
 *
 * @extends HTMLButtonElement
 *
 * @example Text button
 * ```tsx
 * <Button onClick={handleSave}>Save</Button>
 * ```
 *
 * @example Submit button inside a form
 * ```tsx
 * <Button type="submit">Send</Button>
 * ```
 *
 * @example Disabled
 * ```tsx
 * <Button disabled>Save</Button>
 * ```
 *
 * @example asChild — render a router link styled as a button
 * ```tsx
 * <Button asChild>
 *   <a href="/settings">Settings</a>
 * </Button>
 * ```
 */
export function Button({
  asChild = false,
  type = "button",
  disabled,
  children,
  ref,
  ...rest
}: ButtonProps): ReactElement {
  const rootProps = {
    ...rest,
    ref,
    disabled,
    "data-disabled": disabled ? "" : undefined,
  };

  if (asChild) {
    return <Slot {...rootProps}>{children}</Slot>;
  }

  return (
    <button type={type} {...rootProps}>
      {children}
    </button>
  );
}

/** @internal */
Button.displayName = "Button";
