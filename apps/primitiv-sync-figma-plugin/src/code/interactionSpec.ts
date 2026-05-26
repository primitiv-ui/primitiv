/**
 * Pure data describing every Figma variable the Bootstrap interaction
 * action creates per RFC 0001 §8.
 *
 * Five FLOAT variables, each an alias into Primitives:
 *   hover/opacity         → opacity/90        (≈ 0.90)
 *   active/opacity        → opacity/80        (≈ 0.80)
 *   disabled/opacity      → opacity/40        (≈ 0.40)
 *   focus/ring/width      → border-width/2    (2)
 *   focus/ring/offset     → border-width/2    (2)
 *
 * Slash-separated names map to DTCG nesting on export — the values land at
 * `semantic.interaction.{hover,active,disabled}.opacity` and
 * `semantic.interaction.focus.ring.{width,offset}`.
 */

export type InteractionVariableSpec = {
  name: string
  type: 'FLOAT'
  aliasTo: string
}

export const INTERACTION_SPEC: { variables: InteractionVariableSpec[] } = {
  variables: [
    { name: 'hover/opacity', type: 'FLOAT', aliasTo: 'opacity/90' },
    { name: 'active/opacity', type: 'FLOAT', aliasTo: 'opacity/80' },
    { name: 'disabled/opacity', type: 'FLOAT', aliasTo: 'opacity/40' },
    { name: 'focus/ring/width', type: 'FLOAT', aliasTo: 'border-width/2' },
    { name: 'focus/ring/offset', type: 'FLOAT', aliasTo: 'border-width/2' },
  ],
}
