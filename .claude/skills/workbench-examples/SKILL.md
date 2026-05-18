---
name: workbench-examples
description: How the apps/workbench app is structured and the rules for authoring example pages — folder layout, router wiring, and the global-CSS-bundling gotcha where a bare element/attribute selector in one example's SCSS leaks onto every other page. TRIGGER when adding or editing an example page under apps/workbench/src/pages, writing or changing an example .scss file, wiring a new example into App.tsx, or debugging an example that is visually/behaviourally broken in a way another page's CSS could explain (e.g. unexpected pointer-events, backgrounds, positioning). SKIP for packages/react component work and non-workbench changes.
---

# Workbench example pages

`apps/workbench` is the iteration workbench — one route per component, used
to exercise `@primitiv/react` components in a real browser. Per the
top-level CLAUDE.md, leave it alone unless a task explicitly asks for
an example; when it does, follow the rules below.

## Page layout

Each example lives in `apps/workbench/src/pages/<Name>Example/`:

```
<Name>Example/
  <Name>Example.tsx     the example component (exported by name)
  <Name>Example.scss    its styles
  index.ts              export * from "./<Name>Example";
```

Wire a new example into the router in two files:

- `apps/workbench/src/pages/index.ts` — add `export * from "./<Name>Example";`
- `apps/workbench/src/App.tsx` — add the import, a `<Link to="/...">` nav
  entry, and a `<Route>`.

## The global-CSS gotcha — scope every selector

**`App.tsx` statically imports every page, so every example's `.scss`
is bundled into one global stylesheet.** There is no CSS-Modules
scoping: a rule written in `TooltipExample.scss` also applies on the
Modal page, the Carousel page, everywhere.

Therefore **every selector must be scoped to the page's own classes.**

- Give each example page a unique class prefix — `tp-`, `miller-`,
  `modal-`, `dd-`, etc. — and start every selector with it.
- Never use a bare element selector (`button`, `dialog`, `ul`).
- Never use a bare attribute selector. `[class$="__content"]`,
  `[data-state="open"]`, `[aria-disabled="true"]` all match elements
  on *other* pages — headless components share those `data-*` / `aria-*`
  hooks and the BEM-ish `__content` suffix.

If you must match a family of classes, anchor it to the prefix:
`[class^="tp-"][class$="__content"]`, not `[class$="__content"]`.

### Real incident

`TooltipExample.scss` shipped `[class$="__content"] { pointer-events:
none; … }`. It matched `<Modal.Content className="modal__content">` on
the Modal page — the `<dialog>` became click-through and the Close
button silently stopped working. The bug was latent for days because
the Modal example was not re-tested after the Tooltip example merged.
Fixed by scoping the selector to `[class^="tp-"]…` (PR #62).

When an example is broken in a way its own code can't explain
(unexpected `pointer-events`, background, positioning, z-index),
suspect a leaked selector from another page: open the element's
computed styles and check which stylesheet rule set the property.

## Running the workbench

**Don't try to run the workbench in the sandbox.** `pnpm run dev`
pulls in `harmoni-wasm`, which can't be built here (no `wasm-pack` —
see the `sandbox-gotchas` skill). Don't burn time on the dev server,
stubbing wasm, or removing the `ColorEngine` route.

When you add or edit an example page, your bar is: it **typechecks**
(`pnpm --filter workbench exec tsc --noEmit`) and obeys the rules above
(scoped SCSS, router wiring in `pages/index.ts` + `App.tsx`). The
human runs the workbench and does the visual check in a real browser
afterwards — note that in your summary and leave it to them.
