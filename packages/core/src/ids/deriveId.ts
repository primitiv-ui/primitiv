/**
 * Builds a deterministic sub-id from a stable root id (typically the
 * value returned by React's `useId()`), a fixed role suffix, and a
 * per-item value. Used to wire `aria-controls`, `aria-labelledby`, and
 * matching DOM `id` attributes between paired sub-components such as
 * Tabs.Trigger ↔ Tabs.Content and Accordion.Trigger ↔ Accordion.Content
 * without each compound component re-deriving the same template literal.
 *
 * @example Inside a Tabs.Trigger
 * ```ts
 * const triggerId = deriveId(tabsId, "trigger", value);
 * const panelId = deriveId(tabsId, "panel", value);
 * ```
 *
 * @param rootId - The shared id for the compound component, normally
 *   from `useId()`. Any string is accepted, including React 18's
 *   colon-bracketed ids (`":r1:"`).
 * @param suffix - The role of the derived id within the compound,
 *   e.g. `"trigger"`, `"panel"`, `"heading"`.
 * @param value - The per-item discriminator (the value prop on the
 *   trigger / panel pair).
 *
 * @returns The concatenation `${rootId}-${suffix}-${value}`.
 */
export function deriveId(
  rootId: string,
  suffix: string,
  value: string,
): string {
  return `${rootId}-${suffix}-${value}`;
}
