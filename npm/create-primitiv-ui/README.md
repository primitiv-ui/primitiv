# create-primitiv-ui

Set up **Primitiv UI** in a new or existing Vite / Next.js project with a
single command.

## Usage

```sh
npm create primitiv-ui@latest
# or: pnpm create primitiv-ui
```

It detects your package manager, installs
[`primitiv-ui`](https://www.npmjs.com/package/primitiv-ui) as a dev
dependency, then runs `primitiv init` to scaffold configuration. Any
arguments you pass are forwarded to `primitiv init`.

Once set up, add components with:

```sh
npx primitiv add button
```

> **Needs a real Node environment.** The CLI runs a native binary, so this
> won't work in StackBlitz / WebContainer. Use local, a Codespace, or Docker.

Part of the [Primitiv](https://github.com/primitiv-ui/primitiv) design system.
