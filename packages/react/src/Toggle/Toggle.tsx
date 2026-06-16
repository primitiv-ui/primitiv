import { useControllableState } from "../hooks/index.ts";
import { Slot, composeEventHandlers } from "../Slot/index.ts";

import { ToggleProps } from "./types";

/**
 * A stateful toggle button implementing the
 * [WAI-ARIA Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
 * with the `aria-pressed` attribute. Renders a native
 * `<button type="button">` by default.
 *
 * Supports two state modes, statically discriminated at the type level:
 *
 * - **Uncontrolled** — pass
 *   {@link ToggleProps.defaultPressed | `defaultPressed`} (or omit for
 *   unpressed on mount). The component owns the value internally.
 * - **Controlled** — pass
 *   {@link ToggleProps.pressed | `pressed`} *and*
 *   {@link ToggleProps.onPressedChange | `onPressedChange`} together.
 *   The parent owns the value; every click defers back through the callback.
 *
 * **ARIA.** `aria-pressed` is set automatically to reflect the pressed state.
 *
 * **Styling hooks.** `data-state="on" | "off"` on the element, plus
 * `data-disabled=""` when disabled.
 *
 * **`asChild` prop.** Pass `asChild` to render any consumer-supplied element
 * with the toggle's `aria-pressed`, `data-state`, composed `onClick`, and
 * `ref` merged in. The native `<button>` is dropped.
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
}: ToggleProps) {
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
  return <button type="button" {...toggleProps}>{children}</button>;
}

Toggle.displayName = "Toggle";

export { Toggle };
