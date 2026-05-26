---
name: figma-token-sync
description: How the primitiv-sync-figma-plugin and @primitiv/tokens work together to back up Figma variables as DTCG JSON in the repo — features, the export flow (Live sync vs Downloads), the dtcg.ts collection routing, single-mode caveat, alias resolution, and the deliberately-removed one-shot migration code. TRIGGER when editing apps/primitiv-sync-figma-plugin or packages/tokens, when running a token backup, when adding a new Figma variable collection that needs routing, when the Live sync server is involved (localhost:4477), when extending the DTCG transform, or when asked to revisit the sync plugin UI. SKIP for harmoni-figma-plugin work, packages/react component work, and any non-token Figma exploration.
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
| **Export tokens** | Same extraction, then runs `figmaVarsToDtcg` to produce `{ primitives, semantic, components }` | The actual backup flow |
| **Live sync** (toggle) | Off: Export surfaces three `data:` URI download links (`primitives.json`, `semantic.json`, `components.json`). On: Export POSTs the payload to `http://localhost:4477/sync` and the server writes the files into `packages/tokens/src/` | Toggle is off by default — turn it on only when the local sync server is running |
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
   pnpm --filter @primitiv/tokens sync:serve     # equivalent
   ```
   Binds to `http://localhost:4477`. `POST /sync` accepts a
   `{ primitives, semantic, components }` body and writes each layer
   atomically into `packages/tokens/src/<layer>.json`.

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
   - Live sync **off** → the UI renders three download anchors. Save
     each into `packages/tokens/src/`.
   - Live sync **on** → the UI POSTs to `localhost:4477` and shows
     *Synced to localhost:4477* or an error from the server.

6. **Commit and push the resulting `packages/tokens/src/*.json`
   files.** They are the repo's source of truth for downstream
   transformers.

## How `figmaVarsToDtcg` is wired

`packages/tokens/src/dtcg.ts` is **pure** — no fs, no network. It
takes the sandbox's serialised payload (collections + variables) and
emits three DTCG groups.

### Collection routing

Collection names are matched **literally** by `routeCollection`:

| Figma collection name | Output file | Path prefix |
| --- | --- | --- |
| `Primitives` | `primitives.json` | `[]` |
| `Semantic` | `semantic.json` | `[]` |
| `Components` | `components.json` | `[]` |
| `Typography / Compact` | `semantic.json` | `['typography', 'compact']` |
| `Typography / Comfortable` | `semantic.json` | `['typography', 'comfortable']` |
| `Typography / Spacious` | `semantic.json` | `['typography', 'spacious']` |
| `Context / <name>` | `semantic.json` | `['context', '<name lower>']` |
| anything else | **throws** `Unrecognised collection name: <name>` |

The Typography and Context prefixes are regex-matched
(`/^Typography\s*\/\s*(.+)$/`, `/^Context\s*\/\s*(.+)$/`) so the
variant / context name is taken from whatever follows the slash,
lower-cased. The Context route lands under `semantic.context.<name>`
and is what the Bootstrap context action (RFC 0001 §15.10) emits to.

**Renaming a Figma collection breaks the export.** If you rename or
add a collection, update `routeCollection` in
`packages/tokens/src/dtcg.ts` and extend the test fixtures in
`packages/tokens/src/dtcg.test.ts`.

### Value emission

| Figma `resolvedType` | DTCG `$type` | DTCG `$value` |
| --- | --- | --- |
| `STRING` | `'string'` | passed through |
| `FLOAT` | `'number'` | passed through |
| `BOOLEAN` | `'boolean'` | passed through |
| `COLOR` | `'color'` | hex — `#rrggbb` opaque or `#rrggbbaa` translucent |

Aliases (`{ type: 'VARIABLE_ALIAS', id }`) become DTCG reference
strings of the form `{group.sub.name}`. The transform pre-computes
every variable's full DTCG path (routing prefix + slash-split name)
so cross-collection aliases resolve correctly — a Typography
variable's alias into `font-size/40` becomes
`{font-size.40}` because Primitives has an empty prefix.

### Single-mode only

Values are read from `collection.defaultModeId`. Multi-mode DTCG token
sets (one set per Figma mode) are deferred until needed. If the design
team adopts non-default modes for a routed collection, the export
silently emits only the default values — this is the next thing to
extend.

## The HTTP sync server

`packages/tokens/src/server.ts` is a thin `node:http` listener:

- **Bind**: `http://localhost:4477`.
- **Endpoint**: `POST /sync` only.
- **Body**: `{ primitives: DtcgGroup, semantic: DtcgGroup, components: DtcgGroup }`.
- **Write**: each layer pretty-printed to `packages/tokens/src/<layer>.json` atomically (write to `.tmp`, then rename).
- **CORS**: wide open. Safe because the only caller is the sync plugin's UI iframe, and the server never leaves loopback.

The plugin's network manifest (`manifest.json`) allows
`http://localhost:4477`. Don't widen that list further unless a new
transport is genuinely needed.

## When to extend / when not to

Add to this stack when:

- A new Figma variable collection needs DTCG routing.
- The shape of a token (extra metadata, multi-mode, $description)
  needs to change.
- A new export action is wanted (e.g. a per-mode export).

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
pnpm --filter @primitiv/tokens qa:units               # vitest + coverage
pnpm --filter @primitiv/tokens lint                   # tsc --noEmit
```

## Files to read first if you're modifying this stack

- `apps/primitiv-sync-figma-plugin/README.md` — plugin overview, two-runtime model.
- `apps/primitiv-sync-figma-plugin/src/shared/messages.ts` — postMessage contract between sandbox and UI.
- `apps/primitiv-sync-figma-plugin/src/code/handleMessage.ts` — sandbox-side router.
- `apps/primitiv-sync-figma-plugin/src/ui/App.tsx` — UI actions and Live sync behaviour.
- `packages/tokens/src/dtcg.ts` — the pure transform and routing table.
- `packages/tokens/src/server.ts` — local HTTP sync server.
- `packages/tokens/README.md` — package conventions, single-mode caveat.
