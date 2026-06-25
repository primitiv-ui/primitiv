# RFC 0015 — Figma Figure + Figcaption component build

> **Status:** Accepted (build in progress 2026-06-26)
> **Author:** simonrevill
> **Date:** 2026-06-26
> **Seeds from:** the 2026-06-26 Figure planning session (decisions taken live).
> **Relates to:** RFC 0012 (Figma web typography build) — this is checklist
> item #16, a content/prose component, and follows every convention set there;
> RFC 0014 (Table) — the immediately-preceding prose build whose "leaf set +
> composed top-level" family shape this mirrors; RFC 0009 (mode scoping) —
> density is owned by the consuming frame, never baked into a variant. Skills:
> `figma-prose-component` (slot strategy, grid labels, example frame),
> `figma-variable-architecture` (Context/Intent token mechanics), the
> `figma-arrange-component-set` (grid layout + labels),
> `figma-component-descriptions` (the mandatory final step), `figma` (session
> setup / Desktop Bridge).

---

## 0. Summary

Primitiv's Figma typography library needs **Figure + Figcaption** — the
`<figure>`/`<figcaption>` pairing that wraps self-contained content (an image,
illustration, chart, code listing, table) with an optional caption.

Unlike Table, there is **no headless React `Figure`** to mirror — this is a
**Figma-only** prose component. It nonetheless follows the same family shape as
Table: a reusable **Figcaption** leaf set, and a pre-composed top-level
**Figure** that nests a media placeholder + a Figcaption instance.

This RFC records the family, the variant axes per set, the **overlay caption
treatment**, the one **new `figure/caption-gap` Context token**, the media
placeholder spec, the required grid-labels + light/dark example furniture, and
the decisions taken in planning.

---

## 1. Component family

**Decision (D1): a Figcaption leaf set + a composed top-level Figure**, mirroring
Table (RFC 0014 D1). Figcaption is independently reusable (any media + caption
composition can drop one in) and carries an editable `Text` property; Figure
provides the real drop-in. A monolithic single set was rejected (caption not
reusable, no editable-text surfacing through the parent); a leaf-only build was
rejected (no drop-in figure).

| HTML | Figma representation |
| --- | --- |
| `<figure>` | **Figure** (top-level set) — media placeholder + nested Figcaption |
| `<figcaption>` | **Figcaption** (set) — the caption text leaf |
| the media (`<img>`, `<svg>`, `<pre>`, …) | a **media-slot placeholder** frame inside Figure — a documented swap target, not its own set |

Two component sets get built: **Figcaption** and **Figure**, both on the new
**Figure & Figcaption** page.

---

## 2. Conventions (inherited)

Verbatim from the prose-component conventions (RFC 0012 / 0014 §2) — pointers
only:

- **Inline font binding**, never a text style inside a component
  (`fontFamily`/`fontSize`/`lineHeight`/`fontStyle` via `setBoundVariable`).
- **Fill/stroke binding** to Intent variables via
  `figma.variables.createVariableAlias` — never a hardcoded RGB.
- **Density is frame-owned** — no explicit Context mode overrides on any variant
  (RFC 0009). The example frame (§7) sets density on its cells.
- **Ordering gotchas** (RFC 0012 D7/D8): `resize()` before HUG/FILL sizing;
  `layoutSizingHorizontal/Vertical`, not `primaryAxisSizingMode`; FILL and
  `componentPropertyReferences` only **after** `appendChild`.
- **Naming**: `Axis=value, Axis=value` sets `variantProperties`.

---

## 3. Variant axes per set

### 3.1 Figcaption (`<figcaption>`)

| Axis | Values | Drives |
| --- | --- | --- |
| `Size` | `xs · sm · md · lg · xl` | `body/{size}` type tokens on the text node |
| `Align` | `start · center · end` | `textAlignHorizontal` + FILL text alignment |

**= 5 × 3 = 15 variants.** Plus a **`Text`** TEXT component property bound to the
caption text node's `characters` (default `"Figure caption"`), so a designer
edits the label from the panel and — crucially — from the parent **Figure**
instance, where the nested caption's `Text` surfaces automatically (RFC 0014 D9).

Structure: a single TEXT node, FILL width, HUG height. `body/{size}` type,
`content/muted` fill, Asta Sans Regular. `textAlignHorizontal` follows `Align`.

### 3.2 Figure (`<figure>`)

| Axis | Values | Drives |
| --- | --- | --- |
| `Size` | `xs · sm · md · lg · xl` | the `Size` of the nested Figcaption instance |
| `Caption Position` | `below · above · overlay` | caption placement relative to the media (§4) |

**= 5 × 3 = 15 variants.** Plus a **`Show Caption`** boolean (default `true`) —
toggles the nested Figcaption's `visible`; when off, the figure is media-only and
collapses to the media height.

Figure has no `Align` axis (D2) — caption alignment lives on Figcaption. Figure's
nested caption defaults to `Align=start`; `center`/`end` is an instance override
(a documented one-property change on the nested caption). This keeps Figure at 15
rather than 45 variants.

The `Size` axis composes the matching-size Figcaption variant: a `Size=lg` Figure
nests the `Size=lg` Figcaption, so switching a placed instance's `Size` cascades
to the caption in one move (the Table `Size`-cascade pattern, RFC 0014 §6.1). No
per-size rebinding — each Figcaption `Size` variant already binds its own
`body/{size}` tokens.

---

## 4. Caption position & the overlay treatment (D3)

Three positions, two layout shapes:

- **`below`** — Figure is VERTICAL auto-layout `[media, caption]`,
  `itemSpacing = figure/caption-gap`.
- **`above`** — VERTICAL auto-layout `[caption, media]`, same gap. (The React
  default is below; above is the `caption`-first ordering.)
- **`overlay`** — the caption sits **over the bottom of the media**. The
  Figcaption is an **absolutely-positioned** child of the media frame
  (`layoutPositioning = 'ABSOLUTE'`), pinned to the bottom edge and horizontally
  stretched (constraints `STRETCH` / `MAX`), inside a **scrim bar**. The media
  frame `clipsContent = true` so the scrim respects the `radii/8` corners.

**Overlay colour (D4):** the scrim and caption text use the **`inverse` token
pair**, which always inverts together against the current theme:

| Theme | Scrim (`surface/inverse`) | Caption text (`content/inverse`) |
| --- | --- | --- |
| Light | dark `#202328` | light `#ebebeb` |
| Dark | light `#d3dae3` | dark `#141414` |

Both are readable in both themes and stay fully tokenised — no hardcoded black.
In `overlay` only, the nested Figcaption instance's text fill is overridden to
`content/inverse` (the leaf's own default stays `content/muted` for below/above),
and the caption bar gets a `surface/inverse` fill with inner padding bound to
`figure/caption-gap` / `space` (see §5). The scrim is **solid** for v1; a
translucent / gradient scrim is deferred (§9).

---

## 5. Token additions

One new namespace; everything else reuses existing tokens.

### 5.1 Context collection — `figure/caption-gap` (density-scaling)

**Decision (D5): the media→caption gap scales by density**, following
`quote/body-gap` / `code/padding`. One value per mode, aliasing a `space/*`
primitive:

| Token | Dense | Compact | Comfortable | Spacious |
| --- | --- | --- | --- | --- |
| `figure/caption-gap` | `space-4` (4) | `space-8` (8) | `space-12` (12) | `space-16` (16) |

Bound to the Figure's `itemSpacing` (below/above) and, in `overlay`, to the scrim
bar's padding. Back up to `packages/tokens/src/context.json` under `figure` in
all four density mode sections.

**Created `VariableID`** (Context collection `VariableCollectionId:369:31958`):
recorded in §10 after the build.

### 5.2 Reused (no new token)

| Need | Existing token | ID |
| --- | --- | --- |
| Media placeholder fill | `surface/subtle` | `VariableID:346:4431` |
| Media placeholder radius | `radii/8` | `VariableID:142:113` |
| Caption font (below/above) | `body/{size}` Context type | per-size |
| Caption fill (below/above) | `content/muted` | `VariableID:346:4437` |
| Overlay scrim fill | `surface/inverse` | `VariableID:346:4434` |
| Overlay caption fill | `content/inverse` | `VariableID:346:4439` |
| Grid-label fills | `content/primary` / `content/secondary` | `346:4435` / `346:4436` |
| Media placeholder glyph | Icon set `image` variant | set `153:1754` |

---

## 6. Media-slot placeholder

The media slot is a **placeholder frame**, not its own component set and not yet
an INSTANCE_SWAP slot (D6 — blocked on the unpublished local file, RFC 0012 D11;
once published the slot can gain an explicit INSTANCE_SWAP property pointing at
arbitrary content).

```
Media (FRAME, FILL width, fixed placeholder height, clipsContent)
  fills    → surface/subtle
  4 radii  → radii/8
  ⌖ image Icon instance, centred, content/muted — signals "replace me"
```

The designer replaces the placeholder with their own image / illustration /
embedded component. Default placeholder height is a sensible 4:3-ish block that
scales nothing (it is content, not a token-driven dimension); the consumer
resizes. Documented in the Figure description.

---

## 7. Required page furniture

Per the prose-component definition of done:

### 7.1 Grid-labels groups

- **Figcaption** — column headers `xs…xl`; rotated `START / CENTER / END` align
  bands.
- **Figure** — column headers `xs…xl`; rotated `BELOW / ABOVE / OVERLAY` position
  bands.

Khand SemiBold 11px, `content/primary` headers / `content/secondary` sub-labels.

### 7.2 Light + Dark example frame

A `"Figure Example"` frame below the sets: two rows (**LIGHT** / **DARK**) × four
density columns (**Dense / Compact / Comfortable / Spacious**), Intent mode on
each row, Context mode on each cell. Representative instance: the top-level
**Figure**, `Size=md, Caption Position=below`, caption shown — so the frame shows
the media placeholder, caption type, gap, and density scaling at a glance. (A
second small `overlay` example may be added so the inverse-pair treatment is
visible in both themes.)

---

## 8. Decisions

### D1 — Figcaption leaf set + composed top-level Figure
Mirrors Table (RFC 0014 D1). Figcaption reusable + editable `Text`; Figure the
drop-in. Monolithic and leaf-only both rejected. See §1.

### D2 — Align lives on Figcaption only
`Align=start·center·end` is a Figcaption axis (Size × Align = 15). Figure has no
Align axis — its nested caption defaults to `start`, with center/end an instance
override. Putting Align on Figure too would multiply it to 45 variants for a
one-property override. (Human choice, 2026-06-26.)

### D3 — Caption Position = below · above · overlay
Three positions on Figure (× Size = 15). `below`/`above` are auto-layout
ordering; `overlay` is an absolutely-positioned scrim bar over the media bottom.
(Human choice, 2026-06-26.)

### D4 — Overlay uses the `inverse` token pair
Scrim `surface/inverse` + caption text `content/inverse` invert together, so the
overlay bar is readable and fully tokenised in both themes (no hardcoded black).
The leaf Figcaption keeps `content/muted`; overlay overrides the nested
instance's text fill. See §4.

### D5 — `figure/caption-gap` scales by density
One new Context token (4/8/12/16 across Dense→Spacious), aliasing `space/*`.
Mirrors `quote/body-gap` / `code/padding`. See §5.1.

### D6 — Media slot is a placeholder frame (INSTANCE_SWAP deferred)
`surface/subtle` + `radii/8` placeholder with a centred `image` Icon. Not its own
set; not an INSTANCE_SWAP slot until the file is published (RFC 0012 D11). See §6.

---

## 9. Deferred / open

- **INSTANCE_SWAP media slot** — once the file is published to a team library,
  the placeholder gains an explicit INSTANCE_SWAP property (D6 / RFC 0012 D11).
- **Translucent / gradient overlay scrim** — v1 scrim is a solid `surface/inverse`
  bar; a media-revealing gradient is a later refinement (D4).
- **Numbered figure** — a "Figure N." label prefix on the caption; out of scope
  (a consumer prepends it, or a future `Show Number` boolean).
- **`Align=end` demand on Figure** — promote Align to a Figure axis only if a
  single-property re-align is genuinely wanted (D2).

---

## 10. Build outcome

_(filled after the build — set node IDs, the created `figure/caption-gap`
VariableID, and any confirmed deviations from this draft.)_
