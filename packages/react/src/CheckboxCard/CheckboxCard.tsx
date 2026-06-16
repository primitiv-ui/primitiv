import { useMemo } from "react";
import type { ReactElement } from "react";

import { Slot, composeEventHandlers } from "../Slot/index.ts";

import { CheckboxCardContext } from "./CheckboxCardContext";
import { useCheckboxCardContext, useCheckboxCardRoot } from "./hooks/index.ts";
import { CheckboxCardIndicatorProps, CheckboxCardRootProps } from "./types";
import type { CheckedState } from "../Checkbox/types";

function dataStateOf(checked: CheckedState) {
  if (checked === "indeterminate") return "indeterminate" as const;
  return checked ? ("checked" as const) : ("unchecked" as const);
}

/**
 * The root of a CheckboxCard — a native `<button role="checkbox">` whose
 * entire card surface is the interactive area. Owns the tri-state checked
 * value and provides {@link CheckboxCardContext | `CheckboxCardContext`} to
 * descendant {@link CheckboxCardIndicator | `CheckboxCard.Indicator`}s.
 *
 * Supports two state modes, statically discriminated at the type level:
 *
 * - **Uncontrolled** — pass
 *   {@link CheckboxCardRootProps.defaultChecked | `defaultChecked`} (or omit
 *   for unchecked-on-mount). The component owns the value internally.
 * - **Controlled** — pass
 *   {@link CheckboxCardRootProps.checked | `checked`} *and*
 *   {@link CheckboxCardRootProps.onCheckedChange | `onCheckedChange`}
 *   together. The parent owns the value.
 *
 * Both `checked` and `defaultChecked` accept `boolean | "indeterminate"`.
 * Clicking an indeterminate card resolves it to `true` per the WAI-ARIA
 * tri-state convention, then flips boolean on subsequent clicks.
 *
 * **ARIA.** `role="checkbox"` and `aria-checked` are set automatically;
 * `aria-checked="mixed"` represents the indeterminate state.
 *
 * **Styling hooks.** `data-state="checked" | "unchecked" | "indeterminate"`
 * on the root, plus `data-disabled=""` when disabled.
 *
 * **`asChild` prop.** Pass `asChild` to render any consumer-supplied element
 * with the checkbox's ARIA attributes, data-state, composed onClick, and ref
 * merged in.
 *
 * @example Uncontrolled
 * ```tsx
 * <CheckboxCard.Root defaultChecked aria-label="Enable feature">
 *   <CheckboxCard.Indicator>
 *     <CheckIcon />
 *   </CheckboxCard.Indicator>
 *   <h3>Feature name</h3>
 *   <p>Feature description</p>
 * </CheckboxCard.Root>
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [enabled, setEnabled] = useState<CheckedState>(false);
 *
 * <CheckboxCard.Root checked={enabled} onCheckedChange={setEnabled} aria-label="…">
 *   <CheckboxCard.Indicator />
 *   Feature name
 * </CheckboxCard.Root>
 * ```
 */
export function CheckboxCardRoot(props: CheckboxCardRootProps): ReactElement {
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
  const { checked: isChecked, toggle } = useCheckboxCardRoot({
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
    <CheckboxCardContext.Provider value={contextValue}>
      {asChild ? (
        <Slot {...rootProps}>{children}</Slot>
      ) : (
        <button type="button" {...rootProps}>
          {children}
        </button>
      )}
    </CheckboxCardContext.Provider>
  );
}

/** @internal */
CheckboxCardRoot.displayName = "CheckboxCardRoot";

/**
 * A decorative `<span aria-hidden="true">` that renders its children only
 * while the parent {@link CheckboxCardRoot | `CheckboxCard.Root`} is
 * **checked** or **indeterminate** — never when unchecked. The checkbox's
 * accessible state is already conveyed by `aria-checked` on the root, so
 * the indicator is purely visual.
 *
 * **Styling hook.** Mirrors the root's
 * `data-state="checked" | "unchecked" | "indeterminate"`.
 *
 * **`asChild` prop.** Pass `asChild` to render the consumer's own element
 * (typically an `<svg>` tick icon) as the indicator itself.
 *
 * **`forceMount` prop.** Pass `forceMount` to keep the indicator in the DOM
 * while unchecked so a CSS exit animation can play against
 * `data-state="unchecked"`.
 *
 * @example
 * ```tsx
 * <CheckboxCard.Indicator>
 *   <CheckIcon />
 * </CheckboxCard.Indicator>
 * ```
 *
 * @throws if rendered outside a `CheckboxCard.Root`.
 */
export function CheckboxCardIndicator({
  children,
  forceMount,
  asChild = false,
  ...rest
}: CheckboxCardIndicatorProps): ReactElement | null {
  const { checked } = useCheckboxCardContext();
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

/** @internal */
CheckboxCardIndicator.displayName = "CheckboxCardIndicator";

/** Type of the {@link CheckboxCard} compound: the callable `CheckboxCard.Root`
 * component augmented with its sub-components as static properties. */
export type TCheckboxCardCompound = typeof CheckboxCardRoot & {
  Root: typeof CheckboxCardRoot;
  Indicator: typeof CheckboxCardIndicator;
};

/**
 * Headless, accessible **CheckboxCard** — a card/tile-shaped checkbox
 * implementing the
 * [WAI-ARIA Checkbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/)
 * including the tri-state ("mixed") variant. The entire card surface is the
 * interactive element. Zero styles ship.
 *
 * `CheckboxCard` is both callable (an alias of
 * {@link CheckboxCardRoot | `CheckboxCard.Root`}) and carries its
 * sub-components as static properties.
 *
 * - {@link CheckboxCardRoot | `CheckboxCard.Root`} — state owner, context
 *   provider, toggle button.
 * - {@link CheckboxCardIndicator | `CheckboxCard.Indicator`} — decorative
 *   tick, conditional on checked state.
 *
 * @example Minimal usage
 * ```tsx
 * import { CheckboxCard } from "@primitiv-ui/react";
 *
 * <CheckboxCard.Root aria-label="Enable feature">
 *   <CheckboxCard.Indicator>
 *     <CheckIcon />
 *   </CheckboxCard.Indicator>
 *   <h3>Feature name</h3>
 *   <p>Enable this to unlock advanced capabilities.</p>
 * </CheckboxCard.Root>
 * ```
 *
 * @see {@link CheckboxCardRoot} for state modes and tri-state semantics.
 * @see {@link CheckboxCardIndicator} for the mount gate and animation hooks.
 */
const CheckboxCardCompound: TCheckboxCardCompound = Object.assign(
  CheckboxCardRoot,
  {
    Root: CheckboxCardRoot,
    Indicator: CheckboxCardIndicator,
  },
);

CheckboxCardCompound.displayName = "CheckboxCard";

export { CheckboxCardCompound as CheckboxCard };
