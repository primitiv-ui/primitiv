import type { ReactElement } from "react";

import { FieldsetLegendProps, FieldsetProps } from "./types";

/**
 * The root of a Fieldset — renders a native `<fieldset>` element.
 *
 * A `<fieldset>` carries an implicit `role="group"` and groups a set of
 * related form controls (radios, checkboxes, inputs). Pair it with a
 * {@link FieldsetLegend} so the group is announced with an accessible
 * name when the user enters any control inside it.
 *
 * **Disabled.** Setting `disabled` forwards the native attribute, which
 * disables *every* form control nested inside the fieldset at once — the
 * standard way to disable a whole section of a form. It also sets
 * `data-disabled=""` so CSS can target the state without the `:disabled`
 * pseudo-class:
 *
 * ```css
 * fieldset[data-disabled] { opacity: 0.5; }
 * ```
 *
 * @example
 * ```tsx
 * <Fieldset.Root>
 *   <Fieldset.Legend>Notifications</Fieldset.Legend>
 *   <label><input type="checkbox" name="email" /> Email</label>
 *   <label><input type="checkbox" name="sms" /> SMS</label>
 * </Fieldset.Root>
 * ```
 */
export function FieldsetRoot({
  disabled,
  children,
  ...rest
}: FieldsetProps): ReactElement {
  return (
    <fieldset
      {...rest}
      disabled={disabled}
      data-disabled={disabled ? "" : undefined}
    >
      {children}
    </fieldset>
  );
}

/** @internal */
FieldsetRoot.displayName = "Fieldset";

/**
 * The caption for a {@link Fieldset} — renders a native `<legend>`.
 *
 * The `<legend>` must be the first child of the `<fieldset>`. It supplies
 * the group's accessible name, so assistive technology announces it when
 * the user moves focus into any control within the group.
 *
 * @example
 * ```tsx
 * <Fieldset.Legend>Shipping address</Fieldset.Legend>
 * ```
 */
export function FieldsetLegend({
  children,
  ...rest
}: FieldsetLegendProps): ReactElement {
  return <legend {...rest}>{children}</legend>;
}

/** @internal */
FieldsetLegend.displayName = "FieldsetLegend";

/**
 * The shape of the exported `Fieldset` value — callable as
 * `Fieldset.Root` and carrying `Root` and `Legend` as static properties.
 */
export type FieldsetCompound = typeof FieldsetRoot & {
  Root: typeof FieldsetRoot;
  Legend: typeof FieldsetLegend;
};

/**
 * Headless, accessible **Fieldset** — a stateless compound component that
 * groups related form controls, with zero styles.
 *
 * `Fieldset` is both callable (an alias of {@link Fieldset | `Fieldset.Root`})
 * and carries its sub-component as a static property. Prefer the
 * namespaced form in application code:
 *
 * - {@link Fieldset | `Fieldset.Root`} — `<fieldset>`, implicit `role="group"`.
 * - {@link FieldsetLegend | `Fieldset.Legend`} — `<legend>`, the group's accessible name.
 *
 * @example Grouping a set of radios
 * ```tsx
 * import { Fieldset } from "@primitiv-ui/react";
 *
 * <Fieldset.Root>
 *   <Fieldset.Legend>Plan</Fieldset.Legend>
 *   <label><input type="radio" name="plan" value="free" /> Free</label>
 *   <label><input type="radio" name="plan" value="pro" /> Pro</label>
 * </Fieldset.Root>
 * ```
 *
 * @example Disabling a whole section
 * ```tsx
 * <Fieldset.Root disabled>
 *   <Fieldset.Legend>Billing</Fieldset.Legend>
 *   …every nested control is disabled…
 * </Fieldset.Root>
 * ```
 */
const FieldsetCompound: FieldsetCompound = Object.assign(FieldsetRoot, {
  Root: FieldsetRoot,
  Legend: FieldsetLegend,
});

/** @internal */
FieldsetCompound.displayName = "Fieldset";

export { FieldsetCompound as Fieldset };
