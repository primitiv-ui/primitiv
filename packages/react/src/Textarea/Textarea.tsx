import { useFieldProps } from "../Field/hooks";
import { Slot } from "../Slot";
import { TextareaProps } from "./types";

/**
 * A headless, accessible multi-line text input.
 *
 * Renders a native `<textarea>` and passes every standard textarea
 * attribute straight through to the DOM — `value` / `defaultValue`,
 * `rows`, `cols`, `placeholder`, `readOnly`, `required`, `name`,
 * `maxLength`, and so on. No styles ship with the component.
 *
 * **Labelling.** A `<textarea>` has no implicit accessible name. Pair it
 * with a `<label>` (`htmlFor` → the textarea's `id`), or pass `aria-label`
 * / `aria-labelledby` for the control to be announced correctly.
 *
 * **Field integration.** When rendered inside a `<Field.Root>`, Textarea
 * opts into `FieldContext` and inherits `id`, `aria-describedby`,
 * `aria-invalid`, `disabled`, and `required` from the field. Any prop
 * the consumer passes wins; `aria-describedby` is composed (consumer
 * ids first, then field-supplied description / error ids). Outside a
 * `<Field.Root>`, behaviour is unchanged.
 *
 * **Ref forwarding.** Pass a `ref` prop to access the underlying
 * `HTMLTextAreaElement` directly:
 *
 * ```tsx
 * const ref = useRef<HTMLTextAreaElement>(null);
 * <Textarea ref={ref} aria-label="Bio" />
 * ```
 *
 * **Disabled.** Sets native `disabled` (removing the field from the tab
 * order and blocking input) plus `data-disabled=""` so CSS can target
 * `[data-disabled]` without relying on the `:disabled` pseudo-class:
 *
 * ```css
 * textarea[data-disabled] { opacity: 0.5; cursor: not-allowed; }
 * ```
 *
 * **`asChild` composition.** Renders the consumer's element instead of
 * `<textarea>`, merging all props (aria-*, data-*, event handlers, ref)
 * via the {@link Slot} utility. Use it to wrap an autosizing textarea
 * implementation while keeping this component's prop contract.
 *
 * @example Basic usage
 * ```tsx
 * <label htmlFor="bio">Bio</label>
 * <Textarea id="bio" rows={4} placeholder="Tell us about yourself" />
 * ```
 *
 * @example Inside a Field — id and aria wired automatically
 * ```tsx
 * <Field.Root invalid={!!errors.bio}>
 *   <Field.Label>Bio</Field.Label>
 *   <Textarea rows={4} {...register("bio")} />
 *   <Field.ErrorText>{errors.bio?.message}</Field.ErrorText>
 * </Field.Root>
 * ```
 *
 * @example Disabled
 * ```tsx
 * <Textarea aria-label="Bio" disabled />
 * ```
 *
 * @example asChild — wrap an autosizing textarea
 * ```tsx
 * <Textarea asChild aria-label="Bio">
 *   <AutosizeTextarea />
 * </Textarea>
 * ```
 */
export function Textarea({
  asChild = false,
  children,
  ref,
  ...consumer
}: TextareaProps) {
  const merged = useFieldProps(consumer);

  const rootProps = {
    ...merged,
    ref,
    "data-disabled": merged.disabled ? "" : undefined,
  };

  if (asChild) {
    return <Slot {...rootProps}>{children}</Slot>;
  }

  return <textarea {...rootProps} />;
}

Textarea.displayName = "Textarea";
