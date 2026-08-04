# EmptyState — Figma design, session handoff

Status as of 2026-08-04 (second session): **headless compound done; tokens
landed; Figma design landed.** What remains is the registry styling +
kitchen-sink example, and the `tokens.css` regeneration that this sandbox
cannot run.

The previous session's Figma write-access blocker is **gone** — see
"Blocker (resolved)" below before assuming anything about it.

## What already exists

`packages/react/src/EmptyState` — headless compound, done, tested, documented:

- `EmptyState.Root` — `<div role="status">` (polite live region; opt out with
  `role={undefined}` for a static empty state)
- `EmptyState.Media` — `<div aria-hidden="true">`, decorative icon/illustration
  slot
- `EmptyState.Title` — `<p>`
- `EmptyState.Description` — `<p>`
- `EmptyState.Actions` — `<div>`, recovery-action grouping (buttons/links)

All parts stateless, optional, no `data-*` attributes — orientation/layout is
a pure presentation concern for Figma + registry CSS, not the headless layer.

**Alert is the structural precedent** — icon + title + description + action,
Context token family per size, a real Button instance for the action. Reuse
its conventions rather than inventing new ones *except* where this doc records
a deliberate departure (there is exactly one: the title type scale).

## Tokens — landed

Added to `packages/tokens/src/context.json` (all four density modes, every
value an alias to a `size.*` / `space.*` primitive — no literals) **and**
mirrored into the Figma Context collection
(`VariableCollectionId:369:31958`) as `VARIABLE_ALIAS` references to the same
primitives, so the two sides are in lockstep and a later sync-plugin backup is
a no-op.

`empty-state/{size}/*` — 20 variables, `comfortable` shown:

| | xs | sm | md | lg | xl |
| --- | --- | --- | --- | --- | --- |
| `media-size` | 32 | 40 | 48 | 56 | 68 |
| `max-inline-size` | 200 | 240 | 288 | 344 | 344 |
| `gap` | 12 | 16 | 20 | 24 | 28 |
| `text-gap` | 2 | 3 | 4 | 6 | 8 |

Plus **`empty-state/media-offset-top`** — size-agnostic, density-scoped only:
Comfortable 3 · Compact 4 · Spacious 4 · Dense 1.

Derivations, so these can be re-derived rather than guessed:

- **`media-size`** is a consistent **~2.8×** `framed-control/{size}/icon-size`
  (which resolves to 12/14/16/20/24). Every step lands exactly on an existing
  `size.*` primitive. Density mirrors `icon-size`'s own pattern (dense −1 step,
  compact = comfortable, spacious +1) so media stays a constant multiple of the
  icon scale in every mode.
- **`max-inline-size`** is one step per density mode on the `size.*` scale,
  **clamped at 344** because the scale ends there. The lg/xl repeat at
  Comfortable is intentional and was explicitly signed off; only Dense and
  Compact keep lg < xl distinct. If a wider measure is ever wanted, extend the
  primitive scale — do not hardcode a literal.
- **`media-offset-top`** is `(heading line-height − font-size) × 0.4` snapped to
  the space scale — Alert's `icon-offset-top` formula. It is size-agnostic
  because every `heading/*` slot's line-height is font-size + 8, so the
  half-leading is genuinely constant across all five sizes (measured 3.2px at
  every size in Comfortable). Precedent for a size-agnostic Context token:
  `toggle-group/track-padding`, `segmented-control/track-padding`.
- **No padding token, deliberately.** The root fills and centres inside whatever
  box it is given; padding is the container's job. Giving this component its own
  would double every seam the way an early Card build did.
- **No `action-gap` token.** The actions row reuses `framed-control/{size}/gap`
  directly, exactly as Alert reuses it for its outer row.

`empty-state` does **not** need adding to the emitter's `LENGTH_CATEGORIES` —
every token is an alias, so `format_number` never sees it and the unit comes
from the primitive. (This is the trap `avatar-group` hit with a raw negative
number; it does not apply here.)

## Design decisions

The four decisions carried in from the first session were all validated
visually and **held**:

1. **Max-inline-size cap** — needed and correct. Exploration section A shows the
   capped and uncapped versions side by side in an 880px container.
2. **Icon size via a new family, not `framed-control/{size}/icon-size`** —
   correct; that family is control-sized (12–24px) and far too small.
3. **Graduated gap rhythm** — correct. Section C shows the uniform-gap version
   for contrast, where the title visibly floats away from its own description.
4. **Actions hug, not stretch, in a centred horizontal row regardless of
   Direction** — correct. Verified across one, two and three actions (section D).

Three further decisions were settled **this** session:

5. **Title binds `heading/*`, NOT `label/*`** — the one deliberate departure from
   Alert. `label/{size}` and `body/{size}` resolve to the **same px value** at lg
   (20/20) and xl (22/22), and because Khand is a condensed face the title then
   reads as the *smaller* of the two — an inverted hierarchy, not merely a weak
   one. Alert gets away with `label/*` because it is a compact inline banner; an
   empty state is a centred full-region moment and wants headline type. Mapping:
   xs=h6 (20) · sm=h5 (24) · md=h4 (28) · lg=h3 (32) · xl=h2 (40). Exploration
   section F is the evidence, built as an (a)-vs-(b) comparison at md/lg/xl.
6. **Direction=horizontal top-aligns the media against the title**, via the
   `Media Wrapper` + `media-offset-top` anatomy — Alert's optical-alignment
   model. (An earlier answer in this session chose centring against the whole
   body column; that was reversed on review of the render. Exploration section D's
   horizontal specimen has been updated to match, so the page is not
   self-contradictory.)
7. **Direction defaults to `vertical`**, not horizontal as the first session's
   proposal had it. Vertical is the canonical empty state; horizontal is the
   compact/inline case. This was in the *proposed structure* section, not the
   settled-decisions list, so it was treated as a build judgment.

## Figma — landed

Page **"EmptyState"**, positioned directly after "Alert" in the
`---- FEEDBACK & STATUS ----` group. Component set **`1523:889`**, 10 variants
(Direction vertical|horizontal × Size xs–xl), arranged as a labelled grid.

**Built md-first** — the md variants were created before the other sizes, so the
Size dropdown genuinely lists md first. This is the ordering Collapsible and
Select could not get retroactively (`defaultVariant` is read-only), and it only
works if you create in the right order from the start.

Structure (identical in both directions — only `root.layoutMode`, the text
alignment, and the horizontal-only `Media Wrapper` differ):

```
EmptyState  (VERTICAL | HORIZONTAL, primary+counter CENTER — counter MIN when horizontal,
             itemSpacing -> empty-state/{size}/gap, no fill)
├─ Media Wrapper            [horizontal only — paddingTop -> empty-state/media-offset-top]
│  └─ Media  (w/h -> empty-state/{size}/media-size)   [Show media -> visible]
│     └─ Icon (INSTANCE, FILL/FILL)                   [Media -> mainComponent]
└─ Body  (VERTICAL, itemSpacing -> empty-state/{size}/gap)
   ├─ Text  (VERTICAL, itemSpacing -> empty-state/{size}/text-gap,
   │         maxWidth -> empty-state/{size}/max-inline-size)
   │  ├─ Title       (heading/{slot}/*, content/primary)     [Title -> characters]
   │  └─ Description (body/{size}/*, content/secondary)      [Description -> characters]
   └─ Actions  (HORIZONTAL, HUG)                             [Show actions -> visible]
      └─ Actions (SLOT, HORIZONTAL, itemSpacing -> framed-control/{size}/gap, HUG)
         └─ Button instance ("Add item")
```

Properties: `Title` (TEXT) · `Description` (TEXT) · `Show media` (BOOL true) ·
`Show actions` (BOOL true) · `Media` (INSTANCE_SWAP, default `icon=search`,
preferredValues = Icon set) · `Actions` (**SLOT**, preferredValues = Button set).

Every variant is FIXED width (440 vertical / 560 horizontal) purely as a canvas
convenience. Real usage sets the instance to Fill container on both axes — that
is the point of the component, and the measure cap is what stops the text
stretching when it does.

Also on the file: page **"EmptyState — exploration"** (sections A–F), the design
record behind the decisions above.

### Figma build facts worth reusing

- **A genuine multi-child `SLOT` is creatable from the plugin API.**
  `figma.createSlot` does not exist and the dedicated slot MCP tools are still
  blocked, but `addComponentProperty(name, 'SLOT', '')` **is** accepted (the
  earlier `null` rejection was `defaultValue` validation, not the type), and a
  `SLOT` *node* is obtained by `clone()`-ing an existing one — `Dropdown /
  Panel`'s — then setting `componentPropertyReferences = { slotContentId: propId }`.
  This **supersedes** the claim in `docs/select-future-work.md` that only
  pre-existing slots can be written into.
- **A cloned SLOT inherits the source slot's auto-layout**, and `Dropdown /
  Panel`'s stacks vertically — so two Buttons stacked and overlapped instead of
  forming a row. The wrapper being horizontal was irrelevant, because it held
  only the single slot child. Set the SLOT node itself HORIZONTAL, HUG both axes,
  `itemSpacing` bound. **Only the throwaway instantiation test caught this** —
  every read-back looked correct.
- **`combineAsVariants` reconciles same-named non-variant properties into a
  single definition, and so does `set.appendChild()` on an already-combined
  set** — appended variants' refs re-point at the canonical ids automatically
  (verified zero orphans across all 10). So a large set can be built in batches
  without hand-fixing property ids, which is how this one dodged the
  clone-drops-refs gotcha entirely.
- Reparenting still drops `componentPropertyReferences` (the Alert gotcha) — the
  `Media Wrapper` insertion re-set all three affected refs explicitly and then
  verified them.
- **The media Icon's Vector fill is bound to `content/primary`** on all 10
  variants, so the glyph inverts with the theme alongside the title (verified:
  resolves to `#e5ecf6` under Intent=Dark). The Icon set ships its Vector
  *unbound* by design — "bind to `content/*` or `action/*/foreground/*` at the
  usage site" — so this is required, not optional. Binding it also needs the
  **resolved rgba written into the paint**, not just
  `setBoundVariableForPaint`: that call leaves a `{0,0,0}` placeholder literal
  beside the binding and the literal is what renders (the same trap recorded
  against the NavigationMenu build).

## Remaining work

1. **Regenerate `tokens.css`** — `cargo` cannot run in this sandbox, so
   `packages/tokens/src/context.json` is ahead of
   `apps/kitchen-sink/src/styles/primitiv/tokens.css`. The "Token drift" CI
   workflow gates this, so it must happen before the branch is green:
   ```sh
   cargo run -q -p primitiv-cli -- tokens --format css \
     --out apps/kitchen-sink/src/styles/primitiv/tokens.css
   ```
   Expect only new `--primitiv-empty-state-*` lines in the diff.
2. **Registry styling + kitchen-sink example.** Decide the deferred Actions-slot
   question below during this stage, and verify `text-box-trim` still works on
   whatever renders the action labels (same class of bug already fixed once on
   Avatar's fallback label).
3. **Figma example specimens** (light/dark, size × density) on the EmptyState
   page — deferred and non-blocking, same posture as Collapsible's.
4. Once EmptyState is fully done per CLAUDE.md's definition of done (test,
   JSDoc, README, `packages/react/README.md` table row, kitchen-sink example,
   roadmap tick) — **then** MillerColumns. Discuss process at that point; do not
   start it speculatively.

## Registry-phase open question (still open)

For the `Actions` slot, two options, unchanged from the first session:

- (a) re-export the registry Button as an aliased "Action Button"
- (b) let the consumer compose the real registry Button directly as children
  (no wrapper) — **still the leaning choice**, since Actions holds arbitrary,
  open-ended controls unlike ConfirmDialog's fixed Confirm/Cancel pair, similar
  to how Card's Footer treats its buttons. The Figma slot's `preferredValues`
  points at the Button set, which matches (b).

## Reference IDs (Primitiv Design System file)

File key: `1Nh5ffky0lYEw0MzXoqQVy`

| What | Node ID |
| --- | --- |
| **EmptyState component set** | **`1523:889`** |
| "EmptyState" page | `1523:243`-adjacent (created after "Alert") |
| "EmptyState — exploration" page | `1523:244` |
| Button component set | `347:14161` (key `32bcd323d4fe3a07a70ee5a56c998c1b20077b94`) |
| Icon component set | `153:1754` (key `da2000986513297ee3823cf917a294e6a39991f2`) |
| Icon `icon=search, size=xl` | `153:2047` |
| Alert component set | `1400:33113` |
| `Dropdown / Panel` (SLOT donor) | `668:42210` |
| Context variable collection | `VariableCollectionId:369:31958` — Comfortable `369:10` (default) / Compact `369:9` / Spacious `369:11` / Dense `369:8` |
| Primitives collection | `VariableCollectionId:4:2` |

## Blocker (resolved)

The first session was blocked for its entire second half by
`MCP error -32003: MCP tool call requires approval` on every write-capable
Figma call, across two independent servers, and concluded it was a
permission/scope issue above the plugin layer that a fresh session would not
clear.

**It cleared on its own.** This session's Desktop Bridge was already paired on
the local WebSocket transport (port 9223, plugin v1.39.0) with no pairing step
needed at all, and `figma_execute` worked immediately — including mutations and
the full variables API. No troubleshooting was required.

Keep the first session's advice anyway: **verify with a trivial write before
doing anything else** (`figma.createFrame()` → read `.id` → `.remove()`), since
the failure mode did recur mid-session once before.

Unrelated but worth recording: **`cargo` is not on `PATH` in this sandbox, but a
stable toolchain *is* installed** at
`~/.rustup/toolchains/stable-aarch64-apple-darwin/bin/` (the rustup shims are
missing from `~/.cargo/bin`). Adding that directory to `PATH` makes `cargo run`
work. Per the human's instruction this session, Rust is nonetheless left to CI —
do not run it locally.
