# `avatar` — registry entry

The artefacts `primitiv add avatar` resolves and copies into a consumer repo.
Avatar is a **structural compound** like Tabs (RFC 0004 §3, D56): the styled
surface is a root plus two consumer-composed subcomponents (`Image` /
`Fallback`), flowing through the same `primitiv-emit` generators (D54) rather
than a hand-authored escape hatch.

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract (RFC 0004 §3.4) — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (the sized, clipped image/fallback frame). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `avatar.recipe.ts` | generated | One `cva` per styled part (from `contract.json`). |
| `avatar.tsx` | generated | The styled wrappers — `Avatar` / `AvatarImage` / `AvatarFallback` (from `contract.json`). |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form, recipe and wrapper are **generated** by `primitiv-emit` and pinned
to their source by drift-guard tests, so they can't fall out of sync (D53).

## The contract (`contract.json`)

A **hybrid** document with two halves and two sources of truth (D15):

- **`dataAttributes`** (on the root + each subcomponent) — `source: "auto"`.
  Mirrors the headless `Avatar`'s single `data-status` mechanism
  (`"idle"` / `"loading"` / `"loaded"` / `"error"`), which `Avatar.Root` owns and
  `Avatar.Image` / `Avatar.Fallback` both reflect.
- **`root` / `subcomponents` / `modifiers` / `customProperties`** — authored
  styling conventions the headless layer does not emit: the `.primitiv-avatar`
  root and the `__image` / `__fallback` BEM parts, the root's `size` and `shape`
  modifiers, and the `--primitiv-avatar-*` custom-property API.

`subcomponents` is what tells the generators this is a **structural compound**:
instead of one element (Button) or an auto-rendered subtree (Switch), the styled
surface is thin per-part wrappers the consumer composes themselves (D56), exactly
mirroring how the headless `Avatar.Root` / `.Image` / `.Fallback` compose.
Neither subcomponent carries its own modifiers, but `fallback` does opt into
`wrapTextChildren` (added after a real optical-centring bug — see below):
`.primitiv-avatar__fallback` stays the flex-centred frame (icon content passes
through it unwrapped), but its initials text now gets wrapped into a nested
`.primitiv-avatar__fallback-label` span, since `text-box-trim` — the property
that actually delivers optical centring — silently does nothing on a flex
container (registry-stylesheet-conventions) and needs a dedicated wrapper.

## The default theme (`styles.css`)

Root is a **fixed-size clipping frame**: `.primitiv-avatar` sets its own
`inline-size`/`block-size` off `--primitiv-avatar-size`, clips via `overflow:
hidden` + `border-radius`, and draws the ring as its own `border`. `__image` and
`__fallback` both absolutely fill that frame (`inset: 0`) — only one is ever
meant to be visible, so there's no crossfade to choreograph. The image uses
`object-fit: cover` (the CSS equivalent of Figma's `IMAGE` paint `scaleMode:
FILL`) and stays mounted through every non-loaded status so its load lifecycle
isn't lost; the `primitiv.states` layer just toggles its `display` off
`data-status`, leaving the fallback showing through underneath.

Sizing and the fallback's icon size reuse the shared `framed-control/*` Context
scale directly (Figma binds the avatar frame to the same `framed-control/{size}/
height` token every other sized control uses, not an avatar-specific size
token). Corner radius is genuinely avatar-specific: `avatar/radius/{xs…xl}` and
`avatar/radius/full` are their own token family (pre-existing in
`packages/tokens/src/context.json`, aliasing `framed-control/*/radius` 1:1 today
but free to diverge later) — `shape="circle"` (the default) always resolves to
`avatar/radius/full` regardless of size; `shape="square"` swaps in the
size-scaled `avatar/radius/{size}`. The fallback's background/foreground pair
(`action/secondary/default` + `.../foreground/default`) and its initials type
(`label/{size}/font-family|font-weight|font-size`, Khand SemiBold) are both
lifted directly from the live Figma component (`433:7944`) via the Desktop
Bridge — including the deliberate `line-height: 1` rather than a `label/*/
line-height` token, since Figma's own initials text is unbound/`AUTO`
line-height so the glyph hugs the flex-centred frame exactly; a line-height
token would add leading the design doesn't have and throw the centring off.
**`line-height: 1` alone wasn't precise enough**, though: a real screenshot
showed the initials sitting visibly high in the circle, not truly centred —
most fonts' ascent/descent split isn't symmetric around the glyph even at
`line-height: 1`. `text-box-trim: trim-both` / `text-box-edge: cap alphabetic`
on the new `.primitiv-avatar__fallback-label` span (not the flex container —
see above) is the actual fix; `line-height: 1` on the frame is harmless but
redundant now that trim owns the precise centring.
**One flagged Figma↔registry drift**, in the same spirit as Select's and
Dropdown's already-documented ones: Figma's `Placeholder` (icon) variant fills
the icon with `content/secondary`, a different neutral than the `Initials`
variant's text colour (`action/secondary/foreground/default`) — the registry
uses the single `--primitiv-avatar-fallback-fg` (the `action/secondary/*`-paired
foreground, the semantically-correct token for that background) for both, via
`currentColor` on the fallback's `color`, rather than adding a second
fallback-content-type colour knob nobody asked for.

Structured per RFC 0008 — the per-component API tokens + resting look in
`primitiv.base`, the `size` / `shape` re-pointing in `primitiv.variants`, the
status-driven image visibility in `primitiv.states`.

**It is yours to edit.** The stable surface is the *contract* (classes,
`data-*`, custom-property names), not these values (RFC 0006 Principle 2 —
names are stable, values are not). Requires the token layer (`primitiv tokens`)
for the `--primitiv-framed-control-*`, `--primitiv-avatar-radius-*`,
`--primitiv-border-*`, `--primitiv-action-*`, `--primitiv-label-*` and
`--primitiv-content-*` custom properties it resolves.

## The SCSS form (`styles.scss`)

CSS is canonical; SCSS is the same stylesheet re-expressed for `$`-pipeline
consumers. `styles.scss` is `styles.css` **verbatim** followed by one
`$primitiv-avatar-*` variable per `--primitiv-avatar-*` knob the stylesheet
declares. It is **derived, not hand-maintained**: `primitiv-emit`'s
`emit_component_scss` produces it from `styles.css`, and a drift-guard test
(`crates/primitiv-emit/src/scss_tests.rs`) asserts the committed file is exactly
that output.

## The styled surface (`avatar.recipe.ts` + `avatar.tsx`)

The primary DX is **flat, shadcn-shaped exports** the consumer composes (D56) —
the headless package is the Radix-equivalent (compound `Avatar.Root` / `.Image`
/ `.Fallback`); the styled surface is the shadcn-equivalent (`Avatar` /
`AvatarImage` / `AvatarFallback`). Both files are **generated** from
`contract.json` (D53):

- **`avatar.recipe.ts`** — one `cva` per styled part: `avatar` (the root's
  `size` + `shape` axes) and base-only `avatarImage` / `avatarFallback`.
- **`avatar.tsx`** — one thin wrapper per part, each applying its part class via
  its recipe and forwarding the rest to the headless
  `Avatar.{Root,Image,Fallback}`. The consumer writes the familiar shape:

  ```tsx
  <Avatar size="md">
    <AvatarImage src={user.avatarUrl} alt={user.name} />
    <AvatarFallback>{initials(user.name)}</AvatarFallback>
  </Avatar>
  ```

The styled surface is **format-independent** and gated by the **styles opt-in**,
not the format (D55): any styled React consumer (css / scss / tailwind) gets the
same wrappers; the format only selects which stylesheet defines the rules behind
the classes. So `class-variance-authority` is a **styled-surface** dependency
(`registry.json` → `styles.packages`).

Drift guards in `crates/primitiv-emit/src/{recipe,wrapper}_tests.rs` assert each
committed artifact equals the generator's output for the committed contract.
