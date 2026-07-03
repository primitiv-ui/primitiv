---
name: new-registry-component
description: End-to-end playbook for adding a NEW registry component — the copied styled surface under registry/components/<name>/ that `primitiv add <name>` installs (contract + recipe + tsx + styles.css/.scss + README), plus registering it (registry.json, the embedded FILES list, the --all roster test), the barrel export mechanism, dependsOn wiring, the registry type-check, and the kitchen-sink hand-sync for verification. TRIGGER when adding a registry component (e.g. "add code-block/inline-code to the registry", "new registry component", a component that ships as a copied surface rather than a headless primitive). SKIP for headless packages/react components (see new-react-component), pure stylesheet edits (see registry-stylesheet-conventions), and the Rust engine.
---

# New registry component

A **registry component** is the styled surface `primitiv add <name>` copies into
a consumer repo — *not* a headless `@primitiv-ui/react` primitive (that's
`new-react-component`). Most registry components are **generated** from
`contract.json` by `primitiv-emit` and wrap a headless primitive (button, input,
tabs, …). Some carry no primitive and are **hand-authored** (prose, inline-code,
code-block). This skill is the hand-authored flow — the one that isn't generated.

## When it's hand-authored (the prose pattern)

If the component is zero-behaviour styling on a bare element (a `<code>`, a
`<div>` flow container) **or** carries bespoke behaviour with no headless
primitive (code-block's Prism + copy), it is hand-authored:

- `recipe.ts` and `wrapper.tsx` are written by hand, **not** generated → they
  carry **no drift-guard test** (contrast the generated wrappers, D53). The
  `emit_wrapper`/`emit_recipe` generators only emit primitive-backed wrappers.
- The wrapper renders the bare element (or its own DOM), optionally via `Slot`
  for `asChild` (prose/inline-code). Mirror `registry/components/prose/` or
  `registry/components/inline-code/` for the simplest shape.

## The six files under `registry/components/<name>/`

| File | Notes |
|---|---|
| `contract.json` | Source-of-truth metadata: `root` (element + class), `modifiers` (e.g. the `size` group → `--xs…--xl`), `customProperties` (every `--primitiv-<name>-*` knob + its `defaultsTo`). Even hand-authored components have one — it's copied to the consumer and drives docs. |
| `styles.css` | The default theme. **First line after the header comment must be the `@layer` order statement** (see below). Follow `registry-stylesheet-conventions` (no magic numbers). |
| `styles.scss` | The CSS **plus** a trailing `$`-alias block — one `$primitiv-<name>-<prop>: var(--primitiv-<name>-<prop>);` per custom property, in contract order. Generate it from the CSS so it can't drift. |
| `<name>.recipe.ts` | `cva("primitiv-<name>", { variants: { size: {…} }, defaultVariants: { size: "md" } })`. Match the shape of a generated recipe (e.g. input's). |
| `<name>.tsx` | The wrapper. **No stylesheet import in the registry source** — `add` prepends `import "…/styles.css";` when it copies. |
| `README.md` | Mirror `prose`/`inline-code` READMEs: what it does, usage, a Files table, dependencies. |

## Registration — three edits, or the CLI can't serve it

1. **`registry/registry.json`** — add the component object (copy a sibling's
   shape). Set `dependsOn.components` (e.g. code-block → `["button"]` because its
   copy control reuses the `.primitiv-button--secondary` classes) and
   `dependsOn.packages` (e.g. code-block → `prism-react-renderer`; only list a
   package the wrapper actually imports — don't add `@primitiv-ui/react` if it
   uses neither `Slot` nor a primitive).
2. **`crates/primitiv-cli/src/ports/registry.rs`** — add **5** `registry_file!`
   entries (styles.css, styles.scss, `<name>.recipe.ts`, `<name>.tsx`,
   contract.json). These `include_str!` the files at compile time; a wrong path
   fails the build.
3. **`crates/primitiv-cli/tests/cli.rs`** — bump the `add --all` roster count
   (`Resolved N components to add:`) and add a `.contains("<name>")` line.

The layer-order guard test (`every_embedded_component_stylesheet_declares_the_layer_order`)
iterates the embedded index, so it **auto-covers** the new styles.css — which is
why the `@layer` order statement is mandatory:

```css
@layer primitiv.reset, primitiv.tokens, primitiv.theme, primitiv.base, primitiv.variants, primitiv.states;
```

## The registry type-check (`scripts/check-registry-types.mjs`)

The wrappers are `include_str!`'d as opaque strings, so this script is the only
thing that type-checks them. It copies the wrappers into `packages/react`, aliases
`@primitiv-ui/react` to source, and **stubs external imports** (currently
`class-variance-authority` and `prism-react-renderer`). If the new wrapper imports
a package that isn't `@primitiv-ui/react`, add a `declare module` stub (precise
prop types, no broad index signature, or JSX prop spreads won't check) and a
`paths` + `include` entry. Run `node scripts/check-registry-types.mjs`.

## The barrel export (`src/components/index.ts`)

`add` **fully manages** the barrel: `update_barrel` (add.rs) regenerates it from
`primitiv.lock` on every run, emitting `export * from "./<stem>";` for each
installed `*.tsx` wrapper, **sorted alphabetically by stem**. A real consumer's
`primitiv add <name>` wires the export automatically. A hyphenated file
(`code-block.tsx`) exports its PascalCase symbol (`CodeBlock`) via
`export * from "./code-block"` — the stem, not the symbol, drives the path.

## Verify in the kitchen-sink (it can't be `add`ed in-sandbox)

`apps/kitchen-sink` installs the *published* CLI, so a new component only reaches
it via `add` **after a release** (the embedded-registry gotcha — the registry is
baked into the binary). To see it now, **hand-sync** exactly what `add` produces:

1. Copy `<name>.recipe.ts`, `contract.json` → `src/components/`; `styles.css` →
   `src/styles/primitiv/<name>/`.
2. Write `src/components/<name>.tsx` = the registry tsx **with
   `import "../styles/primitiv/<name>/styles.css";` prepended** (add does this).
3. Add `export * from "./<name>";` to `src/components/index.ts` **in its sorted
   slot** (replicate `update_barrel`'s sort — verify with a quick script; this is
   the step that broke before).
4. Add any `dependsOn.packages` to the kitchen-sink `package.json`.
5. **Skip `primitiv.lock`** — its entries are content-hashed with a hash you
   can't reproduce by hand, and Vite doesn't read it; it self-heals on the next
   real `add --force` post-release. Don't run `primitiv add` in the kitchen-sink
   with the *old* CLI, or `update_barrel` will regenerate the barrel from the
   stale lock and drop your hand-added exports.

Then `pnpm --filter @primitiv-ui/react qa:units`-style checks don't apply; run
`node scripts/check-registry-types.mjs` and `cargo test -p primitiv-cli -p
primitiv-emit`. The kitchen-sink itself has no `node_modules` in the sandbox, so
you can't build it here — the human verifies by pulling `main` and running it.

## Nothing is live for consumers until republish

Every file under `registry/components/` is `include_str!`'d into the CLI binary.
A version bump alone does **not** surface it — the CLI must be rebuilt and
published (`publish.yml` always rebuilds). Never tell a user a registry change is
installable until a new CLI version ships.
