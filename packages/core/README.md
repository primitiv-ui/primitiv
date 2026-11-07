# @primitiv-ui/core

The framework-free behaviour core shared by every Primitiv surface. Pure
TypeScript functions with **no DOM, no framework and no dependencies**: keyboard
maps, roving-focus targets, id derivation and, as components move over, each
component's keyboard and state policy.

You do not normally install this package yourself. It arrives as a dependency
of the surface you chose: [`@primitiv-ui/react`](../react/README.md) today, and
`@primitiv-ui/web` (standard custom elements) as it lands. Both surfaces import
the same functions, so they cannot disagree about how a component behaves. See
[RFC 0033](../../docs/rfcs/0033-web-components.md) for the design.

## Exports

| Export | What it does |
| --- | --- |
| `getKeyToActionMap(options)` | Builds the key → roving action map (`"next"`, `"prev"`, `"first"`, `"last"`, `"activate"`) for an orientation, reading direction, Home/End and Enter/Space. |
| `RovingKeyAction` | The action vocabulary those maps return. |
| `deriveId(rootId, suffix, value)` | Builds the paired ids (`aria-controls`, `aria-labelledby`) a compound component wires between its parts. |

## Rules for this package

- **No DOM.** `tsconfig.json` leaves `DOM` out of `lib`, so a DOM type in a
  signature is a compile error.
- **100% coverage and 100% mutation score**, both gated: `pnpm qa:units` and
  `pnpm mutate`.
- **Versioned in lockstep** with every other Primitiv package
  (`scripts/bump-version.mjs`).
