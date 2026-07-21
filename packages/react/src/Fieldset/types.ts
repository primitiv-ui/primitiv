import { ComponentProps } from "react";

/**
 * Props for {@link FieldsetRoot | `Fieldset.Root`} — all native `<fieldset>`
 * attributes plus the `data-disabled` styling hook.
 *
 * No custom props narrow any native attribute, so the full `ComponentProps<"fieldset">`
 * surface is passed through unchanged, including `ref` (forwarded to the
 * underlying `HTMLFieldSetElement`).
 *
 * The one behaviour addition over a bare `<fieldset>` is `data-disabled=""`:
 * when `disabled` is truthy the component sets this attribute alongside the
 * native `disabled`, so CSS can target `[data-disabled]` without relying on
 * the `:disabled` pseudo-class.
 */
export type FieldsetProps = ComponentProps<"fieldset">;

/**
 * Props for {@link FieldsetLegend | `Fieldset.Legend`} — all native `<legend>`
 * attributes, including `ref` (forwarded to the underlying `HTMLLegendElement`).
 *
 * `<legend>` has no interactive state, so no additional `data-*` attributes
 * are emitted beyond what is passed explicitly by the consumer.
 */
export type FieldsetLegendProps = ComponentProps<"legend">;
