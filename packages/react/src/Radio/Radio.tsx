import { useMemo } from "react";
import type { ReactElement } from "react";

import { Slot, composeEventHandlers } from "../Slot/index.ts";

import { RadioContext } from "./RadioContext";
import { useRadioContext, useRadioRoot } from "./hooks/index.ts";
import { RadioIndicatorProps, RadioRootProps } from "./types";

function dataStateOf(checked: boolean) {
  return checked ? ("checked" as const) : ("unchecked" as const);
}

/**
 * The root of a Radio — a native `<button role="radio">` that owns a
 * single boolean selected value and provides
 * {@link RadioContext | `RadioContext`} to descendant
 * {@link RadioIndicator | `Radio.Indicator`}s.
 *
 * Unlike a checkbox, selection is **one-way**: clicking an unselected
 * radio selects it, but clicking the already-selected radio is a no-op —
 * a lone radio never toggles itself off. De-selection happens when a
 * sibling is chosen, which is the grouping consumer's concern. For a
 * managed set with roving-tabindex keyboard navigation, reach for
 * `RadioGroup` instead; `Radio` is the standalone control for when you
 * own the grouping (e.g. a native form `name`, or a bespoke layout).
 *
 * Supports two state modes, statically discriminated at the type level:
 *
 * - **Uncontrolled** — pass
 *   {@link RadioRootProps.defaultChecked | `defaultChecked`} (or omit for
 *   unselected-on-mount). The component owns the value internally.
 * - **Controlled** — pass {@link RadioRootProps.checked | `checked`} *and*
 *   {@link RadioRootProps.onCheckedChange | `onCheckedChange`} together.
 *   The parent owns the value; the component defers selection back through
 *   the callback.
 *
 * **ARIA.** `role="radio"` and `aria-checked` are set automatically.
 *
 * **Styling hooks.** `data-state="checked" | "unchecked"` on the root,
 * plus `data-disabled=""` when disabled.
 *
 * **`asChild` prop.** Pass `asChild` to render any consumer-supplied
 * element (e.g. `<li role="menuitemradio">` for menu composition) with
 * the radio's ARIA attributes, data-state, composed onClick, and ref
 * merged in. The native `<button>` is dropped; consumers who want keyboard
 * activation on a non-button element are responsible for providing it.
 *
 * @example Uncontrolled
 * ```tsx
 * <Radio.Root defaultChecked aria-label="Compact">
 *   <Radio.Indicator />
 * </Radio.Root>
 * ```
 *
 * @example Controlled (consumer owns the group)
 * ```tsx
 * const [value, setValue] = useState("comfortable");
 *
 * <Radio.Root
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
    defaultChecked,
    checked,
    onCheckedChange,
    onClick,
    disabled,
    asChild = false,
    children,
    ...rest
  } = props;
  const { checked: isChecked, select } = useRadioRoot({
    defaultChecked,
    checked,
    onCheckedChange,
  });
  const contextValue = useMemo(() => ({ checked: isChecked }), [isChecked]);
  const rootProps = {
    ...rest,
    role: "radio" as const,
    "aria-checked": isChecked,
    "data-state": dataStateOf(isChecked),
    "data-disabled": disabled ? "" : undefined,
    disabled,
    onClick: composeEventHandlers(onClick, select),
  };
  return (
    <RadioContext.Provider value={contextValue}>
      {asChild ? (
        <Slot {...rootProps}>{children}</Slot>
      ) : (
        <button type="button" {...rootProps}>
          {children}
        </button>
      )}
    </RadioContext.Provider>
  );
}

/** @internal */
RadioRoot.displayName = "RadioRoot";

/**
 * A decorative `<span aria-hidden="true">` that renders its children only
 * while the parent {@link RadioRoot | `Radio.Root`} is **selected** —
 * typically the filled dot inside a radio control. The radio's accessible
 * state is already conveyed by `aria-checked` on the root, so the indicator
 * is purely visual.
 *
 * **Styling hook.** Mirrors the root's
 * `data-state="checked" | "unchecked"` so the same CSS rule can target
 * both.
 *
 * **`asChild` prop.** Pass `asChild` to render the consumer's own element
 * (typically an `<svg>` dot) as the indicator itself, with `aria-hidden`
 * and `data-state` merged onto that element rather than a wrapper.
 *
 * **`forceMount` prop.** Pass `forceMount` to keep the indicator in the
 * DOM while unchecked so a CSS exit animation can play against
 * `data-state="unchecked"`. Consumers who use `forceMount` own the exit
 * lifecycle themselves.
 *
 * @example Default span wrapper
 * ```tsx
 * <Radio.Root aria-label="Compact">
 *   <Radio.Indicator />
 *   Compact
 * </Radio.Root>
 * ```
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
  forceMount,
  asChild = false,
  ...rest
}: RadioIndicatorProps): ReactElement | null {
  const { checked } = useRadioContext();
  if (!checked && !forceMount) return null;
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
 * Headless, accessible **Radio** — a standalone compound component built
 * on a native `<button role="radio">` that implements the single-selection
 * half of the
 * [WAI-ARIA Radio pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).
 * Zero styles ship.
 *
 * `Radio` is the lone control for when you own the grouping; for a managed
 * set with roving-tabindex keyboard navigation use `RadioGroup`.
 *
 * `Radio` is both callable (an alias of {@link RadioRoot | `Radio.Root`})
 * and carries its sub-components as static properties. Prefer the
 * namespaced form in application code for readability and grep-ability.
 *
 * - {@link RadioRoot | `Radio.Root`} — state owner, context provider, select button.
 * - {@link RadioIndicator | `Radio.Indicator`} — decorative dot, conditional on selected state.
 *
 * @example Minimal usage
 * ```tsx
 * import { Radio } from "@primitiv-ui/react";
 *
 * <Radio.Root aria-label="Compact">
 *   <Radio.Indicator />
 * </Radio.Root>;
 * ```
 *
 * @see {@link RadioRoot} for state modes and one-way selection semantics.
 * @see {@link RadioIndicator} for the mount gate and animation hooks.
 */
const RadioCompound: TRadioCompound = Object.assign(RadioRoot, {
  Root: RadioRoot,
  Indicator: RadioIndicator,
});

/** @internal */
RadioCompound.displayName = "Radio";

export { RadioCompound as Radio };
