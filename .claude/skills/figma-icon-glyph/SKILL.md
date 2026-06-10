---
name: figma-icon-glyph
description: Playbook for adding a new glyph to the Figma Icon component set AND the @primitiv-ui/icons package in the house line style — stroke→outline build recipe, 5-size clone-and-rebind, SVG export, generate/README/test loop. TRIGGER when adding/drawing a new icon glyph (sun, moon, star, etc.), extending the Icon set, or adding an svg to packages/icons. SKIP for framed-control components, token work, and wireframes.
---

# Adding a new icon glyph (Figma Icon set + @primitiv-ui/icons)

One glyph touches two surfaces that must stay in sync:

- **Figma** — the `Icon` component set (`key da2000986513297ee3823cf917a294e6a39991f2`),
  five size variants (`xs sm md lg xl`).
- **Package** — `packages/icons`: one source `.svg` → `pnpm generate` →
  React component + barrel + README row.

Build the geometry **once** in Figma, then export that same geometry as the
package SVG so both surfaces share identical paths.

## Step 0 — Inputs (ask the user)

Before anything, ask the user:

1. **What symbol** do you want? (e.g. "a sun", "a crescent moon", "a star").
   Get enough to design it — shape, any count (rays/points), orientation.
2. **Open the Desktop Bridge plugin** in the target Figma file so the
   `mcp__figma-console__*` tools can drive it.

Then confirm the connection: `figma_get_status({probe:true})` — expect the
"Primitiv Design System" file. Re-resolve the Icon set's **session node id**
with `figma_search_components({query:'Icon'})` (node ids are session-specific;
the *key* above is stable). All snippets below use `figma_execute`.

## House style constants (non-negotiable — match exactly)

| Thing | Value |
|---|---|
| Coordinate grid | `0 0 24 24` (md), designed centred where symmetric |
| Stroke weight | **1.5px** (proven from `plus`/`minus`/`close`: exact 1.5px bars) |
| Caps / joins | butt caps (`strokeCap='NONE'`) · `strokeJoin='MITER'` |
| Final form | **filled outline** — stroke → `outlineStroke()` → `flatten` to one solid `Vector` |
| Padding | ~2–3px (glyph spans roughly `2 … 22` in the 24-grid) |
| Sizes (frame px) | xs 16 · sm 20 · md 24 · lg 32 · xl 48 → factors `0.6667 / 0.8333 / 1 / 1.3333 / 2` |
| Vector fill variable | `VariableID:154:2233` (content/* default) — bind at **paint** level (`boundVariables.color`), never `setBoundVariable('fills', …)` |

## Step 1 — Build the master geometry (24-grid)

Build into a **24×24 master frame** so the resulting vector's `x/y` *is* its
design offset (you need that offset for both scaling and export).

```js
// helpers
function strokeVec(data){                       // open/closed stroked path
  const v=figma.createVector();
  v.vectorPaths=[{windingRule:'NONE',data}];
  v.strokes=[{type:'SOLID',color:{r:0,g:0,b:0}}]; v.fills=[];
  v.strokeWeight=1.5; v.strokeCap='NONE'; v.strokeJoin='MITER';
  mf.appendChild(v); return v;
}
function disc(cx,cy,r){                          // solid circle (for booleans)
  const e=figma.createEllipse(); e.resize(2*r,2*r); e.x=cx-r; e.y=cy-r;
  e.fills=[{type:'SOLID',color:{r:0,g:0,b:0}}]; e.strokes=[];
  mf.appendChild(e); return e;
}
function outline(node){ const o=node.outlineStroke(); node.remove(); return o; } // ⚠ remove source!
```

Then: collect parts → `outline` each → `figma.union(parts, mf)` → `figma.flatten([union], mf)`.
For a stroked **circle** use a `createEllipse` with `strokes`+`strokeWeight` (it
outlines to a clean ring/annulus = the line-style circle).

### Gotchas that will bite

- **`vectorPaths` parser rejects `H`, `V`, and arc (`A`) commands.** Use only
  `M L C Q Z`, explicit coords, spaces between tokens (`'M 12 2 L 12 4'`). H/V/A
  are fine in *.svg files later — just not in the live `vectorPaths` API.
- **Arcs without `A`:** build curved outline shapes from circle booleans. A
  line-style crescent =
  `outerRing = discA − discBite`; `innerRing = discA(r−1.5) − discBite(r+1.5)`;
  `crescent = outerRing − innerRing` (via `figma.subtract`). Tune the bite
  centre/radius by screenshot.
- **`outlineStroke()` does NOT remove the source node** — outlined geometry ends
  up *doubled* (two overlapping rings) if you forget. Always `node.remove()`
  after outlining (the `outline()` helper does this).
- `figma.getNodeById` throws under dynamic-page — use `getNodeByIdAsync`.

## Step 2 — Validate against the family (get approval)

Screenshot the master (`figma_take_screenshot`, **scale ≤ 4**). Then clone a few
existing `md` variants (`bell`, `settings`, `eye`) next to it and screenshot
together — confirm the **1.5px weight and padding match**. Remove the clones.

Editing the shared set is hard to reverse → **ask the user to approve the design**
before Step 3.

## Step 3 — Add the 5 size variants (clone-and-rebind)

The set is **5 horizontal bands** (one per size, each at a different `y`),
glyphs packed left-to-right; step = that size's width. For each size, clone an
existing same-size variant (inherits frame size, SCALE constraints, set
membership), swap in the rescaled master vector, then move to the band's end.

```js
const FILL=[{type:'SOLID',color:{r:0,g:0,b:0},
  boundVariables:{color:{type:'VARIABLE_ALIAS',id:'VariableID:154:2233'}}}];
const F={xs:16/24, sm:20/24, md:1, lg:32/24, xl:2};
// off = the master's design offset (symmetric glyph → {x:(24-w)/2, y:(24-h)/2})
function build(size){
  const src=set.children.find(c=>new RegExp(`icon=check, size=${size}$`).test(c.name));
  const clone=src.clone(); set.appendChild(clone);
  clone.name=`icon=${glyph}, size=${size}`;
  for(const ch of [...clone.children]) ch.remove();
  const v=master.clone(); v.name='Vector'; v.rescale(F[size]);
  v.fills=FILL; v.constraints={horizontal:'SCALE',vertical:'SCALE'};
  clone.appendChild(v); v.x=off.x*F[size]; v.y=off.y*F[size];
}
```

Then reposition out of the cloned column to each band's right edge:

```js
for(const s of ['xs','sm','md','lg','xl']){
  const band=set.children.filter(c=>new RegExp(`size=${s}$`).test(c.name));
  const xs=band.filter(c=>!/icon=GLYPH/.test(c.name)).map(c=>c.x).sort((a,b)=>a-b);
  const maxX=xs[xs.length-1];
  let step=Infinity; for(let i=1;i<xs.length;i++){const d=xs[i]-xs[i-1]; if(d>0.5&&d<step)step=d;}
  band.find(c=>/icon=GLYPH/.test(c.name)).x = maxX+step;   // append after the last glyph
}
```

(Adding a brand-new `icon=` value auto-extends the variant property.)
Screenshot the largest variant (xl) to catch scaling artefacts.

## Step 4 — Export the SVG (same geometry)

Export the master positioned at its design offset in a transparent 24×24 frame:

```js
const f=figma.createFrame(); f.resize(24,24); f.fills=[]; f.clipsContent=false; page.appendChild(f);
const v=master.clone(); v.fills=[{type:'SOLID',color:{r:0,g:0,b:0}}]; f.appendChild(v); v.x=off.x; v.y=off.y;
const svg=await f.exportAsync({format:'SVG_STRING'}); f.remove(); return {svg};
```

Write `packages/icons/icons/svg/<glyph>.svg` in the house format — a single
path, `fill-rule="evenodd"` if it has holes / multiple subpaths (rays, rings):

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path fill="#000" fill-rule="evenodd" clip-rule="evenodd" d="…concatenated subpaths…"/>
</svg>
```

`generate.ts` strips `fill="…"`, converts `fill-rule→fillRule`, and runs SVGO
(which optimises the verbose Figma coords into tidy arcs/relative commands).

## Step 5 — Generate, document, test

```sh
pnpm --filter @primitiv-ui/icons generate          # idempotent: only the new .tsx + barrel change
pnpm --filter @primitiv-ui/icons qa:units          # 100% coverage expected
```

- The generator regenerates **all** components from the svgs; `git status`
  should show only the new `svg`, new `<Name>.tsx`, and `src/icons/index.ts`.
  Any other file changing = SVGO drift — investigate, don't commit blindly.
- Add an **alphabetical row** to the Icons table in `packages/icons/README.md`.
- **No per-icon test needed** — `src/icons/icons.test.tsx` auto-tests every
  export via `it.each`, so coverage stays at 100% (only `Check.test.tsx` exists
  as a template; don't add more).

## Step 6 — Description + cleanup

- Update the Icon set **description** (bump the glyph count, name the glyph). See
  the `figma-component-descriptions` skill — the mandatory last Figma step.
- Remove every scratch/master frame you created (`figma_execute` delete by name).

## Done checklist

- [ ] 5 variants in the Icon set, bound to `154:2233`, packed at band ends
- [ ] Set description count bumped
- [ ] `<glyph>.svg` source + generated `<Name>.tsx` + barrel
- [ ] README Icons-table row
- [ ] `qa:units` green at 100%
- [ ] scratch frames removed
