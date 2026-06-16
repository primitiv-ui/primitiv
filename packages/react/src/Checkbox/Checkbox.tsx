import { useMemo } from "react";

import { Slot, composeEventHandlers } from "../Slot/index.ts";

import { CheckboxContext } from "./CheckboxContext";
import { useCheckboxContext, useCheckboxRoot } from "./hooks/index.ts";
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
 * The root of a Checkbox — a native `<button role="checkbox">` that
 * owns the tri-state checked value and provides
 * {@link CheckboxContext | `CheckboxContext`} to descendant
 * {@link CheckboxIndicator | `Checkbox.Indicator`}s.
 *
 * Supports two state modes, statically discriminated at the type level:
 *
 * - **Uncontrolled** — pass
 *   {@link CheckboxRootProps.defaultChecked | `defaultChecked`} (or omit
 *   for unchecked-on-mount). The component owns the value internally.
 * - **Controlled** — pass
 *   {@link CheckboxRootProps.checked | `checked`} *and*
 *   {@link CheckboxRootProps.onCheckedChange | `onCheckedChange`}
 *   together. The parent owns the value; the component defers every
 *   change back through the callback.
 *
 * Both `checked` and `defaultChecked` accept `boolean | "indeterminate"`.
 * Clicking an indeterminate checkbox resolves it to `true` per the
 * WAI-ARIA tri-state convention, then flips boolean on subsequent clicks.
 *
 * **ARIA.** `role="checkbox"` and `aria-checked` are set automatically;
 * `aria-checked="mixed"` represents the indeterminate state.
 *
 * **Styling hooks.** `data-state="checked" | "unchecked" | "indeterminate"`
 * on the root, plus `data-disabled=""` when disabled.
 *
 * **`asChild` prop.** Pass `asChild` to render any consumer-supplied
 * element (e.g. `<li role="menuitemcheckbox">` for menu composition)
 * with the checkbox's ARIA attributes, data-state, composed onClick, and
 * ref merged in. The native `<button>` is dropped; consumers who want
 * keyboard activation on a non-button element are responsible for
 * providing it.
 *
 * @example Uncontrolled
 * ```tsx
 * <Checkbox.Root defaultChecked aria-label="Accept terms">
 *   <Checkbox.Indicator>
 *     <CheckIcon />
 *   </Checkbox.Indicator>
 * </Checkbox.Root>
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [checked, setChecked] = useState<CheckedState>(false);
 *
 * <Checkbox.Root checked={checked} onCheckedChange={setChecked} aria-label="…">
 *   <Checkbox.Indicator>
 *     <CheckIcon />
 *   </Checkbox.Indicator>
 * </Checkbox.Root>
 * ```
 *
 * @example Composed into a menu item via `asChild`
 * ```tsx
 * <Checkbox.Root asChild aria-label="Show hidden files">
 *   <li role="menuitemcheckbox">Show hidden files</li>
 * </Checkbox.Root>
 * ```
 */
function CheckboxRoot(props: CheckboxRootProps) {
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
  const { checked: isChecked, toggle } = useCheckboxRoot({
    defaultChecked,
    checked,
    onCheckedChange,
  });
  const contextValue = useMemo(() => ({ checked: isChecked }), [isChecked]);
  const rootProps = {
    ...rest,
    role: "checkbox" as const,
    "aria-checked":
      isChecked === "indeterminate"
        ? ("mixed" as const)
        : (isChecked as boolean),
    "data-state": dataStateOf(isChecked),
    "data-disabled": disabled ? "" : undefined,
    disabled,
    onClick: composeEventHandlers(onClick, toggle),
  };
  return (
    <CheckboxContext.Provider value={contextValue}>
      {asChild ? (
        <Slot {...rootProps}>{children}</Slot>
      ) : (
        <button type="button" {...rootProps}>
          {children}
        </button>
      )}
    </CheckboxContext.Provider>
  );
}

CheckboxRoot.displayName = "CheckboxRoot";

/**
 * A decorative `<span aria-hidden="true">` that renders its children
 * only while the parent {@link CheckboxRoot | `Checkbox.Root`} is
 * **checked** or **indeterminate** — never when unchecked. The
 * checkbox's accessible state is already conveyed by `aria-checked`
 * on the root, so the indicator is purely visual.
 *
 * **Styling hook.** Mirrors the root's
 * `data-state="checked" | "unchecked" | "indeterminate"` so the same
 * CSS rules can target both.
 *
 * **`asChild` prop.** Pass `asChild` to render the consumer's own
 * element (typically an `<svg>` tick icon) as the indicator itself,
 * with `aria-hidden` and `data-state` merged onto that element rather
 * than a wrapper.
 *
 * **`forceMount` prop.** Pass `forceMount` to keep the indicator in
 * the DOM while unchecked so a CSS exit animation can play against
 * `data-state="unchecked"`. Consumers who use `forceMount` own the
 * exit lifecycle themselves.
 *
 * @example Default span wrapper
 * ```tsx
 * <Checkbox.Indicator>
 *   <CheckIcon />
 * </Checkbox.Indicator>
 * ```
 *
 * @example Icon as the indicator via `asChild`
 * ```tsx
 * <Checkbox.Indicator asChild>
 *   <svg viewBox="0 0 10 10"><path d="M1 5l3 3 5-7" /></svg>
 * </Checkbox.Indicator>
 * ```
 *
 * @example Force-mounted for exit animation
 * ```tsx
 * <Checkbox.Indicator forceMount>
 *   <CheckIcon />
 * </Checkbox.Indicator>
 * ```
 *
 * @throws if rendered outside a `Checkbox.Root`.
 */
function CheckboxIndicator({
  children,
  forceMount,
  asChild = false,
  ...rest
}: CheckboxIndicatorProps) {
  const { checked } = useCheckboxContext();
  const isVisible = checked !== false;
  if (!isVisible && !forceMount) return null;
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

CheckboxIndicator.displayName = "CheckboxIndicator";

type TCheckboxCompound = typeof CheckboxRoot & {
  Root: typeof CheckboxRoot;
  Indicator: typeof CheckboxIndicator;
};

/**
 * Headless, accessible **Checkbox** — a compound component built on a
 * native `<button role="checkbox">` that implements the
 * [WAI-ARIA Checkbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/)
 * including the tri-state ("mixed") variant. Zero styles ship.
 *
 * `Checkbox` is both callable (an alias of {@link CheckboxRoot | `Checkbox.Root`})
 * and carries its sub-components as static properties. Prefer the
 * namespaced form in application code for readability and grep-ability.
 *
 * - {@link CheckboxRoot | `Checkbox.Root`} — state owner, context provider, toggle button.
 * - {@link CheckboxIndicator | `Checkbox.Indicator`} — decorative tick, conditional on checked state.
 *
 * @example Minimal usage
 * ```tsx
 * import { Checkbox } from "@primitiv-ui/react";
 *
 * <Checkbox.Root aria-label="Accept terms">
 *   <Checkbox.Indicator>
 *     <CheckIcon />
 *   </Checkbox.Indicator>
 * </Checkbox.Root>;
 * ```
 *
 * @see {@link CheckboxRoot} for state modes and tri-state semantics.
 * @see {@link CheckboxIndicator} for the mount gate and animation hooks.
 */
const CheckboxCompound: TCheckboxCompound = Object.assign(CheckboxRoot, {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
});

CheckboxCompound.displayName = "Checkbox";

export { CheckboxCompound as Checkbox };
