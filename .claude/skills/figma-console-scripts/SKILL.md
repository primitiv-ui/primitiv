---
name: figma-console-scripts
description: How to write and run one-shot scripts in the Figma developer console — the "allow pasting" step, font loading, and the process for turning a UI description into a working script. TRIGGER when generating wireframes, creating Figma content programmatically, or asked to write a script that creates frames/text/shapes in a Figma file. SKIP for plugin UI code, Figma token sync work, and anything involving the plugin sandbox (code.ts).
---

# Running scripts in the Figma developer console

The Figma desktop app exposes a JavaScript console that has full access to
the Plugin API (`figma.*`). This is the fastest way to generate content
programmatically — no manifest, no build step, just paste and run.

Reference files — load on demand:

- `references/wireframe-recipes.md` — fill/stroke/text API patterns, the
  shared helper-function set, and the wireframe design-token table.
- `references/workspace-components.md` — the `@primitiv-ui/react` component
  and `@primitiv-ui/icons` inventories to mirror in wireframes.

## Opening the console

- **Menu:** Plugins → Development → Open console
- **Keyboard:** `⌘⌥I` (Mac) / `Ctrl+Alt+I` (Windows) in the desktop app

The console is only available in the **desktop app**, not the browser.

## The "allow pasting" step

Figma blocks paste into the console by default. Before pasting a script:

1. Click inside the console input area.
2. Type `allow pasting` and press Enter.
3. The console will confirm. Now paste works normally for the rest of the
   session.

This only needs to be done once per console session.

## What the console can do

The console runs in the plugin execution context. Everything in the Plugin
API is available:

```js
figma.createFrame()
figma.createRectangle()
figma.createText()
figma.createPage()
figma.currentPage          // read/write
figma.viewport.scrollAndZoomIntoView([node])
figma.variables.*          // read/write Figma variables
figma.root.children        // all pages in the document
```

`figma.closePlugin()` is a no-op from the console — omit it.

## Font loading — required before creating text

You **must** call `figma.loadFontAsync()` before setting `.characters` on
any text node. Skipping this throws `"Error: in figma.loadFontAsync"`.

```js
await figma.loadFontAsync({ family: "Inter", style: "Regular" });
await figma.loadFontAsync({ family: "Inter", style: "Medium" });
await figma.loadFontAsync({ family: "Inter", style: "Bold" });
```

Inter is Figma's default font and is always available. Wrap the whole
script in an `async` IIFE so you can `await` these calls:

```js
(async function () {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  // ... rest of script
})().catch(err => console.error(err.message));
```

## Creating a new page and switching to it

```js
const page = figma.createPage();
page.name = "My New Page";
figma.currentPage = page;   // switches the canvas to this page
```

## Process: generating a wireframe script from scratch

Follow this order every time — skipping steps leads to misaligned elements
or content that overflows the frame.

### 1. Gather requirements before writing any code

- **Read the existing source UI.** For plugin wireframes, read
  `apps/workbench/src/ColorEngine.tsx`, `Swatch.tsx`, and `Palette.tsx` to
  understand the component structure you are translating. Wireframes should
  mirror the workbench's visual vocabulary (swatch internals, picker layout,
  section labels).
- **Interview the user** (via `AskUserQuestion`) about screens, navigation
  model, panel width, and feature scope before scripting. Refer to
  `PLUGIN_UX_PLAN.md` for the agreed decisions on this project.
- **List every screen** that needs to be created, name them, and decide their
  x-positions (screens sit side by side; use a fixed gap of 48px).

### 2. Define layout constants first

Every script starts with a block of named constants. Never hardcode magic
numbers inside drawing calls.

```js
const W      = 360;    // panel width
const H      = 620;    // panel height (height scrolls; H is the frame height)
const PAD    = 16;     // standard content padding
const CW     = W - PAD * 2;   // content width: 328
const HDR_H  = 48;    // dark header bar height
const GAP    = 48;    // gap between frames on canvas
```

Calculate derived values from these (e.g. `RAMP_X`, `BTN_W`, `CARD_H`) so
changing `W` or `PAD` propagates everywhere.

### 3. Write the helper functions

Copy the shared helper set (`solid`, `makeFrame`, `makeText`, `makeHeader`,
…) from an existing script (`create-v1-wireframes.js`) rather than
re-inventing it — the full table and the API patterns behind it are in
`references/wireframe-recipes.md`.

### 4. Render each screen in layers — top to bottom

Within each frame, draw in this order:
1. **Background** — set on the frame itself (`f.fills = solid(...)`)
2. **Header** — call `makeHeader()`
3. **Sections** — use a running `y` cursor, advancing it after each element
4. **Content within sections** — cards, ramps, tree rows, pickers
5. **Footer** — fixed to the bottom of the frame (`H - footerHeight`)

Maintain a single `let y = HDR_H + 16` cursor and advance it explicitly
after every element. This makes the layout easy to adjust — insert a new
element by bumping all subsequent `y +=` values.

Use the wireframe design-token table in `references/wireframe-recipes.md`
for colours and type sizes, and mirror existing workspace components
(`references/workspace-components.md`) instead of inventing new patterns.

### 5. Save to `scripts/` and document in `PLUGIN_UX_PLAN.md`

All console scripts live in `apps/harmoni-figma-plugin/scripts/`. Both
the filename and the Figma page name **must include a version segment**
(see below). Add the script to the wireframe scripts table in
`PLUGIN_UX_PLAN.md` before committing.

### Versioned naming convention

Every wireframe iteration is tied to a version (`v1`, `v2`, …). The
version appears in two places so the work is trackable through time:

| Surface | Pattern | Example |
|---|---|---|
| Filename | `create-<version>-<subject>-wireframes.js` | `create-v1-output-detail-wireframes.js` |
| Figma page name | `Wireframes — Harmoni Plugin (<version>[ — <subject>])` | `Wireframes — Harmoni Plugin (v1 — output detail)` |

When the design crosses a version boundary (a substantive reset
documented in `PLUGIN_UX_PLAN.md`), delete the previous version's
scripts from disk — git history preserves them — and start a fresh set
under the new prefix. Don't leave mixed-version scripts sitting beside
each other; the wireframes file directory should always represent
"current direction only".

## Scripts in this repo

All reusable console scripts live in:

```
apps/harmoni-figma-plugin/scripts/
  create-v1-wireframes.js                  ← single-screen layout at 320 / 400 / 480px + tint variant
  create-v1-output-detail-wireframes.js    ← output zone in default / canvas-swatches / variables states
```

Each script creates its own Figma page (versioned name) and is
self-contained — paste and run any of them independently.

## Gotchas

- **`figma.currentPage = page` inside a plugin works; from the console it
  also works** — but only after the page object is returned from
  `figma.createPage()` or found in `figma.root.children`.
- **Child `x`/`y` are relative to the parent frame**, not the canvas.
- **`node.resize(w, h)` must be called before setting content** on some
  node types — call it immediately after `createRectangle()` /
  `createFrame()`.
- **Strokes default to empty** (`[]`) on new shapes — always assign both
  `node.strokes` and `node.strokeWeight` together.
