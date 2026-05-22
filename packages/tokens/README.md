# @primitiv/tokens

The DTCG-conformant token layer that sits between the Figma source of
truth and any downstream consumer.

Internal-only — this package is not published. It is the destination
the `primitiv-sync-figma-plugin` writes to, and the source any future
token transformer (e.g. CSS variables, Tailwind config) reads from.

## Layout

| File | Contents |
| --- | --- |
| `src/dtcg.ts` | Pure transform: Figma-shaped variables → DTCG group |
| `src/server.ts` | Local HTTP server (`POST /sync`) that writes the three DTCG files atomically |
| `src/serve.ts` | Boot script for the sync server |
| `src/index.ts` | Public entry; re-exports the transform, the server, and types |
| `src/*.test.ts` | Vitest unit tests, 100% coverage |
| `src/{primitives,semantic,components}.json` | DTCG output written by the sync server. **Committed** — these files are the repo's source of truth for downstream transformers. |

## Backing up tokens (end-to-end)

The backup cycle pushes the current state of the Figma variables
into `src/*.json` so the repo stays the source of truth. Two pieces
run side by side: this package's local HTTP server, and the
`primitiv-sync-figma-plugin` loaded into Figma desktop. You need
the **Figma desktop app** — figma.com in a browser cannot load
local plugins.

### 1. Install dependencies (first time, or after a pull)

```sh
pnpm install
```

If `pnpm tokens:sync` later errors with `tsx: not found`, you
skipped or missed this step.

### 2. Boot the sync server — terminal 1

```sh
pnpm tokens:sync
```

Binds to `http://localhost:4477`. Logs the bind on success. Leave
this running for the duration of the backup. `Ctrl-C` to stop.

### 3. Watch-build the plugin — terminal 2

```sh
pnpm --filter primitiv-sync-figma-plugin dev
```

Produces `apps/primitiv-sync-figma-plugin/dist/code.js` (sandbox)
and `dist/index.html` (UI). Stays running and rebuilds on change.

### 4. Load the plugin into Figma desktop (one-time per machine)

In Figma desktop: **Plugins → Development → Import plugin from
manifest…** and select
`apps/primitiv-sync-figma-plugin/manifest.json`. After this Figma
remembers it under **Plugins → Development → Primitiv Sync**.

### 5. Run the plugin against your design file

Open the Figma file that owns the variables. **Plugins →
Development → Primitiv Sync**. The UI banner shows
*Connected to: <page name>* once the sandbox sends `plugin-ready`.

### 6. Turn the **Live sync** toggle on

Off by default. With Live sync on, Export POSTs to the running
server. With it off, Export gives you three download anchors
(`primitives.json`, `semantic.json`, `components.json`) — save
each into `packages/tokens/src/` by hand.

### 7. Click **Export tokens**

The plugin extracts every local collection + variable via
`figma.variables.*`, runs `figmaVarsToDtcg`, and POSTs
`{ primitives, semantic, components }` to `localhost:4477/sync`.
The UI confirms *Synced to localhost:4477* on success; the server
writes each layer atomically (write to `.tmp`, then rename).

### 8. Verify and commit

```sh
git status packages/tokens/src
git diff   packages/tokens/src
git add    packages/tokens/src/{primitives,semantic,components}.json
git commit -m "tokens: sync from figma"
git push
```

Downstream transformers (CSS variables, Tailwind config, etc.)
read from these three files — committing them is what makes the
backup "real".

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `sh: 1: tsx: not found` when running `pnpm tokens:sync` | `node_modules` missing or stale | `pnpm install`, then retry |
| Plugin UI reports an error on Export with Live sync **on** | Server isn't running, or `4477` is owned by another process | Check terminal 1 is alive; `lsof -i :4477` if you suspect a port clash |
| Server throws `Unrecognised collection name: <name>` | A new Figma collection isn't in the routing table | Add a case to `routeCollection` in `src/dtcg.ts` and extend `src/dtcg.test.ts` |
| Want a one-off backup without booting the server | Live sync is unnecessary for a single pull | Leave Live sync **off**, click Export, save the three download anchors into `src/` manually |

## Conventions

- Slash-separated Figma variable names (`font-family/sans`) become
  nested DTCG groups (`{ "font-family": { "sans": {…} } }`).
- Each token has `$type` and `$value`. Aliases (next cycle) will use
  DTCG's `{group.sub.name}` reference string.
- Colours emit as hex: `#rrggbb` opaque, `#rrggbbaa` translucent.
- Values are read from the collection's `defaultModeId`; multi-mode
  support is deferred to a later cycle.
