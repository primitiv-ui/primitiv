import { useMemo } from "react";
import type { ReactElement } from "react";

import { Slot } from "../Slot/index.ts";

import { RadioContext } from "./RadioContext";
import { useRadioContext, useRadioRoot } from "./hooks/index.ts";
import { RadioIndicatorProps, RadioRootProps } from "./types";

function dataStateOf(checked: boolean) {
  return checked ? ("checked" as const) : ("unchecked" as const);
}

/**
 * The root of a Radio — a `<label>` that is itself the **visible, styled box**
 * and wraps a **real, visually-hidden `<input type="radio">`** (the focusable,
 * form-participating control) plus the decorative
 * {@link RadioIndicator | `Radio.Indicator`} dot. It provides
 * {@link RadioContext | `RadioContext`} to the indicator.
 *
 * Because the underlying element is a genuine native radio, it behaves like
 * one: siblings sharing a `name` form a **native radio group** (the browser
 * deselects the others when one is chosen — no JS required), it submits with
 * an enclosing form, resets with it, and gets keyboard activation and focus
 * for free. This is the standalone primitive for "I own the grouping via
 * `name`, or I'm a single opt-in". For a managed set with roving-tabindex
 * arrow-key navigation, reach for `RadioGroup` instead.
 *
 * Props routing: `className` / `style` style the **box** (the `<label>` you
 * see — the input is hidden); every other prop (`name`, `value`, `id`,
 * `aria-*`, `required`, `disabled`, `ref`, …) spreads onto the input, because
 * semantically the Root *is* the radio.
 *
 * Supports two state modes, statically discriminated at the type level:
 *
 * - **Uncontrolled** — pass
 *   {@link RadioRootProps.defaultChecked | `defaultChecked`} (or omit). The
 *   **browser** owns the value, so native `name`-grouping just works.
 * - **Controlled** — pass {@link RadioRootProps.checked | `checked`} *and*
 *   {@link RadioRootProps.onCheckedChange | `onCheckedChange`} together. The
 *   parent owns the value and the grouping.
 *
 * **Styling hooks.** `data-state="checked" | "unchecked"` and
 * `data-disabled=""` on the box (and `data-state` on the indicator). These
 * mirror the input but can lag a silent native deselect, so shipped CSS keys
 * visibility off the input's native `:checked` / `:has()` selectors;
 * `data-state` is a convenience mirror.
 *
 * @extends HTMLInputElement
 *
 * @example Native group (the browser owns selection)
 * ```tsx
 * <Radio.Root name="density" value="compact" defaultChecked aria-label="Compact">
 *   <Radio.Indicator />
 * </Radio.Root>
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [value, setValue] = useState("comfortable");
 *
 * <Radio.Root
 *   name="density"
 *   value="compact"
 *   checked={value === "compact"}
 *   onCheckedChange={() => setValue("compact")}
 *   aria-label="Compact"
 * >
 *   <Radio.Indicator />
 * </Radio.Root>
 * ```
 */
export function RadioRoot(props: RadioRootProps): ReactElement {
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
    checked: isChecked,
    handleChange,
    inputStateProps,
  } = useRadioRoot({ defaultChecked, checked, onCheckedChange, onChange });
  const contextValue = useMemo(
    () => ({ checked: isChecked, disabled: Boolean(disabled) }),
    [isChecked, disabled],
  );
  return (
    <RadioContext.Provider value={contextValue}>
      <label
        className={className}
        style={style}
        data-state={dataStateOf(isChecked)}
        data-disabled={disabled ? "" : undefined}
      >
        <input
          type="radio"
          ref={ref}
          disabled={disabled}
          {...inputRest}
          {...inputStateProps}
          onChange={handleChange}
        />
        {children}
      </label>
    </RadioContext.Provider>
  );
}

/** @internal */
RadioRoot.displayName = "RadioRoot";

/**
 * The decorative dot — a `<span>` that is **always mounted**, sitting inside
 * the {@link RadioRoot | `Radio.Root`} box. Its visibility is a pure CSS
 * concern, driven off the input's native `:checked` state, so it stays correct
 * even when the browser silently deselects a grouped sibling (an event React
 * never sees). The radio's accessible state is conveyed by the native input,
 * so the dot is purely visual.
 *
 * **Styling hook.** Mirrors the root's `data-state="checked" | "unchecked"`.
 *
 * **`asChild` prop.** Pass `asChild` to render the consumer's own element
 * (typically an `<svg>` dot) as the indicator itself, with `data-state` merged
 * onto that element rather than a wrapper.
 *
 * @extends HTMLSpanElement
 *
 * @example Dot as the indicator via `asChild`
 * ```tsx
 * <Radio.Indicator asChild>
 *   <svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="3" /></svg>
 * </Radio.Indicator>
 * ```
 *
 * @throws if rendered outside a `Radio.Root`.
 */
export function RadioIndicator({
  children,
  asChild = false,
  ...rest
}: RadioIndicatorProps): ReactElement {
  const { checked } = useRadioContext();
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
RadioIndicator.displayName = "RadioIndicator";

/** Type of the {@link Radio} compound: the root callable plus its attached sub-components. */
export type TRadioCompound = typeof RadioRoot & {
  Root: typeof RadioRoot;
  Indicator: typeof RadioIndicator;
};

/**
 * Headless, accessible **Radio** — a standalone compound component built on a
 * **real, visually-hidden native `<input type="radio">`**. Unlike a button
 * dressed up with `role="radio"`, it participates in native forms and groups
 * by `name` the way the platform intends. Zero styles ship.
 *
 * `Radio` is the lone control for when you own the grouping (via a native
 * `name`, or a single opt-in); for a managed set with roving-tabindex
 * keyboard navigation use `RadioGroup`.
 *
 * `Radio` is both callable (an alias of {@link RadioRoot | `Radio.Root`}) and
 * carries its sub-components as static properties.
 *
 * - {@link RadioRoot | `Radio.Root`} — the styled box: label + hidden input, state owner, context provider.
 * - {@link RadioIndicator | `Radio.Indicator`} — the decorative dot.
 *
 * @example Minimal usage
 * ```tsx
 * import { Radio } from "@primitiv-ui/react";
 *
 * <Radio.Root name="plan" value="free" aria-label="Free">
 *   <Radio.Indicator />
 * </Radio.Root>;
 * ```
 *
 * @see {@link RadioRoot} for state modes and native-grouping semantics.
 */
const RadioCompound: TRadioCompound = Object.assign(RadioRoot, {
  Root: RadioRoot,
  Indicator: RadioIndicator,
});

/** @internal */
RadioCompound.displayName = "Radio";

export { RadioCompound as Radio };
