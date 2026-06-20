# Registry stylesheet conventions

Notes for authoring the copied component stylesheets (`<component>/styles.css`
and its `.scss` mirror). The layer structure lives in RFC 0008; this file
captures the **no-magic-numbers** rule and its edges.

## Tokenize literals — don't hard-code values

Every value that maps to a design token must be written as that token's custom
property (`var(--primitiv-…)`), **not** a raw literal. The stable surface is the
token contract; literals bypass it and can't be re-themed (RFC 0006 Principle 2 —
names are stable, values are not).

This applies to **intent-carrying and structural values alike**, including zeros:

| Literal                         | Use instead                                   |
| ------------------------------- | --------------------------------------------- |
| `9999px` (pill radius)          | `var(--primitiv-radii-full)`                  |
| `border: 0`, `border-block: 0`  | `var(--primitiv-border-width-0)`              |
| `padding: 0`                    | `var(--primitiv-space-space-0)` *             |
| `border-radius: 0`              | `var(--primitiv-radii-0)`                     |
| a fixed dimension (e.g. `80px`) | the matching size step, `var(--primitiv-size-size-80)` * |
| `opacity: 0.5` (disabled)       | `var(--primitiv-opacity-50)` †                |
| `transparent` (a colour)        | `var(--primitiv-color-transparent)`           |

\* `size-size-*` / `space-space-*` are doubled today because of a Figma
variable-naming wart — see the deferred item in
`docs/transfer-and-next-steps.md`. Use the doubled names until that is fixed;
they are what the emitter currently produces.

† `--primitiv-opacity-50` is the exact-value primitive. A semantic
disabled-opacity token (`--primitiv-disabled-opacity`, currently 0.4) exists but
is intentionally **not** used yet — revisit when the disabled-state semantics are
firmed up.

## Genuine exceptions — leave as literals

- **No token exists.** Transition durations (`120ms`) have no motion/duration
  token family yet (a candidate for future work). Leave literal until one exists.
- **Non-design CSS mechanics**, which carry no theming intent: `outline: none`,
  `flex-shrink: 0`, `z-index: 1`, and the `box-shadow` geometry zeros
  (`0 0 0 …`) in the focus ring.

## Finding the token name

The custom property is `--primitiv-<dtcg-path-joined-by-dashes>`. Confirm a token
exists (and its exact emitted name) against the generated token layer — run
`primitiv tokens` or grep `apps/workbench/src/primitiv-tokens.css` — rather than
guessing; the path-doubling above is one reason the name isn't always obvious.

## When you touch a stylesheet

- Keep the **CSS and SCSS bodies byte-identical** (the `.scss` is the `.css` plus
  the trailing `$primitiv-*` alias block).
- Update the file header's *"Requires the token layer for …"* list when you
  reference a **new token family**.
- If the value is an API token's default (a `--primitiv-<component>-*` knob),
  mirror the change into `contract.json`'s `defaultsTo`.
