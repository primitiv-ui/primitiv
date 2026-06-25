# RFC 0013 — Configurable palette export (destination & naming)

> **Status:** Draft
> **Author:** simonrevill, with architectural review
> **Date:** 2026-06-25
> **Seeds from:** the 2026-06-25 plugin-frame feature-parity discussion — the
> workbench replica needs the plugin's export section, but the current export is
> hardcoded to the author's personal variable setup and must instead work for
> *any* user before it is worth replicating.
> **Relates to:** RFC 0002 (Harmoni → Intent → Plugin) — this generalises the
> last hop, where the engine's palette is written into Figma variables; RFC 0003
> (Dynamic foreground wiring) — the per-step foreground alias must survive a
> custom naming scheme; RFC 0010 §9 / RFC 0011 §8 — the plugin is rebuilt from
> scratch (ports & adapters + TDD) once the workbench feature set is locked, and
> the export flow is the missing piece of that set.
> Skills: `figma-variable-architecture` (collections, modes, the `/`-group
> naming), `figma-token-sync` (how variables are backed up as DTCG),
> `react-component-patterns` (MillerColumns / Tree).

---

## 0. Summary

The plugin's `applyPalette` (`apps/harmoni-figma-plugin/src/code/applyPalette.ts`)
writes the engine's ramps into Figma with three hardcoded choices:

```ts
const COLLECTION_NAME = 'Primitives / Palette'          // fixed collection
// fixed modes:
const lightMode = …'Light'; const darkMode = …'Dark'
// fixed name paths:
`color/${name}`                 // singles  (white / black)
`color/${ramp.name}/${step}`    // ramp steps
```

That is one designer's convention. Any other user has their own collection
structure, their own mode names, and their own variable-naming convention — so
today's export only works for the author. This RFC proposes a **configurable
export flow**: the user chooses **where** the palette is written (which
collection, which group location inside it, which modes) and **how** the
variables are named (a naming convention with a live preview), with today's
behaviour kept as the default preset so nothing regresses.

The moves:

1. **Export configuration is pure, serializable data.** A plain config object
   plus a pure function `resolve(config, palette) → planned variables` lives in
   shared code, testable to 100% with no Figma. The Figma writes
   (`createVariable`, `setValueForMode`) become a thin adapter behind a port —
   the same ports-&-adapters seam the CLI uses and the plugin rebuild will adopt.
2. **The UI is built and iterated in the workbench first**, against a sample
   collection tree, then the plugin supplies the real tree from
   `figma.variables.*`. One UI, two data sources.
3. **Dual audience by construction.** The author's flow is a saved preset; an
   end user gets a guided first run with a smart default. Same config object
   drives both.

## 0.1 Scope

In scope: the destination model (collection + group location + mode mapping), the
naming convention and its preview, the pure resolver and its port, the
destination-browser UX (MillerColumns / Tree), preset save/load + persistence,
and the workbench-first build. Out of scope: changes to the *engine* (the palette
it produces is unchanged), non-colour variable types, importing/reading a theme
back out of Figma (export only), and the cross-file publishing of a variable
library (a Figma feature, not ours).

---

## 1. Principles

### Principle 1 — Configuration is data, writing is an effect

The decision of *what variables to create and what to call them* is a pure
function of `(config, palette)`. Performing the writes is an effect behind a
`VariableStore` port. This keeps the naming/location logic 100%-testable and
shared between the workbench (fake store) and the plugin (real `figma` store),
exactly as `primitiv-cli` separates its pure core from the `FileSystem` port.

### Principle 2 — Works for the author *and* the stranger

The same serializable `ExportConfig` powers both audiences. The author saves
their setup (`Primitives / Palette`, `color/…`, Light/Dark) as a named preset;
a first-time user is handed that as the default and can drill in to retarget it.
No behaviour is reachable by one audience and not the other.

### Principle 3 — Never silently clobber

Writing into someone else's file must be legible and reversible-in-intent: the
flow previews exactly which variables will be created vs. overwritten before it
writes, and the per-step foreground aliasing (RFC 0003) is recomputed against
the chosen names rather than assuming the fixed `color/…` paths.

---

## 2. The Figma destination model

A Figma file holds **variable collections**; each collection has **modes** and
**variables**. A variable's `name` uses `/` as a group separator, so
`color/brand/500` renders as the nested group `color → brand → 500` in Figma's
variables panel. There is no separate "folder" entity — the group hierarchy is
purely the set of `/`-split name prefixes across the collection's variables.

Two consequences:

- **A destination is `(collection, groupPath)`** — e.g. collection
  `Primitives / Palette`, group path `color`. The browser drills the *existing*
  group prefixes and can create a new one by typing.
- **Naming is the rest of the path** appended to `groupPath` — e.g.
  `{groupPath}/{ramp}/{step}`. So "location" and "naming convention" are two
  ends of the same variable name; the UI splits them where the user stops
  browsing and starts templating.

Modes are independent: a collection may have `Light`/`Dark`, or density modes
(RFC 0009), or one default mode. The export must **map** the palette's light/dark
values onto whichever modes the user picks, creating `Light`/`Dark` only when the
user opts into the default preset on a fresh collection.

## 3. The export configuration

```ts
type ExportConfig = {
  // Destination
  collection: { kind: 'existing'; id: string } | { kind: 'new'; name: string }
  groupPath: string                 // e.g. "color"  ("" = collection root)
  modes: {
    light: { kind: 'existing'; id: string } | { kind: 'new'; name: string }
    dark?: { kind: 'existing'; id: string } | { kind: 'new'; name: string }
    // omit `dark` → single-mode export (light values only)
  }

  // Naming convention
  naming: {
    rampTemplate: string            // default "{group}/{ramp}/{step}"
    singleTemplate: string          // default "{group}/{name}"
    separator: string               // default "/"
    stepLabels: 'numeric' | 'index' | string[]   // 50..900 | 0..9 | custom
    case: 'asis' | 'kebab' | 'snake' | 'camel'
  }

  writeMode: 'create-and-overwrite' | 'create-only'   // clobber policy
}
```

`{group}` expands to `groupPath`, `{ramp}`/`{name}` to the ramp/single name,
`{step}` to the resolved step label, `{mode}` (optional) to the mode name. The
default config reproduces `applyPalette` exactly (Principle 2 / regression
guard).

The pure resolver:

```ts
type PlannedVariable = {
  name: string                      // fully-resolved Figma variable name
  type: 'COLOR'
  valuesByMode: { modeRef: ModeRef; rgba: RgbaColor }[]
  alias?: { modeRef: ModeRef; targetName: string }   // foreground (RFC 0003)
  status: 'create' | 'overwrite'    // vs. the file's existing variables
}

resolve(config: ExportConfig, palette: ExportPayload, existing: ExistingTree)
  : { planned: PlannedVariable[]; warnings: string[] }
```

`resolve` is pure and exhaustively testable: every template token, every
`stepLabels`/`case` branch, the clobber policy, and the alias retargeting are
driven by unit tests with a fake `ExistingTree`.

## 4. UX

The export panel becomes a small flow with three parts, all reading/writing the
one `ExportConfig`:

### 4.1 Destination browser — MillerColumns (recommended), Tree as alt

Collections → groups → subgroups is a drill-down of a `/`-delimited hierarchy,
which is exactly the **MillerColumns** mental model (column per level, pick a
node or type to create a new one — like a file open dialog). It scales to deep
group trees without a tall expanded panel and makes "create here" obvious at the
focused column.

**Tree** is the alternative: a denser single-pane overview that's better when the
user wants to *see* the whole existing structure at once. **Open question (O1):**
ship MillerColumns first, or Tree, or both behind a toggle.

In the workbench the columns are fed a **sample collection tree**; in the plugin
the same component is fed the real tree built from
`getLocalVariableCollectionsAsync()` + variable-name parsing. The component never
knows the difference (Principle 1).

### 4.2 Naming convention editor

The naming fields (`rampTemplate`, `separator`, `stepLabels`, `case`, optional
prefix) above a **live preview** that shows the first few resolved variable names
for the current palette (e.g. `color/brand/50`, `color/brand/100`, …). The
preview is just `resolve(config, …)` run on a sample — no Figma needed — so it is
honest about exactly what will be written.

### 4.3 Mode mapping

Pick which existing mode receives light values and which receives dark (or "write
a single mode"). On a brand-new collection, the default preset offers to create
`Light` and `Dark`. Collections with density or other modes are handled by
mapping, not assumption.

### 4.4 Presets & persistence

Ship one built-in preset — **"Primitiv default"** = today's behaviour. Users can
save the current `ExportConfig` as a named preset and reselect it. Persist the
last-used config + presets via plugin storage (`figma.clientStorage` /
`root.setPluginData`) in the plugin and `localStorage` in the workbench, so a
reload or a new session restores the user's setup. The author's personal
convention is simply the preset they save and keep selected.

### 4.5 Mock up in Figma first

Before any of this is built, the flow — destination browser, naming editor with
its live preview, mode mapping, presets — should be **wireframed in Figma** to
settle the layout and the step-by-step UX (what's one screen vs. a disclosure,
where "create new" lives, how the preview sits next to the template fields). The
author can launch a **Figma-console-mcp** session from their machine and drive
the mock-ups with one-shot console scripts (see the `figma-console-scripts`
skill); the wireframes then become the reference the workbench UI is built
against. Settle O1 (MillerColumns vs Tree) on the mock-up, not in code.

## 5. Architecture & build

- **Pure core** (`exportConfig.ts` + `resolve.ts`) — the `ExportConfig` type and
  the `resolve` function. No React, no Figma. 100% unit-tested.
- **Port** — `VariableStore` with `listTree()` and `apply(planned)`; a fake
  in-memory implementation for the workbench and tests, the real `figma`
  implementation in the (rebuilt) plugin.
- **UI** — the destination browser + naming editor + mode mapping, controlled by
  `ExportConfig`, built and iterated on the **workbench plugin-frame page**.
- The current `applyPalette` / `figmaIdempotent` become the first real adapter
  implementation when the plugin is rebuilt (RFC 0011 §8); their logic is the
  reference for the `figma` `VariableStore`.

This is the same seam the CLI proved (RFC 0007). The export flow is therefore not
throwaway workbench scaffolding — its core and its UI are the spec the plugin
rebuild consumes.

## 6. Decisions

| # | Decision |
|---|---|
| D1 | **Destination = `(collection, groupPath)`; naming = the remaining path.** Location and naming are two ends of one variable name, split where browsing stops and templating begins. |
| D2 | **`ExportConfig` is pure, serializable data**; resolution is a pure function; writing is a `VariableStore` port (Principle 1). |
| D3 | **Today's behaviour is the built-in "Primitiv default" preset** and the resolver reproduces it exactly (Principle 2 regression guard). |
| D4 | **Preview before write.** The flow shows planned create/overwrite per variable; nothing is written blind (Principle 3). |
| D5 | **Modes are mapped, not assumed.** Light/Dark are created only on the default-preset path for a fresh collection. |
| D6 | **Built workbench-first** against a fake `VariableStore`, then the plugin supplies the real one — one UI, two adapters. |

## 7. Open questions

- **O1 — MillerColumns vs Tree (vs both)** for the destination browser. Leaning
  MillerColumns for the create-as-you-drill flow; Tree as a possible overview
  toggle. Settle before the browser is built.
- **O2 — Naming template syntax.** A token string (`{group}/{ramp}/{step}`) is
  proposed; the alternative is a small set of structured dropdowns. The string is
  more expressive but needs validation + a forgiving parser.
- **O3 — Clobber policy default.** `create-and-overwrite` (idempotent re-export,
  matches today) vs `create-only` (never touch an existing variable). Proposed
  default: overwrite, with the preview making it explicit.
- **O4 — Foreground aliases under custom names (RFC 0003).** The per-step
  foreground alias points at another variable by name; confirm the resolver
  rewrites those targets through the same naming convention so aliases still
  resolve after a rename.
- **O5 — Persistence scope.** Per-file (`root.setPluginData`) vs per-user
  (`clientStorage`) vs both (presets per-user, last-used per-file). Likely both.

## 8. Status

Draft. Seeds the export-UX work that must land in the workbench before the plugin
is rebuilt. The pure `ExportConfig` + `resolve` core and the destination browser
are the substance; O1–O5 are the decisions to settle before the config shape and
the browser layout are frozen.
