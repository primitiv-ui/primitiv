# create-primitiv-ui

Set up **Primitiv UI** in an existing Vite or Next.js project with a
single command.

## Usage

```sh
# pnpm
pnpm create primitiv-ui

# npm
npm create primitiv-ui@latest

# yarn / bun
yarn create primitiv-ui
bun create primitiv-ui
```

This runs `primitiv init` via `npx primitiv-ui@latest init` — no local
install needed. It walks you through choosing a stylesheet format, brand
colour, and styles path, then writes `primitiv.json` and generates the
shared token layer.

Any arguments you pass are forwarded to `primitiv init`:

```sh
pnpm create primitiv-ui --yes           # accept all defaults
pnpm create primitiv-ui --format scss   # choose SCSS up front
```

Once set up, add components with:

```sh
pnpm dlx primitiv-ui@latest add button
# or: npx primitiv-ui@latest add button
```

> **Needs a real Node environment.** The CLI runs a native binary, so this
> won't work in StackBlitz / WebContainer. Use local, a Codespace, or Docker.

Part of the [Primitiv](https://github.com/primitiv-ui/primitiv) design system.
