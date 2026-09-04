/**
 * COLOUR-01 — the docs-site home page colour specimen sheet.
 *
 * Run through the Desktop Bridge (`figma_execute`). Idempotent: it clears the
 * COLOUR-01 frame on `Home — desktop (v3)` and rebuilds.
 *
 * ── WHERE THE DATA COMES FROM, AND WHY IT MATTERS ─────────────────────────
 * The sheet's entire claim is that THE ENGINE chose each foreground. So the
 * hexes below are not picked by eye and not derived from a light/dark
 * threshold. The pipeline, end to end:
 *
 *   1. Each ramp's step-500 is read out of the Figma `Primitives / Palette`
 *      collection into `docs/generated/colour-01-seeds.json`. The DESIGN FILE
 *      is the source, so the sheet illustrates what the file actually holds.
 *   2. `cargo run -p harmoni-core --features swatch-sheet --example swatch-sheet`
 *      runs the engine on those seeds and writes
 *      `docs/generated/colour-01-swatch-sheet.json` — every swatch with the
 *      foreground the engine paired to it, its `foregroundSource`, and its
 *      contrast ratio, in both themes.
 *   3. The dark rows are pasted below.
 *
 * Step 2 also CROSS-CHECKS the captured 500s against
 * `packages/tokens/harmoni-seeds.json` and fails if they disagree — a
 * divergence means the design file and the committed palette have drifted, and
 * the sheet would otherwise keep illustrating the old one. Verified to bite.
 *
 * A hand-picked foreground here would produce a visually similar image that is
 * a lie about the exact thing the section asserts. The engine only ever picks
 * the ramp's own step 900, its own step 50, or pure white/black as a last
 * resort — 188 of 200 swatches across both themes get a HARMONIOUS in-family
 * foreground and only 12 need the fallback.
 *
 * ── FOUR DECISIONS THAT LOOK ARBITRARY AND ARE NOT ────────────────────────
 * • THE LIGHT PALETTE, 50 -> 900 ascending. That is the one arrangement where
 *   "light to dark" and "steps ascending" are the same direction; the dark
 *   palette runs the other way and forces a choice between them. The page is
 *   dark-pinned, so this is a deliberate departure from the brief's
 *   theme-follows-page rule — revisit if the section ever gains a theme toggle.
 * • THE CAPTION NAMES THE FOREGROUND'S STEP, NOT THE SWATCH'S. The swatch's
 *   own step is in the column header. This was the single biggest source of
 *   confusion in review: with the swatch's step under the "Ag", readers
 *   repeatedly took it to be naming the ink — "the 500 swatch uses the 400
 *   foreground". Naming the foreground instead makes the sheet state its
 *   actual claim: the ink is a named step OF THE SAME RAMP.
 * • FIVE RAMPS, not ten. An earlier pass added violet/teal/lime/amber/magenta
 *   to show the engine across the wheel; it read as a swatch dump and buried
 *   the point. brand · success · warning · danger · info, in that order.
 * • SEPARATED, ROUNDED TILES — a deliberate reversal of the brief. It says
 *   flush, on the theory that any gap stops a row reading as one scale. Built
 *   both ways: with ten steps and a step header above the columns the scale
 *   still reads, and the tiles let each swatch be looked AT rather than
 *   scanned past. `swatch/md/radius` rounds them; the gap between them is
 *   `space/space-12`, the same value as the gap between rows.
 * • THE RAGGED FLIP IS THE EVIDENCE — do not tidy it. The foreground flips
 *   from light to dark at a different step in different ramps (brand, success
 *   and danger at 600; warning at 400; info at 500) because the engine decided
 *   per swatch rather than at a fixed midpoint. A straight flip line would
 *   mean something was applying a rule.
 *
 * NEUTRAL IS ABSENT, deliberately. It comes from the `neutral` module rather
 * than `generate_brand_pair` and is not in the seed manifest, so the dumper
 * cannot speak for it. Adding it means extending that example first — and
 * whatever caption sits near this image must never extend the 100-swatch
 * guarantee to it.
 */
const GAP_ID = '2180:91944';
// The tile is landscape at 98 x 54 (1.81:1), and the RATIO IS SET BY THE
// HEIGHT, not the width. Ten tiles plus a ramp-name gutter inside a 1200
// column caps the width near 100 — every extra pixel comes off the card
// padding, the gutter or the gaps, and the sheet cannot bleed past the content
// column because it sits mid-flow between the section's paragraphs. Shortening
// the tile gets the same landscape read for free.
//
// The floor is about 48: the tile holds "Ag" (22) + 1 + the caption (16) = 39
// of content, and below ~48 it is cramped rather than wide. 54 leaves 15.
const LABEL_W = 56, SW_H = 54, GAP = 12, CARD_PAD_X = 24;

// [swatch hex, the engine's foreground for it, WHICH STEP that foreground is]
const DATA = {
  brand:[["#f0f5ff","#000923","900"],["#d2e3fe","#000923","900"],["#aac9fc","#000923","900"],["#86b3fb","#000923","900"],["#5794fa","#000923","900"],["#236ce1","#ffffff","White"],["#104fb2","#f0f5ff","50"],["#032e71","#f0f5ff","50"],["#011841","#f0f5ff","50"],["#000923","#f0f5ff","50"]],
  success:[["#edf9ec","#001001","900"],["#caedc8","#001001","900"],["#9bdb98","#001001","900"],["#79c976","#001001","900"],["#50af4f","#001001","900"],["#008c11","#000000","Black"],["#0e6913","#edf9ec","50"],["#053f08","#edf9ec","50"],["#022202","#edf9ec","50"],["#001001","#edf9ec","50"]],
  warning:[["#fef3e9","#140800","900"],["#fee5cc","#140800","900"],["#fdd1a5","#140800","900"],["#fdbf7f","#140800","900"],["#f8a84e","#140800","900"],["#e88e00","#140800","900"],["#aa6a14","#000000","Black"],["#643c07","#fef3e9","50"],["#321c02","#fef3e9","50"],["#140800","#fef3e9","50"]],
  danger:[["#fff2f0","#1e0101","900"],["#fed8d3","#1e0101","900"],["#fdb5ac","#1e0101","900"],["#fc9487","#1e0101","900"],["#f96156","#1e0101","900"],["#db2424","#ffffff","White"],["#a91215","#fff2f0","50"],["#680709","#fff2f0","50"],["#3b0203","#fff2f0","50"],["#1e0101","#fff2f0","50"]],
  info:[["#edf7f9","#000e10","900"],["#caeaef","#000e10","900"],["#9bd8e1","#000e10","900"],["#7ac6d1","#000e10","900"],["#52aebb","#000e10","900"],["#008e9d","#000e10","900"],["#106a75","#edf7f9","50"],["#063f46","#edf7f9","50"],["#022125","#edf7f9","50"],["#000e10","#edf7f9","50"]],
};
const STEPS = ['50','100','200','300','400','500','600','700','800','900'];

const vars = await figma.variables.getLocalVariablesAsync();
const V = {}; for (const v of vars) V[v.name] = v;
await figma.loadFontAsync({ family: 'Asta Sans', style: 'Regular' });
const CORNERS = ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'];

const gap = await figma.getNodeByIdAsync(GAP_ID);
for (const c of [...gap.children]) c.remove();
gap.name = 'COLOUR-01 · foreground pairing sheet';
gap.strokes = []; gap.dashPattern = []; gap.fills = [];
gap.layoutMode = 'VERTICAL'; gap.primaryAxisSizingMode = 'AUTO';
gap.counterAxisAlignItems = 'CENTER'; gap.clipsContent = false;
gap.paddingTop = gap.paddingBottom = gap.paddingLeft = gap.paddingRight = 0;

const card = figma.createFrame();
gap.appendChild(card);                                   // append FIRST (gotcha 13)
card.name = 'specimen sheet';
card.layoutMode = 'VERTICAL';
card.counterAxisSizingMode = 'FIXED';
card.resize(1200, 100);
card.primaryAxisSizingMode = 'AUTO';                     // re-assert after resize (gotcha 7)
card.itemSpacing = GAP;
card.setBoundVariable('itemSpacing', V['space/space-12']);
card.paddingTop = card.paddingBottom = 32;
card.paddingLeft = card.paddingRight = CARD_PAD_X;
for (const p of ['paddingTop','paddingBottom']) card.setBoundVariable(p, V['space/space-32']);
for (const p of ['paddingLeft','paddingRight']) card.setBoundVariable(p, V['space/space-24']);
card.fills = [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#ffffff'), 'color', V['surface/raised'])];
card.strokes = [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#000000'), 'color', V['border/subtle'])];
card.strokeAlign = 'INSIDE'; card.strokeWeight = 1; card.setBoundVariable('strokeWeight', V['border-width/1']);
for (const c of CORNERS) card.setBoundVariable(c, V['card/lg/radius']);
const raised = (await figma.getLocalEffectStylesAsync()).find(s => s.name === 'elevation/raised');
await card.setEffectStyleIdAsync(raised.id);
gap.layoutSizingHorizontal = 'FILL';
card.layoutSizingHorizontal = 'FILL';

const text = (parent, chars, size, lh, fill, bindTo) => {
  const t = figma.createText();
  parent.appendChild(t);
  t.fontName = { family: 'Asta Sans', style: 'Regular' };
  t.characters = chars;
  t.fontSize = size; t.lineHeight = { unit: 'PIXELS', value: lh };
  t.fills = bindTo ? [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#000000'), 'color', bindTo)]
                   : [figma.util.solidPaint(fill)];
  t.textAlignHorizontal = 'CENTER';
  // WIDTH_AND_HEIGHT, not HEIGHT: HEIGHT keeps whatever width the node had at
  // creation, so capitalising "white" to "White" made it wrap to two lines.
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  return t;
};
const rowShell = (name) => {
  const row = figma.createFrame();
  card.appendChild(row);
  row.name = name;
  row.layoutMode = 'HORIZONTAL'; row.counterAxisAlignItems = 'CENTER';
  row.primaryAxisSizingMode = 'FIXED'; row.counterAxisSizingMode = 'AUTO';
  row.itemSpacing = 8;
  row.setBoundVariable('itemSpacing', V['space/space-8']);
  row.fills = [];
  row.layoutSizingHorizontal = 'FILL';
  return row;
};
const stripShell = (row, name) => {
  const strip = figma.createFrame();
  row.appendChild(strip);
  strip.name = name;
  strip.layoutMode = 'HORIZONTAL';
  // The column gap MATCHES THE ROW GAP. `swatch/md/gap` (8) is the component's
  // own inner spacing and reads as five strips sitting near each other; one
  // shared value makes the sheet a single even grid.
  strip.itemSpacing = GAP;
  strip.setBoundVariable('itemSpacing', V['space/space-12']);
  strip.counterAxisSizingMode = 'AUTO'; strip.primaryAxisSizingMode = 'FIXED';
  strip.fills = []; strip.clipsContent = false;
  strip.layoutSizingHorizontal = 'FILL';
  return strip;
};

// ── the step header, once, above the columns ───────────────────────────────
const head = rowShell('step header');
const gutter = figma.createFrame();
head.appendChild(gutter);
gutter.name = 'gutter'; gutter.fills = [];
gutter.resize(LABEL_W, 16);                              // a 1px spacer pins the row and clips the numbers
gutter.layoutSizingHorizontal = 'FIXED'; gutter.layoutSizingVertical = 'FIXED';
const headStrip = stripShell(head, 'steps');
for (const step of STEPS) {
  const cell = figma.createFrame();
  headStrip.appendChild(cell);
  cell.name = 'step ' + step;
  cell.layoutMode = 'VERTICAL';
  cell.primaryAxisAlignItems = 'CENTER'; cell.counterAxisAlignItems = 'CENTER';
  cell.counterAxisSizingMode = 'FIXED'; cell.primaryAxisSizingMode = 'AUTO';
  cell.resize(100, 1); cell.fills = []; cell.layoutSizingHorizontal = 'FILL';
  text(cell, step, 11, 16, null, V['content/secondary']);
}

// ── the ramps ──────────────────────────────────────────────────────────────
for (const [name, steps] of Object.entries(DATA)) {
  const row = rowShell('ramp — ' + name);
  const label = text(row, name, 13, 20, null, V['content/secondary']);
  label.name = 'ramp name'; label.textAlignHorizontal = 'LEFT';
  label.textAutoResize = 'HEIGHT';
  label.resize(LABEL_W, label.height);
  label.layoutSizingHorizontal = 'FIXED';

  const strip = stripShell(row, 'ramp');
  steps.forEach(([hex, fg, source], i) => {
    const sw = figma.createFrame();
    strip.appendChild(sw);
    sw.name = name + '/' + STEPS[i];
    sw.layoutMode = 'VERTICAL';
    sw.primaryAxisAlignItems = 'CENTER'; sw.counterAxisAlignItems = 'CENTER';
    sw.counterAxisSizingMode = 'FIXED'; sw.primaryAxisSizingMode = 'FIXED';
    sw.resize(100, SW_H); sw.itemSpacing = 1;
    sw.fills = [figma.util.solidPaint(hex)];
    sw.strokes = [];                                     // create* ships a default stroke (gotcha 28)
    sw.layoutSizingHorizontal = 'FILL';
    for (const c of CORNERS) sw.setBoundVariable(c, V['swatch/md/radius']);
    // "Ag": the ascender and descender together are what make legibility
    // judgeable rather than merely assertable.
    text(sw, 'Ag', 18, 22, fg);
    const cap = text(sw, source, 12, 16, fg);
    cap.opacity = 0.8;
  });
}
// ── mobile: the same sheet, cropped around the 500 column ──────────────────
// Not a rebuild and not a rescale — the SAME card, clipped and centred, with
// the hero's lighting over it. Shrinking ten tiles to fit 342px would make
// them unreadable; showing three at full size and letting the rest run off
// both edges says "this continues" without saying it.
const MOBILE_GAP = '2183:92285';
const TILE_500_CENTRE = CARD_PAD_X + LABEL_W + 8 + 5 * (98 + GAP) + 49;
const mgap = await figma.getNodeByIdAsync(MOBILE_GAP);
for (const c of [...mgap.children]) c.remove();
mgap.name = 'COLOUR-01 · foreground pairing sheet';
mgap.strokes = []; mgap.dashPattern = []; mgap.fills = [];
mgap.layoutMode = 'NONE'; mgap.clipsContent = true;
mgap.layoutSizingHorizontal = 'FILL';
mgap.resize(mgap.width, 424);

const mcard = card.clone();
mgap.appendChild(mcard);
mcard.name = 'specimen sheet';
// Centre the 500 COLUMN, not the card: 500 is the seed, the one step every
// ramp shares, so it is the honest thing to put under the reader's thumb.
mcard.x = Math.round(mgap.width / 2 - TILE_500_CENTRE);
mcard.y = Math.round((mgap.height - mcard.height) / 2);

const GROUND = { r: 0x14 / 255, g: 0x14 / 255, b: 0x14 / 255 };
const stop = (position, a) => ({ position, color: { ...GROUND, a } });
const veil = (name, fill) => {
  const r = figma.createRectangle(); mgap.appendChild(r);
  r.name = name; r.x = 0; r.y = 0; r.resize(mgap.width, mgap.height);
  r.strokes = [];                                        // create* ships a default stroke (gotcha 28)
  r.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
  r.fills = [fill];
};
// ELLIPTICAL, wide vertically. The crop here is horizontal — columns run off
// both sides — so the falloff belongs on the sides. A circular vignette tuned
// to hide that also swallowed the bottom ramp, losing a whole row of the
// argument. centre_x = (0.5 - tx) / sx, centre_y = (0.5 - ty) / sy.
veil('veil — vignette', { type: 'GRADIENT_RADIAL',
  gradientTransform: [[1.25, 0, -0.125], [0, 0.6, 0.2]],
  gradientStops: [stop(0, 0), stop(0.52, 0), stop(0.82, 0.45), stop(1, 0.94)] });
veil('veil — foot', { type: 'GRADIENT_LINEAR', gradientTransform: [[0, 1, 0], [-1, 0, 1]],
  gradientStops: [stop(0, 0), stop(0.88, 0), stop(1, 0.85)] });

return { desktop: { w: Math.round(card.width), h: Math.round(card.height) },
         mobile: { gapH: Math.round(mgap.height), cardX: mcard.x, where500Lands: mcard.x + TILE_500_CENTRE },
         rows: card.children.map(c => c.name) };
