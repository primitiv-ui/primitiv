---
title: CLI
---

# CLI

The `primitiv` CLI adds styled Primitiv components to any Vite or Next.js
project from the command line — installs the headless package, copies
stylesheets, and sets up the React surface in a single step.

> **Native binary.** The CLI runs a compiled Rust binary via Node. It won't
> work inside StackBlitz / WebContainer — use a local environment, Codespace,
> or Docker.

## Quick start

Run this inside an **existing** Vite or Next.js project (the CLI configures a
project you already have; it doesn't scaffold one):

::: code-group

```sh [pnpm]
pnpm create primitiv-ui
```

```sh [npm]
npm create primitiv-ui@latest
```

```sh [yarn]
yarn create primitiv-ui
```

```sh [bun]
bun create primitiv-ui
```

:::

This runs `primitiv init` interactively. It asks for your stylesheet format,
brand colour, and where styles should land, then writes `primitiv.json` and
generates the token layer (`tokens.css`) at the configured path.

Then add a component:

::: code-group

```sh [pnpm]
pnpm dlx primitiv-ui@latest add button
```

```sh [npm]
npx primitiv-ui@latest add button
```

```sh [yarn]
yarn dlx primitiv-ui@latest add button
```

```sh [bun]
bunx primitiv-ui@latest add button
```

:::

After that you have everything you need to use a styled Button in your app:

| File | What it is |
|---|---|
| `src/styles/primitiv/tokens.css` | Shared design token layer (`--primitiv-*` custom properties) |
| `src/styles/primitiv/button/styles.css` | Button stylesheet — automatically imported by `button.tsx` |
| `src/components/button.tsx` | Styled React wrapper — already imports its own stylesheet |
| `src/components/button.recipe.ts` | `cva` recipe — extend this to add your own variants |
| `src/components/index.ts` | Barrel file — re-exports every installed component |

`add` also installs [`class-variance-authority`](https://cva.style) automatically — the recipe
files depend on it. No manual `npm install cva` step needed.

Import the token layer once in your entry file so the custom properties are
available everywhere:

```ts
// main.tsx (or App.tsx)
import './styles/primitiv/tokens.css'
```

Then import components from the barrel — each new `add` keeps it up to date:

```ts
import { Button } from './components'
```

---

## Commands

### `init`

Writes `primitiv.json` to the current directory and generates the token layer.

::: code-group

```sh [pnpm]
pnpm dlx primitiv-ui@latest init
```

```sh [npm]
npx primitiv-ui@latest init
```

```sh [yarn]
yarn dlx primitiv-ui@latest init
```

```sh [bun]
bunx primitiv-ui@latest init
```

:::

**Interactive prompts:**

| Prompt | Default | Flag |
|---|---|---|
| Stylesheet format | `css` | `--format <css\|scss\|tailwind>` |
| Brand colour | `#0a7755` | `--brand <hex>` |
| Styles path | `src/styles/primitiv` | `--path <dir>` |
| Components directory or alias | detected from `tsconfig.json` | `--alias-components <alias\|dir>` |

Pass `--yes` to accept all defaults without prompting:

::: code-group

```sh [pnpm]
pnpm dlx primitiv-ui@latest init --yes
```

```sh [npm]
npx primitiv-ui@latest init --yes
```

```sh [yarn]
yarn dlx primitiv-ui@latest init --yes
```

```sh [bun]
bunx primitiv-ui@latest init --yes
```

:::

Or supply flags directly:

```sh
pnpm dlx primitiv-ui@latest init --format scss --brand "#ff5500" --path app/styles
```

`init` will not overwrite an existing `primitiv.json` unless you pass `--force`.

---

### `add`

Installs a component — copies the stylesheet and React surface, installs the
headless npm package **and `class-variance-authority`**, and generates the
token layer if it doesn't exist yet. It also updates `src/components/index.ts`
to re-export every installed component, so you always have a single clean
import path.

::: code-group

```sh [pnpm]
pnpm dlx primitiv-ui@latest add button
```

```sh [npm]
npx primitiv-ui@latest add button
```

```sh [yarn]
yarn dlx primitiv-ui@latest add button
```

```sh [bun]
bunx primitiv-ui@latest add button
```

:::

Add multiple components at once:

::: code-group

```sh [pnpm]
pnpm dlx primitiv-ui@latest add button switch
```

```sh [npm]
npx primitiv-ui@latest add button switch
```

```sh [yarn]
yarn dlx primitiv-ui@latest add button switch
```

```sh [bun]
bunx primitiv-ui@latest add button switch
```

:::

Re-running `add` is safe — files you've edited are kept by default. The
`primitiv.lock` manifest tracks what was last written by the CLI so it can
tell the difference.

**Flags:**

| Flag | Description |
|---|---|
| `--format <fmt>` | Override the stylesheet format for this run only |
| `--path <dir>` | Override the styles destination for this run only |
| `--styles-only` | Copy styles, skip the npm package install |
| `--no-styles` | Install the npm package, skip style copy |
| `--force` | Overwrite files even if you've edited them |
| `--dry-run` | Preview the install plan without writing any files |
| `--json` | Machine-readable output for agent / CI pipelines |

---

### `tokens`

Emits the shared design token layer — all the `--primitiv-*` CSS custom
properties — to the path configured in `primitiv.json`, or to stdout if
there is no config.

::: code-group

```sh [pnpm]
pnpm dlx primitiv-ui@latest tokens
```

```sh [npm]
npx primitiv-ui@latest tokens
```

```sh [yarn]
yarn dlx primitiv-ui@latest tokens
```

```sh [bun]
bunx primitiv-ui@latest tokens
```

:::

You rarely need to run this directly — `init` and `add` both generate the token
layer automatically. Use `tokens` to regenerate it after updating the CLI, or to
write it to a custom path:

```sh
pnpm dlx primitiv-ui@latest tokens --out src/styles/tokens.css --format scss
```

**Flags:**

| Flag | Description |
|---|---|
| `--out <path>` | Write to a specific path (overrides config) |
| `--format <fmt>` | `css` (default), `scss`, or `tailwind` |

---

### `theme`

Generates a brand palette override layer from a seed colour. Import it
after your token layer to reskin the default Primitiv palette.

::: code-group

```sh [pnpm]
pnpm dlx primitiv-ui@latest theme --brand "#ff5500" --out src/styles/brand.css
```

```sh [npm]
npx primitiv-ui@latest theme --brand "#ff5500" --out src/styles/brand.css
```

```sh [yarn]
yarn dlx primitiv-ui@latest theme --brand "#ff5500" --out src/styles/brand.css
```

```sh [bun]
bunx primitiv-ui@latest theme --brand "#ff5500" --out src/styles/brand.css
```

:::

The Harmoni engine derives a full contrast-checked light and dark palette
from the brand colour. The output is a `@layer primitiv.theme` block that
overrides the token layer without touching it.

**Flags:**

| Flag | Description |
|---|---|
| `--brand <hex>` | Required — the seed colour for your palette |
| `--out <path>` | Output file (required) |
| `--format <fmt>` | `css` (default), `scss`, or `tailwind` |

---

### `list`

Shows the available components and which ones are installed in the current
project.

::: code-group

```sh [pnpm]
pnpm dlx primitiv-ui@latest list
```

```sh [npm]
npx primitiv-ui@latest list
```

```sh [yarn]
yarn dlx primitiv-ui@latest list
```

```sh [bun]
bunx primitiv-ui@latest list
```

:::

```
COMPONENT  VERSION  INSTALLED
button     0.1.0    yes
switch     0.1.0    -
```

Pass `--json` for machine-readable output.

---

## Supported platforms

macOS (arm64, x64), Linux (x64, arm64 — glibc), Windows (x64).

On any other target, install the binary from source:

```sh
cargo install primitiv-cli
```
