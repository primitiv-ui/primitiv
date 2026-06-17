# primitiv-ui

The **Primitiv UI** design-system CLI. Add headless, accessible,
fully-styled components — and their design tokens — to any Vite or
Next.js project from the command line.

## Quick start

Run inside an existing Vite or Next.js project:

```sh
# pnpm
pnpm create primitiv-ui

# npm
npm create primitiv-ui@latest

# yarn / bun
yarn create primitiv-ui
bun create primitiv-ui
```

This scaffolds `primitiv.json` and generates the token layer. Then add
components with:

```sh
pnpm dlx primitiv-ui@latest add button
# or: npx primitiv-ui@latest add button
```

## Commands

```sh
primitiv init          # scaffold primitiv.json + generate the token layer
primitiv add button    # add a component: stylesheet + React surface + contract
primitiv tokens        # (re)generate the design-token layer
primitiv theme         # generate a brand-palette override layer
primitiv list          # list available components and what's installed
```

## How it works

`primitiv-ui` is a thin JS launcher. It resolves the matching native binary
for your platform via `optionalDependencies` and runs it — so you only
download the one binary your machine needs.

You don't need to install it as a project dependency. Use `npx` or your
package manager's `dlx` / `create` command to invoke it on demand:

```sh
npx primitiv-ui@latest add switch
pnpm dlx primitiv-ui@latest add switch
```

## Supported platforms

macOS (arm64, x64), Linux (x64, arm64 — glibc), Windows (x64). On any
other target, install from source:

```sh
cargo install primitiv-cli
```

> **Native binary.** This won't run inside StackBlitz / WebContainer — their
> in-browser WASM Node can't execute native binaries. Use a local, Codespace,
> or Docker Node environment.

Part of the [Primitiv](https://github.com/primitiv-ui/primitiv) design system.
