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
| `src/index.ts` | Public entry; re-exports the transform and types |
| `src/*.test.ts` | Vitest unit tests, 100% coverage |

## Conventions

- Slash-separated Figma variable names (`font-family/sans`) become
  nested DTCG groups (`{ "font-family": { "sans": {…} } }`).
- Each token has `$type` and `$value`. Aliases (next cycle) will use
  DTCG's `{group.sub.name}` reference string.
- Colours emit as hex: `#rrggbb` opaque, `#rrggbbaa` translucent.
- Values are read from the collection's `defaultModeId`; multi-mode
  support is deferred to a later cycle.
