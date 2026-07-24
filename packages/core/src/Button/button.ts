import type { ButtonRootAttributes, ButtonState, ButtonType } from "./types.ts";

/**
 * The `type` a Button falls back to when the consumer doesn't set one.
 *
 * Deliberately `"button"` rather than the DOM's own default of `"submit"`, so
 * a Button placed inside a `<form>` never triggers an accidental submit unless
 * asked to.
 */
export const BUTTON_DEFAULT_TYPE: ButtonType = "button";

/**
 * Derives the DOM attributes a Button root node carries, from the subset of its
 * props that actually determine something.
 *
 * This is the whole of Button's behaviour that is *not* about a particular
 * framework. An adapter's job around it is mechanical: forward the consumer's
 * remaining props verbatim, spread these attributes over them (so a derived
 * attribute always wins), and pick the host element.
 *
 * The three rules it encodes:
 * - `type` defaults to {@link BUTTON_DEFAULT_TYPE}, not the DOM's `"submit"`.
 * - `type` is withheld under `asChild` — the delegated element owns its own
 *   type semantics.
 * - `disabled` emits the native attribute **and** `data-disabled=""`, so CSS
 *   can target `[data-disabled]` without the `:disabled` pseudo-class. That
 *   pairing holds under `asChild` too, where the host element may have no
 *   `:disabled` state to match at all.
 *
 * @param state The deriving subset of Button's props. Every field is optional;
 *   `{}` yields a plain enabled button.
 * @returns A plain attribute map with absent — never `undefined` — keys for
 *   attributes that should not be rendered. See {@link ButtonRootAttributes}.
 *
 * @example React — spread over the forwarded props, then pick the element
 * ```tsx
 * const rootProps = { ...rest, ref, ...getButtonRootAttributes({ type, disabled, asChild }) };
 * return asChild
 *   ? <Slot {...rootProps}>{children}</Slot>
 *   : <button {...rootProps}>{children}</button>;
 * ```
 *
 * @example Vue — the same call, bound with `v-bind`
 * ```ts
 * const rootAttrs = computed(() => getButtonRootAttributes(props));
 * // <button v-bind="{ ...attrs, ...rootAttrs }"><slot /></button>
 * ```
 *
 * @example Svelte action — applied imperatively, which is why keys are omitted
 * ```ts
 * for (const [name, value] of Object.entries(getButtonRootAttributes(state))) {
 *   node.setAttribute(name, String(value));
 * }
 * ```
 */
export function getButtonRootAttributes(
  state: ButtonState,
): ButtonRootAttributes {
  return {
    ...(state.asChild ? {} : { type: state.type ?? BUTTON_DEFAULT_TYPE }),
    ...(state.disabled ? { disabled: true, "data-disabled": "" } : {}),
  };
}
