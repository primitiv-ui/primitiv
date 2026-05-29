/**
 * Pure data describing every variable in the unified `Intent` collection
 * per RFC 0001 §4 and RFC 0002 §3.
 *
 * The collection has two modes — Light and Dark — each aliasing into
 * `Primitives / Palette`. Because `Primitives / Palette` itself carries
 * Light and Dark modes (with the dark neutral ramp anchored on inverted
 * white/black), the alias targets are identical across both modes for most
 * tokens: the palette modes handle the colour inversion automatically.
 *
 * `darkAliasTo` is only specified when the dark mode genuinely needs a
 * different palette step (e.g. a foreground that must invert).
 */

export type IntentVariableSpec = {
  name: string
  type: 'COLOR'
  aliasTo: string
  darkAliasTo?: string
}

export const INTENT_SPEC: {
  collection: string
  legacyCollection: string
  aliasCollection: string
  lightModeName: string
  darkModeName: string
  variables: IntentVariableSpec[]
} = {
  collection: 'Intent',
  legacyCollection: 'Intent / Light',
  aliasCollection: 'Primitives / Palette',
  lightModeName: 'Light',
  darkModeName: 'Dark',
  variables: [
    // action.primary
    { name: 'action/primary/default',           type: 'COLOR', aliasTo: 'color/brand/500' },
    { name: 'action/primary/hover',             type: 'COLOR', aliasTo: 'color/brand/600' },
    { name: 'action/primary/active',            type: 'COLOR', aliasTo: 'color/brand/700' },
    { name: 'action/primary/disabled',          type: 'COLOR', aliasTo: 'color/brand/200' },
    { name: 'action/primary/foreground/default', type: 'COLOR', aliasTo: 'color/neutral/50' },
    { name: 'action/primary/foreground/disabled', type: 'COLOR', aliasTo: 'color/neutral/400' },
    { name: 'action/primary/border/default',    type: 'COLOR', aliasTo: 'color/brand/500' },
    { name: 'action/primary/border/hover',      type: 'COLOR', aliasTo: 'color/brand/600' },
    { name: 'action/primary/border/active',     type: 'COLOR', aliasTo: 'color/brand/700' },
    { name: 'action/primary/border/disabled',   type: 'COLOR', aliasTo: 'color/brand/200' },

    // action.secondary
    { name: 'action/secondary/default',          type: 'COLOR', aliasTo: 'color/neutral/100' },
    { name: 'action/secondary/hover',            type: 'COLOR', aliasTo: 'color/neutral/200' },
    { name: 'action/secondary/active',           type: 'COLOR', aliasTo: 'color/neutral/300' },
    { name: 'action/secondary/disabled',         type: 'COLOR', aliasTo: 'color/neutral/50' },
    { name: 'action/secondary/foreground/default', type: 'COLOR', aliasTo: 'color/neutral/900' },
    { name: 'action/secondary/foreground/disabled', type: 'COLOR', aliasTo: 'color/neutral/400' },
    { name: 'action/secondary/border/default',   type: 'COLOR', aliasTo: 'color/neutral/300' },
    { name: 'action/secondary/border/hover',     type: 'COLOR', aliasTo: 'color/neutral/400' },
    { name: 'action/secondary/border/active',    type: 'COLOR', aliasTo: 'color/neutral/500' },
    { name: 'action/secondary/border/disabled',  type: 'COLOR', aliasTo: 'color/neutral/200' },

    // action.danger
    { name: 'action/danger/default',             type: 'COLOR', aliasTo: 'color/danger/500' },
    { name: 'action/danger/hover',               type: 'COLOR', aliasTo: 'color/danger/600' },
    { name: 'action/danger/active',              type: 'COLOR', aliasTo: 'color/danger/700' },
    { name: 'action/danger/disabled',            type: 'COLOR', aliasTo: 'color/danger/200' },
    { name: 'action/danger/foreground/default',  type: 'COLOR', aliasTo: 'color/neutral/50' },
    { name: 'action/danger/foreground/disabled', type: 'COLOR', aliasTo: 'color/neutral/400' },
    { name: 'action/danger/border/default',      type: 'COLOR', aliasTo: 'color/danger/500' },
    { name: 'action/danger/border/hover',        type: 'COLOR', aliasTo: 'color/danger/600' },
    { name: 'action/danger/border/active',       type: 'COLOR', aliasTo: 'color/danger/700' },
    { name: 'action/danger/border/disabled',     type: 'COLOR', aliasTo: 'color/danger/200' },

    // surface
    { name: 'surface/default',  type: 'COLOR', aliasTo: 'color/neutral/50' },
    { name: 'surface/subtle',   type: 'COLOR', aliasTo: 'color/neutral/100' },
    { name: 'surface/raised',   type: 'COLOR', aliasTo: 'color/neutral/50' },
    { name: 'surface/overlay',  type: 'COLOR', aliasTo: 'color/neutral/900' },
    { name: 'surface/inverse',  type: 'COLOR', aliasTo: 'color/neutral/800' },

    // content
    { name: 'content/primary',   type: 'COLOR', aliasTo: 'color/neutral/900' },
    { name: 'content/secondary', type: 'COLOR', aliasTo: 'color/neutral/700' },
    { name: 'content/muted',     type: 'COLOR', aliasTo: 'color/neutral/500' },
    { name: 'content/disabled',  type: 'COLOR', aliasTo: 'color/neutral/400' },
    { name: 'content/inverse',   type: 'COLOR', aliasTo: 'color/neutral/50' },
    { name: 'content/on-action', type: 'COLOR', aliasTo: 'color/neutral/50' },

    // border
    { name: 'border/subtle',  type: 'COLOR', aliasTo: 'color/neutral/200' },
    { name: 'border/default', type: 'COLOR', aliasTo: 'color/neutral/300' },
    { name: 'border/strong',  type: 'COLOR', aliasTo: 'color/neutral/500' },
    { name: 'border/focus',   type: 'COLOR', aliasTo: 'color/brand/500' },

    // focus
    { name: 'focus/ring', type: 'COLOR', aliasTo: 'color/brand/500' },
  ],
}
