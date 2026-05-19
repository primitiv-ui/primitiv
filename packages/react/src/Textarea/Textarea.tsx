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
  disabled,
  children,
  ref,
  ...rest
}: TextareaProps) {
  const rootProps = {
    ...rest,
    ref,
    disabled,
    "data-disabled": disabled ? "" : undefined,
  };

  if (asChild) {
    return <Slot {...rootProps}>{children}</Slot>;
  }

  return <textarea {...rootProps} />;
}

Textarea.displayName = "Textarea";
