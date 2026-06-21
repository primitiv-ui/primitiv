import { useMemo } from "react";
import type { ReactElement } from "react";

import { Slot } from "../Slot/index.ts";

import { SwitchContext } from "./SwitchContext";
import { useSwitchContext, useSwitchRoot } from "./hooks/index.ts";
import { SwitchRootProps, SwitchThumbProps } from "./types";

function dataStateOf(checked: boolean) {
  return checked ? ("checked" as const) : ("unchecked" as const);
}

/**
 * The root of a Switch — a `<label>` that is itself the **visible track** and
 * wraps a **real, visually-hidden `<input type="checkbox" role="switch">`**
 * (the focusable, form-participating control) plus the
 * {@link SwitchThumb | `Switch.Thumb`}. It provides
 * {@link SwitchContext | `SwitchContext`} to the thumb.
 *
 * Because the underlying element is a genuine native checkbox (with the switch
 * role), it behaves like a real form field: it submits its `value` under `name`
 * with an enclosing form, resets with it, and gets keyboard activation and
 * focus for free. Semantically it represents an immediate on/off action.
 *
 * Props routing: `className` / `style` style the **track** (the `<label>` you
 * see — the input is hidden); every other prop (`name`, `value`, `id`,
 * `aria-*`, `required`, `disabled`, `ref`, …) spreads onto the input, because
 * semantically the Root *is* the switch.
 *
 * Supports two state modes, statically discriminated at the type level:
 *
 * - **Uncontrolled** — pass `defaultChecked` (or omit). The browser owns the
 *   value, so the switch participates in forms and resets.
 * - **Controlled** — pass `checked` *and* `onCheckedChange` together.
 *
 * **Styling hooks.** `data-state="checked" | "unchecked"` and `data-disabled=""`
 * on the track (and `data-state` on the thumb). These mirror the input, but
 * shipped CSS positions the thumb off the input's native `:checked` instead;
 * `data-state` is a convenience mirror.
 *
 * **Keyboard.** Toggles on `Space` (the native checkbox behaviour); `Enter`
 * does not toggle a checkbox-based control.
 *
 * @example Uncontrolled
 * ```tsx
 * <Switch.Root name="notify" value="on" defaultChecked aria-label="Enable notifications">
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
export function SwitchRoot({
  className,
  style,
  defaultChecked,
  checked,
  onCheckedChange,
  onChange,
  disabled,
  children,
  ref,
  ...inputRest
}: SwitchRootProps): ReactElement {
  const {
    checked: isChecked,
    handleChange,
    inputStateProps,
  } = useSwitchRoot({ defaultChecked, checked, onCheckedChange, onChange });
  const contextValue = useMemo(
    () => ({ checked: isChecked, disabled: Boolean(disabled) }),
    [isChecked, disabled],
  );
  return (
    <SwitchContext.Provider value={contextValue}>
      <label
        className={className}
        style={style}
        data-state={dataStateOf(isChecked)}
        data-disabled={disabled ? "" : undefined}
      >
        <input
          type="checkbox"
          role="switch"
          ref={ref}
          disabled={disabled}
          {...inputRest}
          {...inputStateProps}
          onChange={handleChange}
        />
        {children}
      </label>
    </SwitchContext.Provider>
  );
}

/** @internal */
SwitchRoot.displayName = "SwitchRoot";

/**
 * A decorative `<span aria-hidden="true">` representing the sliding thumb of
 * the switch. Always mounted — its position is driven entirely by CSS, which
 * should key off the input's native `:checked` so it stays correct through a
 * form reset.
 *
 * **Styling hook.** Mirrors the root's `data-state="checked" | "unchecked"`.
 *
 * **`asChild` prop.** Pass `asChild` to render the consumer's own element as
 * the thumb, with `aria-hidden` and `data-state` merged in.
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
export function SwitchThumb({
  children,
  asChild = false,
  ...rest
}: SwitchThumbProps): ReactElement {
  const { checked } = useSwitchContext();
  const thumbProps = {
    ...rest,
    "aria-hidden": "true" as const,
    "data-state": dataStateOf(checked),
  };
  if (asChild) {
    return <Slot {...thumbProps}>{children}</Slot>;
  }
  return <span {...thumbProps}>{children}</span>;
}

/** @internal */
SwitchThumb.displayName = "SwitchThumb";

/** Type of the {@link Switch} compound — the Root callable plus its sub-components. */
export type TSwitchCompound = typeof SwitchRoot & {
  /** The root track, owning checked state and context. */
  Root: typeof SwitchRoot;
  /** The sliding thumb indicator. */
  Thumb: typeof SwitchThumb;
};

/**
 * Headless, accessible **Switch** — a compound component built on a **real,
 * visually-hidden native `<input type="checkbox" role="switch">`**. Unlike a
 * button dressed up with `role="switch"`, it participates in native forms.
 * Semantically represents an immediate on/off action (as opposed to a selection
 * choice). Zero styles ship.
 *
 * `Switch` is both callable (an alias of
 * {@link SwitchRoot | `Switch.Root`}) and carries its sub-components as
 * static properties.
 *
 * - {@link SwitchRoot | `Switch.Root`} — the track: label + hidden input, state owner, context provider.
 * - {@link SwitchThumb | `Switch.Thumb`} — always-mounted decorative thumb;
 *   position driven by CSS (the input's native `:checked`).
 *
 * @example Minimal usage
 * ```tsx
 * import { Switch } from "@primitiv-ui/react";
 *
 * <Switch.Root name="notify" value="on" aria-label="Enable notifications">
 *   <Switch.Thumb />
 * </Switch.Root>
 * ```
 *
 * @see {@link SwitchRoot} for state modes and form participation.
 * @see {@link SwitchThumb} for styling the sliding thumb.
 */
const SwitchCompound: TSwitchCompound = Object.assign(SwitchRoot, {
  Root: SwitchRoot,
  Thumb: SwitchThumb,
});

SwitchCompound.displayName = "Switch";

export { SwitchCompound as Switch };
