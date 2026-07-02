---
name: figma-token-sync
description: How the primitiv-sync-figma-plugin and @primitiv-ui/tokens back up Figma variables as DTCG JSON in the repo. TRIGGER when editing apps/primitiv-sync-figma-plugin or packages/tokens, running a token backup, adding a Figma variable collection that needs routing, using the Live sync server (localhost:4477), extending the DTCG transform, or revisiting the sync plugin UI. SKIP for harmoni-figma-plugin work, packages/react component work, and any non-token Figma exploration.
---

# Figma → DTCG token sync

The sync stack is two pieces of code, wired through Figma's plugin
message contract:

| Piece | Path | Role |
| --- | --- | --- |
| **Sync plugin** | `apps/primitiv-sync-figma-plugin/` | Reads variables from inside Figma; offers Export / Inspect / Close |
| **Tokens package** | `packages/tokens/` | Pure `figmaVarsToDtcg` transform + `localhost:4477` HTTP sync server + on-disk DTCG snapshots |

The plugin is **internal-only** — never submitted to Figma Community.
The consumer-facing plugin is `apps/harmoni-figma-plugin`, which has
zero sync code. Keep that separation: anything to do with token
extraction, DTCG shaping, or repo writes belongs in this stack, not in
the Harmoni plugin.

## What the plugin currently does

The UI (`src/ui/App.tsx`) exposes three actions and one toggle. The
sandbox (`src/code/handleMessage.ts`) handles them by talking to
`figma.variables.*` and the UI in turn:

| Action | What happens | Used for |
| --- | --- | --- |
| **Inspect variables** | Dumps every local collection + variable as raw JSON in the UI's `<pre>` panel | Debugging the Figma side; sanity-checking what the plugin sees |
| **Export tokens** | Same extraction, then runs `figmaVarsToDtcg` to produce `{ primitives, palette, intent, context, interaction }` | The actual backup flow |
| **Live sync** (toggle) | Off: Export surfaces five `data:` URI download links. On: Export POSTs the payload to `http://localhost:4477/sync` and the server writes the files into `packages/tokens/src/` | Toggle is off by default — turn it on only when the local sync server is running |
| **Close** | `figma.closePlugin()` | Standard plugin exit |

There is **no** migration UI any more. The Typography → Semantic move
was a one-shot, completed and intentionally removed in commit
`7459747 Remove migration code now that the Typography → Semantic
move is done`. Reinstating it means restoring `planMigration` /
`executeMigration` and the migrate-* message types from git history.

## How a token backup runs (the happy path)

1. **Start the sync server (only if you want Live sync):**
   ```sh
   pnpm tokens:sync                              # repo-root alias
   pnpm --filter @primitiv-ui/tokens sync:serve     # equivalent
   ```
   Binds to `http://localhost:4477`. `POST /sync` accepts a
   `{ primitives, palette, intent, context, interaction }` body and
   writes each file atomically into `packages/tokens/src/<name>.json`.

2. **Watch-build the plugin:**
   ```sh
   pnpm --filter primitiv-sync-figma-plugin dev
   ```
   Produces `dist/code.js` (sandbox) and `dist/index.html` (UI).

3. **Load the plugin in Figma desktop:** *Plugins → Development →
   Import plugin from manifest…* and pick
   `apps/primitiv-sync-figma-plugin/manifest.json`. The browser
   version of Figma cannot load local plugins.

4. **Run the plugin from the design file.** The UI's banner shows
   *Connected to: <page name>* once the sandbox sends `plugin-ready`.

5. **Click Export tokens.**
   - Live sync **off** → the UI renders five download anchors. Save
     each into `packages/tokens/src/`.
   - Live sync **on** → the UI POSTs to `localhost:4477` and shows
     *Synced to localhost:4477* or an error from the server.

6. **Commit and push the resulting `packages/tokens/src/*.json`
   files.** They are the repo's source of truth for downstream
   transformers.

## How `figmaVarsToDtcg` is wired

`packages/tokens/src/dtcg.ts` is **pure** — no fs, no network. It
takes the sandbox's serialised payload (collections + variables) and
emits five DTCG groups stored in `DtcgFiles`.

### Collection routing

Collections are split into two categories before routing:

**Multi-mode collections** — iterated per mode; mode name (lowercased)
becomes the top-level key in that file:

| Figma collection name | Output file |
| --- | --- |
| `Primitives / Palette` | `palette.json` |
| `Intent` | `intent.json` |
| `Context` | `context.json` |

**Single-mode collections** — matched by name whitelist; variables are
read from `defaultModeId`:

| Figma collection name | Output file | Path prefix |
| --- | --- | --- |
| `Primitives` | `primitives.json` | `[]` |
| `Interaction` | `interaction.json` | `[]` |

Any collection not in either list is **silently dropped** — the export
continues without it. This means legacy collections left over in Figma
(e.g. old `Semantic`, `Components`, or per-density `Context / *`
collections) are ignored rather than crashing the export.

**Palette constants exclusion** — `color/absolute-white` and
`color/absolute-black` are design-system constants that Harmoni never
writes. They are excluded from the `Primitives / Palette` backup via the
`PALETTE_CONSTANTS` set passed to `collectionToDtcg` in `figmaVarsToDtcg`.
Do not remove this exclusion — if these variables were exported, a future
Harmoni sync import could overwrite them with palette-relative values.

**Renaming or adding a collection** that you want routed: add it to
the multi-mode block or the `singleMode` whitelist filter in
`figmaVarsToDtcg`, add a route to `routeCollection` if single-mode,
and extend the test fixtures in `dtcg.test.ts`.

### Alias resolution

The transform pre-computes every variable's DTCG path from its
**natural name** (slash-split, no collection prefix). Variable names
are unique across the system, so cross-collection aliases resolve
correctly regardless of which file the target variable lives in.

A `Context` variable aliasing `space/8` from `Primitives` becomes
`{space.8}` in the output.

### Value emission

| Figma `resolvedType` | DTCG `$type` | DTCG `$value` |
| --- | --- | --- |
| `STRING` | `'string'` | passed through |
| `FLOAT` | `'number'` | passed through |
| `BOOLEAN` | `'boolean'` | passed through |
| `COLOR` | `'color'` | hex — `#rrggbb` opaque or `#rrggbbaa` translucent |

Aliases (`{ type: 'VARIABLE_ALIAS', id }`) become DTCG reference
strings of the form `{group.sub.name}`.

**Motion tokens are code-only.** The whole motion scale — `duration/*`,
`easing/*`, and the semantic `motion.*` layer — lives in
`packages/tokens/src/motion.json`, which has **no Figma collection** and is
**never produced by a backup**. Figma variables are only
`FLOAT`/`STRING`/`COLOR`/`BOOLEAN`, so a `cubicBezier` easing has no Figma type;
durations could be FLOAT but can't drive anything in Figma, so the whole scale is
kept code-side rather than split. `motion.json` is a sixth DTCG file outside this
sync's five-file write-set — that is exactly what keeps it safe from being
overwritten. **Do not add a `Motion` collection to the routing tables** below or
author motion variables in Figma; it would defeat the point. (Durations emit `ms`
from the `duration` path category in the CLI emitter; easings emit via the
`cubicBezier` → `cubic-bezier()` path.)

## The HTTP sync server

`packages/tokens/src/server.ts` is a thin `node:http` listener:

- **Bind**: `http://localhost:4477`.
- **Endpoint**: `POST /sync` only.
- **Body**: `{ primitives, palette, intent, context, interaction }` (each a `DtcgGroup`).
- **Write**: each file pretty-printed to `packages/tokens/src/<name>.json` atomically (write to `.tmp`, then rename).
- **CORS**: wide open. Safe because the only caller is the sync plugin's UI iframe, and the server never leaves loopback.

The plugin's network manifest (`manifest.json`) allows
`http://localhost:4477`. Don't widen that list further unless a new
transport is genuinely needed.

## The Dark-mode neutral-alias translation (do not skip this)

Figma's `Intent` collection and our CSS emitter resolve cross-collection
`neutral/*` aliases through **two different mechanisms**, and porting a value
from one to the other without translating it silently reproduces the
double-invert bug described in `figma-variable-architecture`'s theming rule —
except this time in code, not on the canvas (fixed 2026-07-02 across
`content/primary`, `content/secondary`, `surface/subtle`, `surface/raised`,
`surface/overlay`, `surface/inverse`, `surface/sunken`, `border/subtle`,
`border/default`, `table/row/stripe`, `table/row/hover`, and the whole
`action/secondary/*` family — see `packages/tokens/src/dark-mode-content.test.ts`).

- **Figma always resolves these aliases through `Primitives / Palette`'s
  *Light* mode**, regardless of which Intent mode you're looking at (per
  `figma-variable-architecture`'s `SKILL.md`). A Dark-Intent variable that
  aliases `neutral/50` is *not* pulling the Dark ramp's step 50 — it's Light's
  step 50, chosen specifically because it looks right for dark mode.
- **Our CSS emitter does not work that way.** `crates/primitiv-emit`'s
  `link_aliases` (`alias.rs`) turns `{color.neutral.50}` into
  `var(--primitiv-color-neutral-50)` — a bare reference, not a resolved value.
  `pipeline.rs`'s `ordered_modes` then merges every source document's tokens
  **by matching mode name** into one scope, so inside `[data-theme="dark"]`,
  that `var()` picks up whatever `palette.json`'s own `"dark"` section defines
  for `neutral.50` — a **separately Harmoni-generated dark ramp**, not Light's.
  (`packages/tokens/src/palette.json`'s `"dark"` section is real and correct —
  confirmed byte-identical to Figma's own `Primitives / Palette` Dark mode —
  it's just resolved differently than Figma resolves it.)
- **The consequence:** copying Figma's Dark-mode alias step number verbatim
  into `packages/tokens/src/intent.json`'s `"dark"` section is wrong. Our dark
  ramp is *approximately* Light's ramp mirrored (`dark.neutral.50 ≈
  light.neutral.900`, exact at the 50/900 extremes, a close approximation
  elsewhere), so the step that reproduces the *same visual result* in our
  emitter is **the nearest step in our own dark ramp to
  `lightRamp[figmaDarkStep]`** — empirically close to `950 − figmaDarkStep`,
  but compute it by actual hex distance, don't just subtract:
  ```py
  # given our own (confirmed Figma-synced) palette.json, per neutral step:
  target = light_ramp[figma_dark_alias_step]
  our_dark_step = min(steps, key=lambda s: color_distance(dark_ramp[s], target))
  ```
- **`packages/tokens/src/dark-mode-content.test.ts`** is the regression guard:
  it asserts each theme-relative token differs between light/dark and meets
  WCAG AA against its paired surface, and that the two deliberately
  mode-invariant tokens (`surface/selected`, `content/on-selected` — see
  `figma-variable-architecture`'s intent-tokens reference) stay visually
  consistent instead. **Any new Intent token that aliases `neutral/*` should
  get a case added here**, not just a value added to `intent.json`.

## When to extend / when not to

Add to this stack when:

- A new Figma variable collection needs DTCG routing.
- The shape of a token (extra metadata, $description) needs to change.
- A new export action is wanted.

Do **not** add to this stack:

- Token consumers (CSS variables, Tailwind config, ts modules). Those
  read from `packages/tokens/src/*.json` and live in their own
  package or in the consuming app.
- Anything that belongs in the consumer Harmoni plugin. Keep the
  consumer surface free of sync code.

## Useful commands

```sh
# Plugin
pnpm --filter primitiv-sync-figma-plugin dev          # watch builds for Figma
pnpm --filter primitiv-sync-figma-plugin qa:units     # vitest + coverage
pnpm --filter primitiv-sync-figma-plugin build        # one-shot prod build

# Tokens
pnpm tokens:sync                                      # boot local sync server
pnpm --filter @primitiv-ui/tokens qa:units               # vitest + coverage
pnpm --filter @primitiv-ui/tokens lint                   # tsc --noEmit
```

## Files to read first if you're modifying this stack

- `apps/primitiv-sync-figma-plugin/README.md` — plugin overview, two-runtime model.
- `apps/primitiv-sync-figma-plugin/src/shared/messages.ts` — postMessage contract between sandbox and UI.
- `apps/primitiv-sync-figma-plugin/src/code/handleMessage.ts` — sandbox-side router.
- `apps/primitiv-sync-figma-plugin/src/ui/App.tsx` — UI actions and Live sync behaviour.
- `packages/tokens/src/dtcg.ts` — the pure transform and routing table.
- `packages/tokens/src/server.ts` — local HTTP sync server.
- `packages/tokens/README.md` — package conventions.
