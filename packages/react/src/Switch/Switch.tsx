import { useMemo } from "react";

import { Slot, composeEventHandlers } from "../Slot/index.ts";

import { SwitchContext } from "./SwitchContext";
import { useSwitchContext, useSwitchRoot } from "./hooks/index.ts";
import { SwitchRootProps, SwitchThumbProps } from "./types";

/**
 * The root of a Switch — a native `<button type="button" role="switch">` that
 * owns the binary checked state and provides {@link SwitchContext} to
 * descendant {@link SwitchThumb | `Switch.Thumb`}s.
 *
 * Supports two state modes, statically discriminated at the type level:
 *
 * - **Uncontrolled** — pass
 *   {@link SwitchRootProps.defaultChecked | `defaultChecked`} (or omit for
 *   unchecked-on-mount). The component owns the value internally.
 * - **Controlled** — pass
 *   {@link SwitchRootProps.checked | `checked`} *and*
 *   {@link SwitchRootProps.onCheckedChange | `onCheckedChange`} together.
 *   The parent owns the value; every click defers back through the callback.
 *
 * **ARIA.** `role="switch"` and `aria-checked` are set automatically.
 * Provide an accessible name via `aria-label`, `aria-labelledby`, or
 * a visible label element.
 *
 * **Styling hooks.** `data-state="checked" | "unchecked"` on the root, plus
 * `data-disabled=""` when disabled.
 *
 * **`asChild` prop.** Pass `asChild` to render any consumer-supplied element
 * with the switch's ARIA attributes, `data-state`, composed `onClick`, and
 * `ref` merged in. The native `<button>` is dropped.
 *
 * @example Uncontrolled
 * ```tsx
 * <Switch.Root defaultChecked aria-label="Enable notifications">
 *   <Switch.Thumb />
 * </Switch.Root>
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [enabled, setEnabled] = useState(false);
 *
 * <Switch.Root checked={enabled} onCheckedChange={setEnabled} aria-label="…">
 *   <Switch.Thumb />
 * </Switch.Root>
 * ```
 */
function SwitchRoot({
  defaultChecked,
  checked,
  onCheckedChange,
  disabled,
  asChild = false,
  onClick,
  children,
  ref,
  ...rest
}: SwitchRootProps) {
  const { checked: isChecked, toggle } = useSwitchRoot({
    defaultChecked,
    checked,
    onCheckedChange,
  });
  const contextValue = useMemo(() => ({ checked: isChecked }), [isChecked]);
  const rootProps = {
    ...rest,
    ref,
    role: "switch" as const,
    "aria-checked": isChecked,
    "data-state": isChecked ? ("checked" as const) : ("unchecked" as const),
    "data-disabled": disabled ? "" : undefined,
    disabled,
    onClick: composeEventHandlers(onClick, toggle),
  };
  return (
    <SwitchContext.Provider value={contextValue}>
      {asChild ? (
        <Slot {...rootProps}>{children}</Slot>
      ) : (
        <button type="button" {...rootProps}>
          {children}
        </button>
      )}
    </SwitchContext.Provider>
  );
}

SwitchRoot.displayName = "SwitchRoot";

/**
 * A decorative `<span aria-hidden="true">` that represents the sliding thumb
 * of the switch. Always mounted — its position is driven entirely by CSS
 * targeting `data-state="checked" | "unchecked"`. Unlike
 * {@link Checkbox.Indicator}, it never conditionally unmounts.
 *
 * **Styling hook.** Mirrors the parent Root's
 * `data-state="checked" | "unchecked"` for CSS transitions.
 *
 * **`asChild` prop.** Pass `asChild` to render the consumer's own element
 * as the thumb, with `aria-hidden` and `data-state` merged in.
 *
 * @example
 * ```tsx
 * <Switch.Root aria-label="Enable notifications">
 *   <Switch.Thumb />
 * </Switch.Root>
 * ```
 *
 * @throws if rendered outside a `Switch.Root`.
 */
function SwitchThumb({ children, asChild = false, ...rest }: SwitchThumbProps) {
  const { checked } = useSwitchContext();
  const thumbProps = {
    ...rest,
    "aria-hidden": "true" as const,
    "data-state": checked ? ("checked" as const) : ("unchecked" as const),
  };
  if (asChild) {
    return <Slot {...thumbProps}>{children}</Slot>;
  }
  return <span {...thumbProps}>{children}</span>;
}

SwitchThumb.displayName = "SwitchThumb";

type TSwitchCompound = typeof SwitchRoot & {
  Root: typeof SwitchRoot;
  Thumb: typeof SwitchThumb;
};

/**
 * Headless, accessible **Switch** — a compound component implementing the
 * [WAI-ARIA Switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/)
 * on a native `<button role="switch">`. Semantically represents an immediate
 * on/off action (as opposed to a selection choice). Zero styles ship.
 *
 * `Switch` is both callable (an alias of
 * {@link SwitchRoot | `Switch.Root`}) and carries its sub-components as
 * static properties.
 *
 * - {@link SwitchRoot | `Switch.Root`} — state owner, context provider, toggle button.
 * - {@link SwitchThumb | `Switch.Thumb`} — always-mounted decorative thumb;
 *   position driven by `data-state` via CSS.
 *
 * @example Minimal usage
 * ```tsx
 * import { Switch } from "@primitiv-ui/react";
 *
 * <Switch.Root aria-label="Enable notifications">
 *   <Switch.Thumb />
 * </Switch.Root>
 * ```
 *
 * @see {@link SwitchRoot} for state modes and ARIA details.
 * @see {@link SwitchThumb} for styling the sliding thumb.
 */
const SwitchCompound: TSwitchCompound = Object.assign(SwitchRoot, {
  Root: SwitchRoot,
  Thumb: SwitchThumb,
});

SwitchCompound.displayName = "Switch";

export { SwitchCompound as Switch };
