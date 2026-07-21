import { useEffect, useMemo, useRef } from "react";
import type { ReactElement } from "react";

import { Slot, composeRefs } from "../Slot/index.ts";

import { CheckboxContext } from "./CheckboxContext";
import { useCheckboxContext, useCheckboxInput } from "./hooks/index.ts";
import {
  CheckboxIndicatorProps,
  CheckboxRootProps,
  CheckedState,
} from "./types";

function dataStateOf(checked: CheckedState) {
  if (checked === "indeterminate") return "indeterminate" as const;
  return checked ? ("checked" as const) : ("unchecked" as const);
}

/**
 * The root of a Checkbox — a `<label>` that is itself the **visible, styled
 * box** and wraps a **real, visually-hidden `<input type="checkbox">`** (the
 * focusable, form-participating control) plus the decorative
 * {@link CheckboxIndicator | `Checkbox.Indicator`} mark. It provides
 * {@link CheckboxContext | `CheckboxContext`} to the indicator.
 *
 * Because the underlying element is a genuine native checkbox, it behaves like
 * one: it submits its `value` under `name` with an enclosing form, resets with
 * the form, and gets keyboard activation and focus for free. The tri-state
 * `"indeterminate"` is the platform's own: it is applied via the input's
 * `.indeterminate` DOM property, so the browser exposes `aria-checked="mixed"`
 * and the `:indeterminate` pseudo-class for styling.
 *
 * Props routing: `className` / `style` style the **box** (the `<label>` you
 * see — the input is hidden); every other prop (`name`, `value`, `id`,
 * `aria-*`, `required`, `disabled`, `ref`, …) spreads onto the input, because
 * semantically the Root *is* the checkbox.
 *
 * Supports two state modes, statically discriminated at the type level:
 *
 * - **Uncontrolled** — pass
 *   {@link CheckboxRootProps.defaultChecked | `defaultChecked`} (or omit). It
 *   may be `"indeterminate"` for a mixed-on-mount checkbox.
 * - **Controlled** — pass
 *   {@link CheckboxRootProps.checked | `checked`} *and*
 *   {@link CheckboxRootProps.onCheckedChange | `onCheckedChange`} together.
 *   Clicking a mixed checkbox resolves it to `true`.
 *
 * **Styling hooks.** `data-state="checked" | "unchecked" | "indeterminate"`
 * and `data-disabled=""` on the box (and `data-state` on the indicator). These
 * mirror the input, but shipped CSS keys the mark off the input's native
 * `:checked` / `:indeterminate` instead; `data-state` is a convenience mirror.
 *
 * @extends HTMLInputElement
 *
 * @example Uncontrolled
 * ```tsx
 * <Checkbox.Root name="terms" value="accepted" defaultChecked aria-label="Accept terms">
 *   <Checkbox.Indicator />
 * </Checkbox.Root>
 * ```
 *
 * @example Controlled tri-state
 * ```tsx
 * const [checked, setChecked] = useState<CheckedState>("indeterminate");
 *
 * <Checkbox.Root checked={checked} onCheckedChange={setChecked} aria-label="…">
 *   <Checkbox.Indicator />
 * </Checkbox.Root>
 * ```
 */
export function CheckboxRoot(props: CheckboxRootProps): ReactElement {
  const {
    className,
    style,
    children,
    defaultChecked,
    checked,
    onCheckedChange,
    onChange,
    disabled,
    ref,
    ...inputRest
  } = props;
  const {
    checked: value,
    handleChange,
    inputStateProps,
  } = useCheckboxInput({ defaultChecked, checked, onCheckedChange, onChange });

  // `indeterminate` is a DOM property with no JSX attribute, so it is applied
  // imperatively whenever the resolved tri-state value changes. The input is
  // rendered unconditionally, so the ref is always set here.
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current!.indeterminate = value === "indeterminate";
  }, [value]);
  const composedRef = ref ? composeRefs(inputRef, ref) : inputRef;

  const contextValue = useMemo(
    () => ({ checked: value, disabled: Boolean(disabled) }),
    [value, disabled],
  );
  return (
    <CheckboxContext.Provider value={contextValue}>
      <label
        className={className}
        style={style}
        data-state={dataStateOf(value)}
        data-disabled={disabled ? "" : undefined}
      >
        <input
          type="checkbox"
          ref={composedRef}
          disabled={disabled}
          {...inputRest}
          {...inputStateProps}
          onChange={handleChange}
        />
        {children}
      </label>
    </CheckboxContext.Provider>
  );
}

/** @internal */
CheckboxRoot.displayName = "CheckboxRoot";

/**
 * The decorative mark — a `<span>` that is **always mounted**, sitting inside
 * the {@link CheckboxRoot | `Checkbox.Root`} box. Its visibility and shape (a
 * tick when checked, a bar when indeterminate) are a pure CSS concern, revealed
 * off the input's native `:checked` / `:indeterminate` state. The checkbox's
 * accessible state is conveyed by the native input, so the mark is purely
 * visual.
 *
 * **Styling hook.** Mirrors the root's
 * `data-state="checked" | "unchecked" | "indeterminate"`.
 *
 * **`asChild` prop.** Pass `asChild` to render the consumer's own element
 * (typically an `<svg>` tick) as the indicator itself, with `data-state`
 * merged onto that element rather than a wrapper.
 *
 * @extends HTMLSpanElement
 *
 * @example Icon as the indicator via `asChild`
 * ```tsx
 * <Checkbox.Indicator asChild>
 *   <svg viewBox="0 0 10 10"><path d="M1 5l3 3 5-7" /></svg>
 * </Checkbox.Indicator>
 * ```
 *
 * @throws if rendered outside a `Checkbox.Root`.
 */
export function CheckboxIndicator({
  children,
  asChild = false,
  ...rest
}: CheckboxIndicatorProps): ReactElement {
  const { checked } = useCheckboxContext();
  const indicatorProps = {
    ...rest,
    "aria-hidden": "true" as const,
    "data-state": dataStateOf(checked),
  };
  if (asChild) {
    return <Slot {...indicatorProps}>{children}</Slot>;
  }
  return <span {...indicatorProps}>{children}</span>;
}

/** @internal */
CheckboxIndicator.displayName = "CheckboxIndicator";

/** Type of the {@link Checkbox} compound: the root callable plus its attached sub-components. */
export type TCheckboxCompound = typeof CheckboxRoot & {
  Root: typeof CheckboxRoot;
  Indicator: typeof CheckboxIndicator;
};

/**
 * Headless, accessible **Checkbox** — a compound component built on a **real,
 * visually-hidden native `<input type="checkbox">`**, including the platform's
 * own tri-state (`indeterminate` → `aria-checked="mixed"`). Unlike a button
 * dressed up with `role="checkbox"`, it participates in native forms. Zero
 * styles ship.
 *
 * `Checkbox` is both callable (an alias of
 * {@link CheckboxRoot | `Checkbox.Root`}) and carries its sub-components as
 * static properties.
 *
 * - {@link CheckboxRoot | `Checkbox.Root`} — the styled box: label + hidden input, state owner, context provider.
 * - {@link CheckboxIndicator | `Checkbox.Indicator`} — the decorative mark.
 *
 * @example Minimal usage
 * ```tsx
 * import { Checkbox } from "@primitiv-ui/react";
 *
 * <Checkbox.Root name="terms" value="accepted" aria-label="Accept terms">
 *   <Checkbox.Indicator />
 * </Checkbox.Root>;
 * ```
 *
 * @see {@link CheckboxRoot} for state modes and tri-state semantics.
 */
const CheckboxCompound: TCheckboxCompound = Object.assign(CheckboxRoot, {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
});

/** @internal */
CheckboxCompound.displayName = "Checkbox";

export { CheckboxCompound as Checkbox };
