import type { ReactElement } from "react";

import { useFieldProps } from "../Field/hooks/index.ts";
import { Slot } from "../Slot/index.ts";
import { InputProps } from "./types";

/**
 * A headless, accessible single-line text input. Renders a native
 * `<input>` element and passes every standard attribute straight through
 * to the DOM. No styles ship with the component.
 *
 * **Default type.** `type="text"` is set by default. Override with the
 * `type` prop for any native variant (`"email"`, `"password"`,
 * `"number"`, `"search"`, `"tel"`, `"url"`, `"date"`, …). Future
 * composite primitives (`PasswordInput`, `NumberInput`, `DatePicker`)
 * will layer richer interaction on top of those types.
 *
 * **Labelling.** An `<input>` has no implicit accessible name. Pair it
 * with a `<label>` (`htmlFor` → the input's `id`), or pass `aria-label`
 * / `aria-labelledby` for the control to be announced correctly.
 *
 * **Native validation.** All HTML constraint-validation attributes
 * (`required`, `pattern`, `min`, `max`, `minLength`, `maxLength`,
 * `type="email"` / `"url"` / `"number"`) work as the browser intends —
 * the component does not interfere. CSS can target `input:invalid`
 * directly; for assistive technology, set `aria-invalid` explicitly
 * based on your validation state.
 *
 * **Form library compatibility.** `ref`, `name`, `onChange`, and
 * `onBlur` all pass through, so the spread pattern used by
 * react-hook-form's `register("field")` and similar libraries works
 * directly:
 *
 * ```tsx
 * <Input {...register("email")} type="email" required />
 * ```
 *
 * **Field integration.** When rendered inside a `<Field.Root>`, Input
 * opts into `FieldContext` and inherits `id`, `aria-describedby`,
 * `aria-invalid`, `disabled`, and `required` from the field. Any prop
 * the consumer passes wins; `aria-describedby` is composed (consumer
 * ids first, then field-supplied description / error ids). Outside a
 * `<Field.Root>`, behaviour is unchanged.
 *
 * **Styling hooks.**
 * - `data-disabled=""` — present when `disabled` is `true`; absent
 *   otherwise. Lets CSS target `[data-disabled]` without depending on
 *   the `:disabled` pseudo-class.
 *
 * **Ref forwarding.** Pass a `ref` prop to access the underlying
 * `HTMLInputElement`:
 *
 * ```tsx
 * const ref = useRef<HTMLInputElement>(null);
 * <Input ref={ref} aria-label="Email" />
 * ```
 *
 * **Disabled.** Sets native `disabled` (removing the field from the tab
 * order and blocking input) plus `data-disabled=""` so CSS can target
 * `[data-disabled]` without relying on the `:disabled` pseudo-class:
 *
 * ```css
 * input[data-disabled] { opacity: 0.5; cursor: not-allowed; }
 * ```
 *
 * **`asChild` composition.** Renders the consumer's element instead of
 * `<input>`, merging all props (`aria-*`, `data-*`, event handlers,
 * `ref`) via the {@link Slot} utility. Event handlers compose with the
 * child's own handlers (child runs first). `type` is **not** forwarded
 * in this mode — the child element owns its own type semantics.
 *
 * **Adornments** live in the separate `InputGroup` primitive — leading
 * / trailing icons, currency symbols, clear buttons, password-reveal
 * toggles.
 *
 * @extends HTMLInputElement
 *
 * @example Basic usage
 * ```tsx
 * <label htmlFor="email">Email</label>
 * <Input id="email" type="email" required />
 * ```
 *
 * @example Inside a Field — id, aria-*, disabled, required all wired automatically
 * ```tsx
 * <Field.Root invalid={!!errors.email}>
 *   <Field.Label>Email</Field.Label>
 *   <Input type="email" {...register("email")} />
 *   <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
 * </Field.Root>
 * ```
 *
 * @example Disabled
 * ```tsx
 * <Input aria-label="Email" disabled />
 * ```
 *
 * @example asChild — wrap a custom input variant
 * ```tsx
 * <Input asChild aria-label="Email">
 *   <MaskedInput mask="email" />
 * </Input>
 * ```
 */
export function Input({
  asChild = false,
  type = "text",
  children,
  ref,
  ...consumer
}: InputProps): ReactElement {
  const merged = useFieldProps(consumer);

  const rootProps = {
    ...merged,
    ref,
    "data-disabled": merged.disabled ? "" : undefined,
  };

  if (asChild) {
    return <Slot {...rootProps}>{children}</Slot>;
  }

  return <input type={type} {...rootProps} />;
}

/** @internal */
Input.displayName = "Input";
