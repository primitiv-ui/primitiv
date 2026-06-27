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

**Motion tokens.** Durations are plain `FLOAT` variables (`duration/150`
→ `$type: number`, value `150`); the CLI emitter adds the `ms` unit from
the `duration` path category, so nothing special is needed here or in the
transform. **Easing curves have no Figma variable type** — Figma only has
`FLOAT`/`STRING`/`COLOR`/`BOOLEAN` — so they are **not** DTCG tokens and are
**not** synced. They live as static custom properties in the base stylesheet
(`crates/primitiv-emit/assets/base.{css,scss}`): `--primitiv-easing-*` and the
semantic `--primitiv-motion-easing-*`. Don't add `easing`/`motion.easing` to any
DTCG file — a backup would not produce them, and the durations alias only
duration primitives, never easings.

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
