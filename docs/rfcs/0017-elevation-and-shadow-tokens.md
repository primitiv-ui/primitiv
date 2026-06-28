# RFC 0017 — Elevation & shadow tokens

> **Status:** **Landed (2026-06-28).** Web side merged (#218); Figma variables +
> effect styles built and applied to Button + Switch this session. Remaining
> §7 work (Modal, Dropdown, and future overlay/floating consumers) is tracked in
> `docs/transfer-and-next-steps.md`. Designed in the 2026-06-27 elevation
> discussion, following the motion (duration/easing) token work.
>
> **Author:** simonrevill, with architectural design
> **Date:** 2026-06-27
> **Builds on:** RFC 0006 (token & style pipeline — the DTCG → CSS emitter this
> extends with a `shadow` composite) §4; RFC 0008 (CSS architecture — the
> `--primitiv-*` custom-property API and the `@layer` stack the tokens emit
> into); RFC 0009 (mode scoping — elevation is a **single shared scale** for v1,
> mode-independent like motion, §6). Mirrors the **motion** token model
> (`packages/tokens/src/motion.json`): a primitive tier + a semantic tier, both
> emitted.
> **Skills:** `figma-token-sync` (the sync plugin + DTCG routing), `figma-variable-architecture`
> (collections, the Interaction-collection precedent), `registry-stylesheet-conventions`
> (no-magic-numbers), `rust-cli-test-conventions` (the emitter's TDD seam).

---

## 0. Summary

Primitiv has tokens for colour, type, space, radius, motion — but **no
elevation**. Shadows are currently hand-rolled per component (the focus ring is
the only `box-shadow` in the system, and it is a state affordance, not
elevation). This RFC adds a first-class **elevation** system: a small,
multi-layered shadow scale built with the **smoothshadows.com methodology**
(stacked layers along one light direction for a soft, natural penumbra),
expressed as DTCG `shadow` composites, emitted into the base token CSS,
mirrored as Figma variables + effect styles, and adopted by the components that
benefit.

The system is **two-tier**, exactly like motion:

| Tier | Namespace | Role | Motion analogue |
|---|---|---|---|
| **Primitive** | `shadow.*` | The raw layered box-shadows + the shared shadow colours. The building blocks. | `duration.*`, `easing.*` |
| **Semantic** | `elevation.*` | Role-named by **position in the UI's depth hierarchy**. The framework consumers apply. | `motion.duration.*`, `motion.easing.*` |

Both tiers are emitted (`--primitiv-shadow-*` **and** `--primitiv-elevation-*`),
for completeness and parity with motion.

## 1. The depth hierarchy (the semantic framework)

The point of the semantic tier is that a consumer never picks a blur radius —
they pick **what the thing is, in the stacking order**. Read top-to-bottom as
ascending depth:

| Role token | Meaning in the hierarchy | Raw rung | Who uses it |
|---|---|---|---|
| `elevation-flat` | Flush with the surface — the ground plane. No shadow. | — (emits `none`) | base surfaces, flush content; the reset value |
| `elevation-raised` | Resting lift — in-flow elements subtly above the page. | `shadow.2` (sm) | cards, raised buttons, **Button hover** |
| `elevation-overlay` | Anchored transient surface tied to a trigger. | `shadow.3` (md) | Dropdown, Select, Popover, Tooltip, Menu |
| `elevation-floating` | Larger detached panel, not anchored to a trigger. | `shadow.4` (lg) | Drawer, side sheet, date picker |
| `elevation-modal` | Top-of-stack, page-blocking, focus-trapping. | `shadow.5` (xl) | Modal, Dialog, command palette |

The hierarchy is deliberately aligned with the **headless components on the
roadmap** (`Modal` → `elevation-modal`; `Dropdown`/`Select`/`Tooltip` →
`elevation-overlay`), so the framework is ready for them as they enter the
registry — most of the scale's consumers do not exist as registry components
yet (see §6).

The raw `shadow.*` ramp stays available for genuine one-offs — e.g. the **Switch
thumb** uses `shadow.1` (the xs hairline) directly, the same way a one-off
animation can reach for `duration.75`. The ramp is the exception; the roles are
the interface.

## 2. The layered values (smoothshadows methodology)

One light direction (straight down — `offsetX: 0`, `spread: 0`), a tight
near-opaque **contact** layer, then progressively larger, softer layers for the
penumbra. Higher rungs add layers and roughly double offset/blur, so the set
reads as one coherent system. Each layer below is `offsetY / blur · colour`:

| Primitive | Size | Layer 1 (contact) | Layer 2 (mid) | Layer 3 (diffuse) |
|---|---|---|---|---|
| `shadow.1` | xs | `0 1 2` · strong | — | — |
| `shadow.2` | sm | `0 1 2` · strong | `0 2 4` · soft | — |
| `shadow.3` | md | `0 2 4` · strong | `0 4 8` · medium | `0 8 16` · soft |
| `shadow.4` | lg | `0 4 8` · strong | `0 8 16` · medium | `0 16 24` · soft |
| `shadow.5` | xl | `0 8 16` · strong | `0 16 32` · medium | `0 24 48` · soft |

These are **reasonable starting values**, deliberately conservative so they
read on light surfaces. They are tuned in Figma and the browser once live
(§6, the workbench specimen).

## 3. Decomposition — what makes this syncable to Figma

The multi-layer model collapses to a **tiny shared primitive pool**, which is
exactly what lets it round-trip as Figma variables (Figma has no composite
shadow variable type — only FLOAT/STRING/COLOR/BOOLEAN, the same constraint
that keeps motion code-only):

- **3 new shadow-colour primitives** — the only genuinely new tokens. A stable
  near-black at three alphas. Based on **`absolute-black`, not the neutral
  palette**, so the shadow does **not** invert when the neutral ramp flips in
  dark mode (consistent with the single-shared-scale decision, D2):

  | Token | Alpha | Hex |
  |---|---|---|
  | `shadow.color.strong` | ≈ 0.08 | `#00000014` |
  | `shadow.color.medium` | ≈ 0.06 | `#0000000f` |
  | `shadow.color.soft` | ≈ 0.04 | `#0000000a` |

  → 3 new Figma **COLOR** variables.

- **Geometry reuses the existing `space.*` scale.** Every offset/blur/spread
  value above (0, 1, 2, 4, 8, 16, 24, 32, 48) already exists in `space.*`, so
  each layer's offset/blur **aliases the space primitives** — which are already
  Figma FLOAT variables. → **zero** new geometry variables. (Shadows therefore
  emit in `rem`, scaling with the root, like every other length token.)

Net new Figma surface: **3 COLOR variables + 6 Effect Styles** whose layers
bind to existing `space` vars + the new colour vars.

## 4. DTCG modelling & the emitter

New token document `packages/tokens/src/elevation.json`, a **single-mode base
document** like `motion.json` / `interaction.json`. Shape:

```jsonc
{
  "shadow": {
    "color": {
      "strong": { "$type": "color", "$value": "#00000014" },
      "medium": { "$type": "color", "$value": "#0000000f" },
      "soft":   { "$type": "color", "$value": "#0000000a" }
    },
    "1": { "$type": "shadow", "$value": [
      { "color": "{shadow.color.strong}", "offsetX": "{space.0}",
        "offsetY": "{space.1}", "blur": "{space.2}", "spread": "{space.0}" }
    ] },
    "2": { "$type": "shadow", "$value": [ /* contact + diffuse */ ] }
    // 3, 4, 5 …
  },
  "elevation": {
    "flat":     { "$type": "shadow", "$value": [] },          // → box-shadow: none
    "raised":   { "$type": "shadow", "$value": "{shadow.2}" },
    "overlay":  { "$type": "shadow", "$value": "{shadow.3}" },
    "floating": { "$type": "shadow", "$value": "{shadow.4}" },
    "modal":    { "$type": "shadow", "$value": "{shadow.5}" }
  }
}
```

### Emitter changes (`crates/primitiv-emit`)

Today `dtcg.rs` **explicitly skips** shadow composites
(*"Leaves whose `$value` is any other composite (e.g. shadow/gradient tokens)
are not yet supported and are skipped."*). The work:

1. **`value.rs` — `format_shadow`.** Given the resolved layers, render each as
   `offsetX offsetY blur spread color` and join with `, `. An **empty layer
   list → `none`** (the `elevation-flat` / reset case).
2. **`dtcg.rs` — shadow handling.** When a leaf's `$type == "shadow"`: accept a
   single layer object **or** an array of them (per DTCG §9.5), pull the five
   sub-properties, resolve each (alias → `var()`, literal → verbatim), and emit
   one token. Gate on `$type` so a future array-valued composite is not
   mistaken for a shadow (mirrors the `cubic_bezier_points` `$type` gate).
3. **Inner-alias resolution.** `alias.rs` only rewrites a whole-string token
   value today; shadow sub-properties (`{space.1}`, `{shadow.color.strong}`)
   need the same `{…}` → `var(--primitiv-…)` rewrite **per field**. Factor the
   rewrite out of `link_aliases` into a shared helper both call.
4. **Both alias tiers emit.** A `shadow.*` alias of another `shadow.*`
   (`elevation.raised → {shadow.2}`) resolves to
   `var(--primitiv-shadow-2)` via the existing alias path — no special-casing.

All TDD, golden-file across **CSS / SCSS / Tailwind**, held at 100%
lines+regions+functions (`rust-cli-test-conventions`).

### Wiring

Add `ELEVATION` to the embedded base set in
`crates/primitiv-cli/src/commands/tokens.rs` (`include_str!`,
alongside `PRIMITIVES` / `INTERACTION` / `MOTION`) and into the `base` array of
`TokenSources`, so `primitiv tokens` emits `--primitiv-shadow-*` and
`--primitiv-elevation-*` into the shared base layer.

## 5. Figma

> **As built (2026-06-28) — see D8.** The plan below assumed a read-only
> in-session Figma MCP, so it routed variable creation through the sync plugin.
> A **writable** Figma-console bridge is now available, and the sync plugin is
> being retired, so the variables *and* the effect styles were created **directly
> via the bridge** — no `elevationSpec.ts` / `bootstrapElevation.ts` / console
> script were written. The shapes below still describe the result; only the
> mechanism changed.

### Variables

A new **`Elevation`** COLOR collection holds three `COLOR` variables
`shadow/color/{strong,medium,soft}` (black at ~8/6/4% alpha). *(Original plan: a
pure `elevationSpec.ts` + a `bootstrapElevation` action in the sync plugin,
mirroring `interactionSpec` / `bootstrapInteraction`, with the collection routed
in `packages/tokens/src/dtcg.ts`.)*

The geometry binds to the **existing** `space/*` Primitives variables — nothing
new there. The semantic `elevation.*` composites stay **code-only** in Figma
(no shadow variable type), exactly as the `motion.*` semantic layer is — the
**effect styles** are their Figma representation.

### Effect styles

The **full set (10)** was authored: the raw ramp `shadow/1 … shadow/5` *and* the
semantic `elevation/{flat,raised,overlay,floating,modal}` — each a stack of
drop-shadow layers whose offsetX/offsetY/blur/spread bind to `space/*` and whose
colour binds to the new `shadow/color/*` variables. *(The RFC originally scoped
six `elevation/*` styles; the raw ramp was added so the Switch thumb can reference
a named `shadow/1` style and Figma mirrors the token system exactly — see D8.)*
`elevation/*` duplicate the matching `shadow/*` layer stacks, since Figma effect
styles cannot alias one another. `elevation/flat` is a no-shadow style.

## 6. Component adoption (this RFC)

Of the 11 shipped registry components, two benefit immediately — the strongest
elevation consumers (Modal, Dropdown, Tooltip, Select) are headless-only and
not in the registry yet, so the rest of the scale is forward-looking.

- **Button** — a resting → hover **lift**: `--primitiv-elevation-flat` at rest,
  `--primitiv-elevation-raised` on `:hover` (transitioned via the existing
  `--primitiv-motion-*` tokens already on the button).
- **Switch** — a hairline shadow on the **thumb** to lift it off the track,
  using the raw `--primitiv-shadow-1` (the one place the primitive tier is the
  right tool).

Both follow `registry-stylesheet-conventions` — CSS + the `.scss` mirror, every
value tokenized (no magic numbers), `contract.json` untouched unless a knob is
added. Each ships its workbench-example update and README/JSDoc per the
definition of done.

### Workbench specimen

An elevation example page under `apps/workbench/src/pages` showing every rung on
cards/surfaces, so the values can be QA'd in a real browser (the sandbox has no
browser) and tuned against smoothshadows.com side-by-side.

## 7. Applying effect styles to existing Figma components

**Started 2026-06-28.** Button and Switch are done (baked-in, model 1):
`elevation/raised` on the 15 Button hover variants (primary/secondary/danger ×
5 sizes; link's 5 stay flat) and `shadow/1` on the `Thumb` frame across all 40
Switch variants, with both component descriptions updated. The strongest
remaining consumers already exist as Figma sets carrying **hardcoded shadows
pending these tokens** — **Modal** (→ `elevation/modal`) and **Dropdown/Panel**
(→ `elevation/overlay`) — and are the next to migrate; cards/raised surfaces are
the candidates for the Boolean-property model. Tracked in
`docs/transfer-and-next-steps.md`.

The two integration models, chosen per component:

1. **Baked in** — apply the effect style directly to the component frame (e.g.
   Button always carries `elevation/raised` on hover-state variants). Simplest,
   but the shadow is non-optional.
2. **A Boolean component property** — expose a `Shadow` / `Elevated` boolean on
   the component set that toggles the effect style on/off, so a consumer
   switches elevation per use case. More flexible, matches Figma's property
   model, and is the likely preference for surfaces where elevation is
   situational (cards, raised buttons).

Scope for that session: decide per component which model fits, wire the boolean
properties where chosen, apply the effect styles, and update each set's
**component description** (`figma-component-descriptions`). Candidate set is the
same depth hierarchy in §1 — prioritise the components that exist as Figma sets
today, and add the overlay/modal applications as those components are built.

## 8. Decision log

- **D1 — Two tiers, both emitted.** `shadow.*` (primitive) + `elevation.*`
  (semantic role), mirroring motion. Both emit custom properties for
  completeness. Roles are the canonical interface; the raw ramp is for one-offs.
- **D2 — Single shared scale for v1 (mode-independent).** No per-theme split.
  Shadow colour is `absolute-black` at low alpha — stable across light/dark, so
  it does not invert with the neutral ramp. Theme-scoped elevation (heavier
  shadows on dark surfaces) is a possible future split, not v1.
- **D3 — Colour is the only new primitive; geometry reuses `space.*`.** Maximal
  reuse (the brief's ask), minimal new Figma surface (3 COLOR vars; geometry
  binds to existing `space` vars).
- **D4 — Semantic vocabulary:** `flat / raised / overlay / floating / modal` —
  a depth hierarchy, validated against Atlassian (`raised`/`overlay`) and
  Material (the dp ladder). Not t-shirt sizes.
- **D5 — `elevation-flat` emits `box-shadow: none`** via an empty DTCG shadow
  array — a declarative reset rung.
- **D6 — Effect styles, not variables, are elevation's Figma form** (no shadow
  variable type), exactly as `motion.*` is code-only. Variables cover only the
  3 colours; effect styles are authored via a console script.
- **D7 — Applying effect styles to existing Figma components is deferred** to a
  separate session (§7), to be integrated either directly or behind a Boolean
  component property. *(Started 2026-06-28: Button + Switch done, baked-in.)*
- **D8 — Figma side built via the writable bridge, not the sync plugin
  (2026-06-28).** §5 assumed a read-only in-session Figma MCP and routed variable
  creation through an `elevationSpec` + `bootstrapElevation` sync-plugin action. A
  writable Figma-console bridge is now available and the sync plugin is being
  retired, so the `Elevation` collection, the 3 colours, and **all 10 effect
  styles** were created directly via the bridge — no spec/bootstrap/console-script
  files. The **full `shadow/*` ramp** was authored alongside the six `elevation/*`
  styles (the RFC scoped only the six) so the Switch thumb references a named
  `shadow/1` style and Figma mirrors the token system one-to-one.
