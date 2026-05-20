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
| `src/{primitives,semantic,components}.json` | DTCG output written by the sync server (gitignored once we start tracking real data) |

## Running the sync server

```sh
pnpm tokens:sync               # alias from the repo root
pnpm --filter @primitiv/tokens sync:serve   # equivalent
```

The server binds to `http://localhost:4477` and accepts a single
endpoint, `POST /sync`, whose body is `{ primitives, semantic,
components }`. It writes each layer to its own pretty-printed JSON
file in `src/`. CORS is wide open because the sync plugin is the only
caller and never leaves loopback.

## Conventions

- Slash-separated Figma variable names (`font-family/sans`) become
  nested DTCG groups (`{ "font-family": { "sans": {…} } }`).
- Each token has `$type` and `$value`. Aliases (next cycle) will use
  DTCG's `{group.sub.name}` reference string.
- Colours emit as hex: `#rrggbb` opaque, `#rrggbbaa` translucent.
- Values are read from the collection's `defaultModeId`; multi-mode
  support is deferred to a later cycle.
