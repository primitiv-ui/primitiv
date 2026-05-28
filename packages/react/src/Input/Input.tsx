import { Slot } from "../Slot";
import { InputProps } from "./types";

/**
 * A headless, accessible single-line text input.
 *
 * Renders a native `<input>` and passes every standard input attribute
 * straight through to the DOM — `value` / `defaultValue`, `placeholder`,
 * `type`, `name`, `required`, `pattern`, `min`, `max`, `step`,
 * `maxLength`, and so on. No styles ship with the component.
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
 * `<input>`, merging all props (aria-*, data-*, event handlers, ref)
 * via the {@link Slot} utility. `type` is **not** forwarded in this
 * mode — the child element owns its own type semantics.
 *
 * **Adornments and label / error wiring** are not part of `Input`
 * itself. Adornments (leading / trailing icons, currency symbols, clear
 * buttons) will land in a separate `InputGroup` primitive; label,
 * description, and error-text coordination will land in `Field`. Until
 * those ship, wire `aria-describedby` and `aria-invalid` manually.
 *
 * @example Basic usage
 * ```tsx
 * <label htmlFor="email">Email</label>
 * <Input id="email" type="email" required />
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
  disabled,
  children,
  ref,
  ...rest
}: InputProps) {
  const rootProps = {
    ...rest,
    ref,
    disabled,
    "data-disabled": disabled ? "" : undefined,
  };

  if (asChild) {
    return <Slot {...rootProps}>{children}</Slot>;
  }

  return <input type={type} {...rootProps} />;
}

Input.displayName = "Input";
