# primitiv-ui

The **Primitiv UI** design-system CLI. Add headless, accessible,
fully-styled components — and their design tokens — to any Vite or
Next.js project from the command line.

## Install

```sh
npm i -D primitiv-ui
# or: pnpm add -D primitiv-ui
```

This provides the `primitiv` command. The CLI is a small native binary
(written in Rust); `primitiv-ui` is a thin launcher that pulls in the
matching per-platform package via `optionalDependencies` and runs it — so
you only download the one binary your machine needs.

## Usage

```sh
primitiv init          # scaffold primitiv.json and wire up tokens/theme
primitiv add button    # add a component: styled surface + headless React + contract
primitiv tokens        # emit design tokens (CSS / SCSS / Tailwind)
primitiv theme         # emit the theme overrides layer
primitiv list          # list available components and what's installed
```

Pass `--help` to any command for its flags (e.g. `primitiv add --help`).

## Supported platforms

macOS (arm64, x64), Linux (x64, arm64 — glibc), and Windows (x64). On any
other target, install the binary from source:

```sh
cargo install primitiv-cli
```

> **Native binary.** This won't run inside StackBlitz / WebContainer — their
> in-browser WASM Node can't execute native binaries. Use a local, Codespace,
> or Docker Node environment.

Part of the [Primitiv](https://github.com/primitiv-ui/primitiv) design system.
