import type { ReactElement } from "react";

import { useControllableState } from "../hooks/index.ts";
import { Slot, composeEventHandlers } from "../Slot/index.ts";

import { ToggleProps } from "./types";

/**
 * A stateful toggle button implementing the
 * [WAI-ARIA Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
 * with the `aria-pressed` attribute. Renders a native
 * `<button type="button">` by default.
 *
 * **Controlled vs uncontrolled.** Two state modes, statically discriminated at
 * the type level so TypeScript rejects mixing them:
 *
 * - **Uncontrolled** — pass
 *   {@link ToggleProps.defaultPressed | `defaultPressed`} (or omit entirely
 *   for unpressed on mount). The component owns the pressed value internally.
 * - **Controlled** — pass {@link ToggleProps.pressed | `pressed`} *and*
 *   {@link ToggleProps.onPressedChange | `onPressedChange`} together. The
 *   parent owns the value; every click defers back through the callback.
 *
 * **Keyboard support.** Keyboard activation is provided natively by the
 * underlying `<button>` element — no custom `keydown` listeners are needed:
 *
 * | Key     | Behaviour                              |
 * | ------- | -------------------------------------- |
 * | `Space` | Toggles the button (native `<button>`) |
 * | `Enter` | Toggles the button (native `<button>`) |
 *
 * **Styling hooks.**
 * - `data-state="on" | "off"` — mirrors the pressed state; use
 *   `[data-state="on"]` to style the active appearance.
 * - `data-disabled=""` — set when `disabled` is `true`; lets CSS target
 *   `[data-disabled]` without relying on the `:disabled` pseudo-class.
 *
 * **`asChild` composition.** Pass `asChild` to render any consumer-supplied
 * element instead of the default `<button>`. The toggle's `aria-pressed`,
 * `data-state`, composed `onClick`, and `ref` are merged onto the child via
 * {@link Slot}. The native `<button>` is dropped; the consumer is responsible
 * for making the element focusable (e.g. `tabIndex={0}`, `role="button"`).
 *
 * **Ref forwarding.** Pass a `ref` prop to access the underlying
 * `HTMLButtonElement` directly (or the `asChild` element when `asChild` is
 * set):
 *
 * ```tsx
 * const ref = useRef<HTMLButtonElement>(null);
 * <Toggle ref={ref} aria-label="Bold">B</Toggle>
 * ```
 *
 * **Disabled.** Sets the native `disabled` attribute (removing the button
 * from the tab order and suppressing clicks) **and** sets `data-disabled=""`
 * so CSS can target `[data-disabled]` without relying on `:disabled`.
 *
 * @extends HTMLButtonElement
 *
 * @example Uncontrolled
 * ```tsx
 * <Toggle aria-label="Bold" defaultPressed>B</Toggle>
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [bold, setBold] = useState(false);
 *
 * <Toggle pressed={bold} onPressedChange={setBold} aria-label="Bold">B</Toggle>
 * ```
 *
 * @example Disabled
 * ```tsx
 * <Toggle disabled aria-label="Bold (unavailable)">B</Toggle>
 * ```
 *
 * @example asChild — render a custom element with toggle semantics
 * ```tsx
 * <Toggle asChild aria-label="Bold">
 *   <div role="button" tabIndex={0}>B</div>
 * </Toggle>
 * ```
 */
function Toggle({
  defaultPressed,
  pressed: controlledPressed,
  onPressedChange,
  disabled,
  asChild = false,
  onClick,
  children,
  ref,
  ...rest
}: ToggleProps): ReactElement {
  const [pressed, setPressed] = useControllableState<boolean>(
    controlledPressed,
    defaultPressed ?? false,
  );

  const toggle = () => {
    const next = !pressed;
    setPressed(next);
    onPressedChange?.(next);
  };

  const toggleProps = {
    ...rest,
    ref,
    "aria-pressed": pressed,
    "data-state": pressed ? ("on" as const) : ("off" as const),
    "data-disabled": disabled ? "" : undefined,
    disabled,
    onClick: composeEventHandlers(onClick, toggle),
  };

  if (asChild) return <Slot {...toggleProps}>{children}</Slot>;
  return (
    <button type="button" {...toggleProps}>
      {children}
    </button>
  );
}

/** @internal */
Toggle.displayName = "Toggle";

export { Toggle };
