---
name: figma-prose-layout
description: How to lay out prose / long-form content in Figma with correct inter-block spacing — translating the web's flow-rhythm model (RFC 0016, the `.primitiv-flow` owl) into Figma auto-layout using the `flow/*` Context variables, nested frames for heading asymmetry, and spacer nodes. TRIGGER when composing a page/article/specimen/doc layout from the prose components, spacing stacked content blocks, applying flow rhythm, setting density on a content layout, or asking how web prose spacing maps to Figma. SKIP for BUILDING the prose component sets (see figma-prose-component), framed controls, token-value lookups (see figma-variable-architecture), and token export/sync (see figma-token-sync).
---

# Laying out prose with flow rhythm in Figma

Composing content blocks (headings, paragraphs, lists, blockquotes, code blocks,
the prose components) into a page/article/specimen with **correct inter-block
spacing**. This is the Figma counterpart to RFC 0016's web flow model — the
`.primitiv-flow` class and the `<Prose>` component.

> **Building** a prose component *set* (List, Blockquote, …)? That's
> `figma-prose-component`. This skill is about **arranging** those blocks with
> the right spacing *between* them.

## 1. The core idea — structural, not automatic

The web gets variable rhythm from a **one-directional owl** (`.primitiv-flow >
* + *`, `margin-block-start`): in one flat container, every sibling pair is
spaced by role — more air above a heading, tight space below it, even rhythm
between paragraphs — **automatically**.

**Figma has no owl.** Auto-layout `itemSpacing` is **one uniform gap per frame**.
You cannot drop arbitrary prose into a single frame and get heading asymmetry for
free. So the web's *role overrides* become Figma's *nesting structure*: you make
the rhythm explicit by how you group frames.

What **does** carry across, and keeps web and Figma in lockstep, is the token
layer: the **`flow/*` Context variables** and the **density modes**. Bind every
gap (and spacer height) to a `flow/*` variable, and density resolves through the
Context collection's modes exactly like `[data-density]` on the web.

> **Precondition:** the `flow/*` variables must exist in the Figma **Context
> collection** (`VariableCollectionId:369:31958`). They are created by the token
> sync (`figma-token-sync`); until then the resolve-by-name below returns
> `undefined`. Resolve by **name**, never by a hard-coded ID (IDs are assigned at
> sync time).

## 2. The flow scale (design intent — RFC 0016)

Four steps, named by the relationship they express. Per-density `space-*` aliases
(also in `packages/tokens/src/context.json` under each mode's `flow` namespace):

| `flow/*` | meaning | dense | compact | comfortable | spacious |
|---|---|---|---|---|---|
| `tight`   | heading → its body (the asymmetry) | space-8  | space-10 | space-12 | space-16 |
| `normal`  | paragraph → paragraph (default block) | space-12 | space-16 | space-20 | space-28 |
| `section` | before an `h3`/`h4` sub-section | space-16 | space-24 | space-32 | space-40 |
| `region`  | before an `h1`/`h2`, around a rule | space-24 | space-32 | space-48 | space-56 |

## 3. Web rule → Figma structure

| Web (`@layer primitiv.base`) | Role | Figma equivalent |
|---|---|---|
| `.primitiv-flow > * + *` → `flow/normal` | default block rhythm | outer flow frame `itemSpacing` → `flow/normal` |
| `> :where(h1,h2,h3,h4) + *` → `flow/tight` | tight below a heading | a **Section** sub-frame wrapping `[heading + body]`, `itemSpacing` → `flow/tight` |
| `> * + :where(h1,h2)` → `flow/region` | big air above a major heading | the **gap before** that Section frame in its parent = `flow/region` |
| `> * + :where(h3,h4)` → `flow/section` | air above a sub-section | the gap before a nested sub-section frame = `flow/section` |
| `> hr` → `flow/region` both sides | a rule's breathing room | a Divider/spacer with `flow/region` margin (§6) |

The headings-bind-down + big-air-above shape becomes **the document outline as a
frame tree**: each heading lives at the top of a frame that also holds the
content it introduces; those frames stack in a parent whose gap is the
"space above the next heading."

## 4. Strategy A — uniform flow frame (the 80% case)

For most layouts, one vertical auto-layout frame with `itemSpacing` → `flow/normal`
is enough. Drop the prose components in as blocks; they get even rhythm. (Loses
heading asymmetry — fine for forms, card bodies, simple stacks.)

```js
const flowVars = await figma.variables.getLocalVariablesAsync();
const flowNormal = flowVars.find(v => v.name === 'flow/normal');   // Context collection

const prose = figma.createFrame();
prose.name = 'Prose';
prose.layoutMode = 'VERTICAL';
prose.resize(640, 100);                       // D8: resize BEFORE sizing modes
prose.layoutSizingHorizontal = 'FIXED';       // D7: layoutSizing*, not primaryAxisSizingMode
prose.layoutSizingVertical = 'HUG';
prose.setBoundVariable('itemSpacing', flowNormal);
prose.fills = [];
// ...appendChild each content block (paragraphs, a List instance, a Blockquote instance, …)
```

## 5. Strategy B — nested frames for heading asymmetry

To reproduce the web's "big air above a heading, tight below," wrap each heading
with the content it introduces in a **Section** frame (tight gap), and stack the
Sections in the outer frame (section/region gap).

```js
const flowTight  = flowVars.find(v => v.name === 'flow/tight');
const flowRegion = flowVars.find(v => v.name === 'flow/region');

// Outer frame: gap BEFORE each section = the air above its heading.
const article = figma.createFrame();
article.layoutMode = 'VERTICAL';
article.resize(640, 100);
article.layoutSizingHorizontal = 'FIXED';
article.layoutSizingVertical = 'HUG';
article.setBoundVariable('itemSpacing', flowRegion);   // major (h1/h2) sections
article.fills = [];

// A Section: heading bound tightly to its body.
function section(headingNode, ...bodyNodes) {
  const s = figma.createFrame();
  s.layoutMode = 'VERTICAL';
  s.resize(640, 100);
  s.layoutSizingHorizontal = 'FILL';     // set AFTER it's appended to `article`
  s.layoutSizingVertical = 'HUG';
  s.setBoundVariable('itemSpacing', flowTight);   // heading → body
  s.fills = [];
  [headingNode, ...bodyNodes].forEach(n => s.appendChild(n));
  return s;
}
// article.appendChild(section(h2, p1, p2));  then s.layoutSizingHorizontal = 'FILL'
```

Mixing `region` (above h1/h2) and `section` (above h3/h4) in one document =
**nest deeper**: an h3 sub-section is a Section frame *inside* its parent h2
Section, and the parent's `itemSpacing` becomes `flow/section`. The frame tree
mirrors the heading hierarchy.

## 6. Strategy C — spacer nodes for explicit breaks

For a one-off break the structure doesn't give (or to stand in for `<hr>`), drop
an invisible spacer whose **height is bound to a flow variable**. Use
**`opacity = 0`, not `visible = false`** — a hidden node collapses to zero height
and leaves the auto-layout flow; a zero-opacity node stays a participant and
still reserves its height (the RFC 0012 "Semantic Prose Styles" specimen does
exactly this).

```js
const spacer = figma.createFrame();
spacer.name = 'Spacer / region';
spacer.layoutMode = 'VERTICAL';
spacer.resize(1, 24);                 // height replaced by the bound variable
spacer.layoutSizingHorizontal = 'FILL';
spacer.setBoundVariable('minHeight', flowRegion);   // or height; minHeight is robust in HUG parents
spacer.opacity = 0;
spacer.fills = [];
```

## 7. Density — one mode, whole subtree

Set the Context mode on the flow frame (or any ancestor) and **every** bound gap
+ spacer resolves to that density — the Figma mirror of `[data-density]`. Needs
the **VariableCollection object**, not the ID string.

```js
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const context = collections.find(c => c.id === 'VariableCollectionId:369:31958');
const dense = context.modes.find(m => m.name.toLowerCase() === 'dense').modeId;
article.setExplicitVariableModeForCollection(context, dense);   // whole subtree tightens
```

For a Light/Dark × four-density specimen, follow the example-frame recipe in
`figma-prose-component` §9 (intent mode on the row, context mode on the cell).

## 8. Gotchas

- **`flow/*` must be synced first** (§1). Resolve by name; if `undefined`, the
  sync hasn't run — stop and create them (`figma-token-sync`).
- **D7 / D8 ordering** (shared with every auto-layout build): `resize()` **before**
  `layoutSizingVertical = 'HUG'`; use `layoutSizingHorizontal/Vertical`, never
  `primaryAxisSizingMode = 'HUG'`; set `FILL` only **after** `appendChild`.
- **Spacers: `opacity = 0`, not `visible = false`** (§6) — visibility-false leaves
  the flow and collapses.
- **`setBoundVariable('itemSpacing', v)`** binds the gap; re-binding to a different
  `flow/*` step is how you change a frame's rhythm role.
- **Don't chase pixel-parity with the web.** Figma has no margin-collapse and no
  per-pair role logic; nest by heading hierarchy and accept that the rendered web
  is the runtime truth.

## 9. The parity bar

Figma will never be pixel-identical to the owl for arbitrary content. The
realistic — and correct — bar: **the web is the runtime source of truth for
rendered spacing; Figma is the design-intent source of truth; they agree at the
token level.** Same `flow/*` variables, same density modes, different mechanism
(CSS owl vs auto-layout structure).

## Related

- `figma-prose-component` — building the content components this skill arranges.
- `figma-variable-architecture` — the Context collection, density modes, the
  `dropdown/*`-style namespace pattern `flow/*` follows.
- `figma-token-sync` — creating/syncing the `flow/*` variables (the precondition).
- `figma-console-scripts` — running these snippets in the Figma console.
- RFC 0016 (`docs/rfcs/0016-spacing-and-flow-rhythm.md`) — the canonical model.
