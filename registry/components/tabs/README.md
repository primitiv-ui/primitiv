# `tabs` — registry entry

The artefacts `primitiv add tabs` resolves and copies into a consumer repo. Tabs
is the **structural-compound proof** (RFC 0004 §3, D56): the first component whose
parts are **composed by the consumer** rather than auto-rendered. Where Button is
modifier-driven and single-element and Switch is state-driven with a decorative
slot, Tabs is a **root plus structural subcomponents** (`List` / `Trigger` /
`Content`) — and flows through the *same* `primitiv-emit` generators (D54).

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract (RFC 0004 §3.4) — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (the enclosed visual design). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `tabs.recipe.ts` | generated | One `cva` per styled part (from `contract.json`). |
| `tabs.tsx` | generated | The styled wrappers — `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` (from `contract.json`). |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form, recipe and wrapper are **generated** by `primitiv-emit` and pinned
to their source by drift-guard tests, so they can't fall out of sync (D53).

## The contract (`contract.json`)

A **hybrid** document with two halves and two sources of truth (D15):

- **`dataAttributes`** (on the root + each subcomponent) — `source: "auto"`.
  Derived from and **asserted against the rendered headless `Tabs`** by a
  drift-guard test (`packages/react/src/Tabs/__tests__/Tabs.contract.test.tsx`),
  so they can never drift. The root + list carry `data-orientation`; the trigger
  adds `data-state` (`"active"` / `"inactive"`) and `data-disabled` (empty when
  disabled — matching every other framed control); the content carries
  `data-state` + `data-orientation`.
- **`root` / `subcomponents` / `modifiers` / `customProperties`** — authored
  styling conventions the headless layer does not emit: the `.primitiv-tabs`
  root and the `__list` / `__trigger` / `__panel` BEM parts (D14), the root
  `size` modifier and the list `justify` modifier, and the `--primitiv-tabs-*`
  custom-property API.

`subcomponents` is what tells the generators this is a **structural compound**:
instead of one element (Button) or an auto-rendered subtree (Switch), the styled
surface is N thin per-part wrappers the consumer composes themselves (D56). Each
subcomponent carries its own BEM class and optional per-part modifiers — which is
why `justify` lives on the `list`, not the root. **`Position`** (which corners
round at the strip's edges) is *not* a prop: it is derived structurally in CSS
from DOM order (`:first-child` / `:last-child`), so the consumer just drops
triggers in and the edges clamp themselves.

## The default theme (`styles.css`)

The **enclosed** style: triggers are framed controls forming a connected strip —
`action/primary` when active, `action/secondary` when inactive — with the panel
butting flush below, sharing the trigger's 1px stroke family so the junction
reads as one frame. Structured per RFC 0008 — the per-component API tokens +
resting look in `primitiv.base`, the `justify` / `size` modifiers in
`primitiv.variants`, the `data-state` / `:hover` / `data-disabled` styling in
`primitiv.states`. It wires `--primitiv-tabs-*` to **semantic tokens only** —
`framed-control/*` for sizing, `action/*` + `surface/*` + `content/*` for colour,
`label/*` + `body/*` for type, `panel/padding/*` for the panel inset.

The Figma two-layer focus ring is **deferred** (a system-wide concern across every
framed control); Tabs uses the browser default until that lands, staying
consistent with Button and Switch.

**It is yours to edit.** The stable surface is the *contract* (classes, `data-*`,
custom-property names), not these values (RFC 0006 Principle 2). Horizontal
orientation only for v1; vertical is a deferred fast-follow. Requires the token
layer (`primitiv tokens`) for the `--primitiv-*` custom properties it resolves.

## The SCSS form (`styles.scss`)

CSS is canonical; SCSS is the same stylesheet re-expressed for `$`-pipeline
consumers (D: "Registry CSS, derive rest"). `styles.scss` is `styles.css`
**verbatim** followed by one `$primitiv-tabs-*` variable per `--primitiv-tabs-*`
knob the stylesheet declares. It is **derived, not hand-maintained**:
`primitiv-emit`'s `emit_component_scss` produces it from `styles.css` — the *same*
serialiser Button and Switch use — and a drift-guard test
(`crates/primitiv-emit/src/scss_tests.rs`) asserts the committed file is exactly
that output across all three sublayers.

## The styled surface (`tabs.recipe.ts` + `tabs.tsx`)

The primary DX is **flat, shadcn-shaped exports** the consumer composes (D56) —
the headless package is the Radix-equivalent (compound `Tabs.Root`); the styled
surface is the shadcn-equivalent (`Tabs` / `TabsList` / `TabsTrigger` /
`TabsContent`). Both files are **generated** from `contract.json` (D53):

- **`tabs.recipe.ts`** — one `cva` per styled part: `tabs` (the root `size`
  axis), `tabsList` (the `justify` axis), and base-only `tabsTrigger` /
  `tabsContent`. Each part has its own class engine.
- **`tabs.tsx`** — one thin wrapper per part, each applying its part class via its
  recipe and forwarding the rest to the headless `Tabs.{Root,List,Trigger,Content}`.
  The consumer writes the familiar shape:

  ```tsx
  <Tabs size="md">
    <TabsList justify="center">
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="settings">Settings</TabsTrigger>
    </TabsList>
    <TabsContent value="overview">…</TabsContent>
    <TabsContent value="settings">…</TabsContent>
  </Tabs>
  ```

The styled surface is **format-independent** and gated by the **styles opt-in**,
not the format (D55): any styled React consumer (css / scss / tailwind) gets the
same wrappers; the format only selects which stylesheet defines the rules behind
the classes. So `class-variance-authority` is a **styled-surface** dependency
(`registry.json` → `styles.packages`).

Drift guards in `crates/primitiv-emit/src/{recipe,wrapper}_tests.rs` assert each
committed artifact equals the generator's output for the committed contract.
