# RFC 0003 — Dynamic foreground wiring

> **Status:** Proposed
> **Author:** simonrevill, with architectural review
> **Date:** 2026-06-08
> **Relates to:** RFC 0001 (Token Architecture) §4.1 and §12.3;
> RFC 0002 (Harmoni → Intent → Plugin) Phase B / §Phase 5.

---

## 0. Summary

The Harmoni engine already computes the *correct* foreground for every
swatch — the text/icon colour that clears WCAG AA against that swatch —
and it does so per hue, dynamically. That answer is then thrown away at
the plugin boundary and replaced, in the Intent layer, by a static
`color/white` guess. The guess holds for dark brand hues and fails for
light ones: a yellow or lime brand gets white button text on a light
fill, a contrast failure the engine had already avoided.

This RFC closes the gap. It carries the engine's per-step foreground
choice through to a **per-step foreground alias variable**, and
repoints the Intent foreground tokens at those. The Component → Intent
→ Palette cascade that RFC 0002 §4.6 proved for *backgrounds* extends
to *foregrounds*, and dark mode stops needing manual `darkAliasTo`
patching — each mode's ramp carries its own foregrounds.

The work is three phases plus one cross-cutting change:

1. **Phase 1 — Engine.** Expose a `ForegroundSource` discriminant so a
   consumer can tell *which* of the six tiers produced a foreground.
2. **Phase 2 — Harmoni plugin.** Write a new `Primitives / Foreground`
   collection of per-step foreground aliases.
3. **Phase 3 — Intent layer.** Repoint the contrast-driven foreground
   tokens at the new collection; drop the now-redundant `darkAliasTo`
   overrides.
4. **Cross-cutting — DTCG.** Route the new collection through the token
   export.

---

## 1. The problem, in three layers

### 1.1 Engine — solved already

`get_best_foreground()`
(`crates/harmoni-core/src/audit/foreground.rs`) picks each swatch's
foreground through a six-tier fallback, each tier gated on a strict
4.5:1 WCAG AA check:

1. harmonious **step 900** (the palette's own dark candidate)
2. harmonious **step 50** (the palette's own light candidate)
3. **soft white** (the user-supplied white primitive)
4. **soft black** (the user-supplied black primitive)
5. **pure white** (`#ffffff`) — guaranteed AA last resort
6. **pure black** (`#000000`) — guaranteed AA last resort

Every `Swatch` carries the result as `best_foreground: SwatchStep`.
For a dark brand hue the winner is white (tier 3/5); for a light hue it
is the palette's 900 or soft black (tier 1/4). **This layer is correct
and is not the problem.**

### 1.2 Harmoni plugin — drops the answer

The `apply-palette` message
(`apps/harmoni-figma-plugin/src/shared/messages.ts`) is
`SwatchData = { step, rgba }`. The foreground is not in it.
`applyPalette.ts` writes one literal `color/<ramp>/<step>` variable per
swatch and nothing else. The UI renders `best_foreground` (in
`Swatch.tsx`) but never transmits it. So after Apply, Figma holds the
ramp colours but has no per-step foreground anywhere to alias from.

### 1.3 Intent layer — hardcodes a guess

`apps/primitiv-sync-figma-plugin/src/code/intentSpec.ts` pins the
foregrounds:

```
action/primary/foreground/default  → color/white
action/danger/foreground/default   → color/white
content/on-action                  → color/white
```

`action/primary/default → color/brand/500`. When Harmoni produces a
light brand, `color/brand/500` is a light fill and the engine computes
*dark* text for it — but the Intent alias still forces white. The
`darkAliasTo` overrides elsewhere in the spec are the same pattern:
hand-re-guessing per mode what the engine computes for free.

---

## 2. Principles

### Principle 1 — The engine is the single source of truth for contrast

No layer above the engine re-decides a foreground by eye. The Intent
layer's job is to *name* a foreground role and alias it to the engine's
answer, never to pick a colour.

### Principle 2 — Foregrounds are aliases, not values

Phase A's "each palette variable is a literal hex" rule (RFC 0002
§2.3) is for `Primitives / Palette`. The foreground surface is the
opposite by design: every variable in it is a **VARIABLE_ALIAS** into
an existing palette variable, so a palette regeneration cascades
through it untouched.

### Principle 3 — Only `default` and on-* foregrounds are dynamic

RFC 0001 §4.1 stands: foreground has `default` and `disabled` only, no
hover/active. `disabled` is a deliberate muted constant
(`color/neutral/400`) — it is *not* contrast-driven and does **not**
become dynamic. Only `*/foreground/default` and the `content/on-*`
roles move onto the engine's per-step answer. `action/link/foreground/*`
is unchanged (link is foreground-on-surface, not on a fill).

### Principle 4 — Ownership unchanged

Per RFC 0002 §Principle 4: the Harmoni plugin owns palette **and now
foreground** variable writes; the sync plugin owns the Intent layer and
DTCG export. Both write to disjoint surfaces.

---

## 3. The model

### 3.1 A `ForegroundSource` discriminant (engine)

`ForegroundRecommendation` gains a `source` field:

```rust
pub enum ForegroundSource {
    Step900,
    Step50,
    SoftWhite,
    SoftBlack,
    PureWhite,
    PureBlack,
}
```

set at each of the six return points in `get_best_foreground()`. This
is required because the `"White"`/`"Black"` label on the returned
`SwatchStep` cannot distinguish soft from pure — both tiers carry it —
and the soft-anchors mapping (§3.3) needs to tell them apart.
`source` subsumes the existing `is_harmonious` bool (`Step900`/`Step50`
⇒ harmonious); `is_harmonious` is removed.

`source` is surfaced onto `Swatch` through the mirror-types boundary
(harmoni-core → harmoni-wasm), per the `rust-wasm-workflow`
add-a-field checklist.

### 3.2 A dedicated `Primitives / Foreground` collection (plugin)

A new collection, Light/Dark modes mirroring `Primitives / Palette`,
holding one alias per ramp step:

```
foreground/brand/50   → (alias) color/brand/900   | color/white | …
foreground/brand/100  → …
…
foreground/neutral/100 → color/neutral/900
foreground/danger/500  → color/danger/900
```

`Primitives / Palette` stays purely literal. The foreground collection
is a thin alias layer; this is the user-chosen "dedicated foreground
surface" over a `*/on` sibling inside Palette.

### 3.3 Soft-anchors mapping (`ForegroundSource` → variable)

Each source maps to the exact anchor the engine validated against:

| `ForegroundSource` | Alias target |
| --- | --- |
| `Step900` | `color/<ramp>/900` |
| `Step50`  | `color/<ramp>/50` |
| `SoftWhite` | `color/white` |
| `SoftBlack` | `color/black` |
| `PureWhite` | `color/absolute-white` |
| `PureBlack` | `color/absolute-black` |

The `White`/`Black` *tiers* alias to the **soft** anchors
(`color/white` / `color/black`) — the values the engine actually
contrast-tested — not the doc's blanket "foreground-on-colour = true
white" rule. The pure tiers fall through to the `absolute-*` constants,
which is why the discriminant (not the label) drives the mapping.

### 3.4 Repointed Intent foregrounds (Intent layer)

`intentSpec.ts` repoints the contrast-driven foregrounds onto the new
collection — keyed on the *background* step each role sits on:

| Token | Old alias | New alias |
| --- | --- | --- |
| `action/primary/foreground/default` | `color/white` | `foreground/brand/500` |
| `action/secondary/foreground/default` | `color/neutral/900` | `foreground/neutral/100` |
| `action/danger/foreground/default` | `color/white` | `foreground/danger/500` |
| `content/on-action` | `color/white` | `foreground/brand/500` |
| `content/inverse` | `color/white` (+`darkAliasTo`) | `foreground/neutral/800` |

`*/foreground/disabled` (→ `color/neutral/400`) and
`action/link/foreground/*` are unchanged. The `darkAliasTo` overrides
on the repointed tokens are dropped — each mode's Foreground ramp
already inverts.

This requires the bootstrap action to resolve aliases against **two**
source collections: `Primitives / Palette` for backgrounds/borders,
`Primitives / Foreground` for foregrounds. `intentSpec`'s single
`aliasCollection` becomes a per-variable choice; `bootstrapIntent.ts`
resolves accordingly.

### 3.5 DTCG routing (cross-cutting)

`packages/tokens/src/dtcg.ts` gains a route for `Primitives /
Foreground` (new `foreground.json`, or a `foreground` key under the
palette output — settled in implementation).

**Edge to resolve:** the `PureWhite`/`PureBlack` tiers alias to
`color/absolute-white`/`color/absolute-black`, which `PALETTE_CONSTANTS`
*excludes* from export. A foreground alias resolving to one of them
would emit a reference to an un-emitted token. Resolution options:
(a) emit the two constants when a foreground references them, or
(b) collapse those tiers to a literal hex on export. Decision deferred
to the DTCG implementation cycle; (a) is the lower-surprise default.

---

## 4. Worked example — a yellow brand

1. User picks a yellow brand. Engine generates `brand/500` as a light
   fill; `get_best_foreground` returns `source = Step900` (dark text
   wins AA), `best_foreground` = the 900 swatch.
2. Plugin writes `color/brand/500` (literal) **and**
   `foreground/brand/500 → (alias) color/brand/900`.
3. Intent's `action/primary/foreground/default → foreground/brand/500`
   resolves to `color/brand/900` — dark text. Button text is legible.
4. In Dark mode the dark ramp carries its own `brand/900`-equivalent
   foreground; the same alias resolves correctly with **no**
   `darkAliasTo`.

The same chain with a navy brand yields `source = SoftWhite` →
`foreground/brand/500 → color/white` → light text. The Intent spec is
identical in both cases; only the engine's answer differs.

---

## 5. Order of operations

```
Phase 1 (engine) ─► Phase 2 (plugin write) ─► Phase 3 (intent) ─► DTCG
   discriminant       foreground collection      repoint aliases    route
```

Phases are sequential: Phase 2 needs the discriminant; Phase 3 needs
the foreground collection to alias into; DTCG needs the collection to
route. Phases 1–3 code is fully buildable and unit-testable off-machine
(`cargo test`, `vitest` against the existing `figma.mock.ts`). The only
on-canvas step — running the plugin + Bootstrap Intent in Figma Desktop
and confirming a light brand flips its text dark — waits for live
Figma access; it is a smoke test, not a blocker for any code.

---

## 6. What this RFC does not cover

- **Redesigning the engine's tier order.** The six-tier fallback is
  settled (`harmoni-architecture-history` / the `audit` module). This
  RFC consumes it; it does not retune it.
- **Hover/active foregrounds.** Banned by RFC 0001 §12.3; unchanged.
- **The danger ramp.** `foreground/danger/*` only resolves once the
  danger ramp lands (RFC 0002 §4.6 token gap). The spec entry is
  written ahead and warns until then, exactly as the background
  `action/danger/*` entries already do.
- **CSS variable / Tailwind output.** Out of v1 per RFC 0001 §0.1.

---

## 7. Decision record

1. **The engine is the only place a foreground is chosen.** Higher
   layers alias, never re-decide.
2. **Foregrounds live in a dedicated `Primitives / Foreground`
   collection of aliases**, not as `*/on` siblings in
   `Primitives / Palette`, which stays literal.
3. **The White/Black tiers map to the soft anchors
   (`color/white` / `color/black`)** — the engine-validated values —
   with pure tiers falling to `absolute-*`. The mapping is driven by
   the `ForegroundSource` discriminant, not the colour label.
4. **Only `*/foreground/default` and `content/on-*` become dynamic.**
   `disabled` and `link` foregrounds are unchanged.
5. **Ownership is unchanged:** Harmoni writes palette + foreground;
   the sync plugin owns Intent + DTCG.

End.
