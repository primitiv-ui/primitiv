# Primitiv Sync Figma plugin

Internal-only Figma plugin that owns the one-way **Figma → repo** token
sync and the one-shot **Typography → Semantic** collection migration.

It is deliberately separate from `apps/harmoni-figma-plugin`, which is
the consumer-facing Harmoni plugin and stays free of any sync /
migration code. This plugin is never submitted to Figma Community; it
is loaded locally via *Plugins → Development → Import plugin from
manifest…*.

## How it is wired

A Figma plugin runs as two separate programs that share no scope and
talk only by passing messages:

| Context | Runtime | Has | Entry |
| --- | --- | --- | --- |
| **Sandbox** | Figma's plugin sandbox | the `figma` global; no DOM | `src/code/code.ts` → `dist/code.js` |
| **UI** | a real `<iframe>` | DOM, React, SCSS | `src/ui/main.tsx` → `dist/index.html` |

The two sides exchange the messages typed in `src/shared/messages.ts`.
`manifest.json` is what Figma reads; it points `main` at the sandbox
bundle and `ui` at the UI bundle, both produced in `dist/`.

`documentAccess` is `"dynamic-page"` so the migration command can call
`figma.loadAllPagesAsync()` before walking nodes to rebind variable
references.

## Builds

Two Vite builds write into a shared `dist/`:

- **UI** (`vite.config.ts`) — React + SCSS, bundled by
  `vite-plugin-singlefile` into one self-contained `dist/index.html`.
  Figma's UI iframe cannot fetch sibling assets.
- **Sandbox** (`vite.config.code.ts`) — `code.ts` built in library mode
  as a single IIFE, `dist/code.js`.

## Developing against Figma

The dev cycle needs the **Figma desktop app** — figma.com in a browser
cannot load local plugins.

1. `pnpm --filter primitiv-sync-figma-plugin dev` — rebuilds `dist/` on
   every change (both builds, in watch mode).
2. In Figma desktop: **Plugins → Development → Import plugin from
   manifest…** and select
   `apps/primitiv-sync-figma-plugin/manifest.json`.
3. Run the plugin from your Figma file. Figma reloads it whenever the
   watched `dist/` output changes.

## Scripts

| Script | Does |
| --- | --- |
| `dev` | Watch-build both bundles for the Figma dev cycle |
| `build` | Type-check, then produce `dist/code.js` + `dist/index.html` |
| `qa:units` | Run the Vitest suite with coverage |
| `qa:units:watch` | Vitest in watch mode |
| `lint` | ESLint |
