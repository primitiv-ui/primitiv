# Harmoni Figma plugin

The Figma plugin that surfaces the Harmoni palette engine inside Figma.

It is currently a **scaffold** — the build, type, and test plumbing plus a
proven harmoni-wasm seam — ahead of building palette features. When it
runs it renders `Hello from Harmoni Wasm!`, which confirms the engine
instantiated, and the name of the Figma page it is connected to.

## How a Figma plugin is wired

A plugin runs as two separate programs that share no scope and talk only
by passing messages:

| Context | Runtime | Has | Entry |
| --- | --- | --- | --- |
| **Sandbox** | Figma's plugin sandbox | the `figma` global; no DOM | `src/code/code.ts` → `dist/code.js` |
| **UI** | a real `<iframe>` | DOM, React, SCSS, wasm | `src/ui/main.tsx` → `dist/index.html` |

The harmoni-wasm engine can only run in the UI context — the sandbox has
no DOM and cannot instantiate wasm. The two sides exchange the messages
typed in `src/shared/messages.ts`.

`manifest.json` is what Figma reads: it points `main` at the sandbox
bundle and `ui` at the UI bundle, both produced in `dist/`.

## Builds

Two Vite builds write into a shared `dist/`:

- **UI** (`vite.config.ts`) — React + SCSS, bundled by `vite-plugin-singlefile`
  into one self-contained `dist/index.html`. Figma's UI iframe cannot fetch
  sibling assets, so the harmoni-wasm binary is inlined as a `data:` URI.
- **Sandbox** (`vite.config.code.ts`) — `code.ts` built in library mode as a
  single IIFE, `dist/code.js`.

## Developing against Figma

The dev cycle needs the **Figma desktop app** — figma.com in a browser
cannot load local plugins.

1. From the repo root, build the wasm package once: `pnpm run build:wasm`.
2. `pnpm --filter harmoni-figma-plugin dev` — rebuilds `dist/` on every
   change (both builds, in watch mode).
3. In Figma desktop: **Plugins → Development → Import plugin from
   manifest…** and select `apps/harmoni-figma-plugin/manifest.json`.
4. Run the plugin from your Figma file. Figma reloads it whenever the
   watched `dist/` output changes.

## Scripts

| Script | Does |
| --- | --- |
| `dev` | Watch-build both bundles for the Figma dev cycle |
| `build` | Type-check, then produce `dist/code.js` + `dist/index.html` |
| `qa:units` | Run the Vitest suite with coverage |
| `qa:units:watch` | Vitest in watch mode |
| `lint` | ESLint |
