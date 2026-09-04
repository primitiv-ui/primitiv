/**
 * COLOUR-02 — "drifting" vs "held", the docs-site home page hue diagram.
 *
 * Run through the Desktop Bridge (`figma_execute`). Idempotent.
 *
 * ── THE COUNTER-EXAMPLE IS MEASURED, NOT DRAWN ────────────────────────────
 * The brief asks for "realistic hue drift, roughly 30 degrees" and forbids
 * caricature: if the wrong ramp looks obviously broken it proves nothing,
 * because no reader believes they would ship it. So the drift comes out of a
 * real mechanism, run through the engine, and whatever number falls out is the
 * number used:
 *
 *   cargo run -p harmoni-core --features swatch-sheet --example swatch-sheet
 *   -> docs/generated/colour-02-hue-drift.json
 *
 * THE FIRST MECHANISM WAS WRONG AND THE DATA SAID SO. Mixing the seed toward
 * pure white and pure black in sRGB — the obvious guess at "how a ramp gets
 * built by hand" — drifted 3.2 degrees. Mixing toward a NEUTRAL holds hue
 * almost perfectly. What actually drifts a ramp is mixing toward a TINTED
 * white and a TINTED black: the cool paper white and warm rich black already
 * in your palette. That measures 35.7 degrees against the real ramp's 0.0,
 * with the ends flying out and the middle clustering — which is what drift
 * looks like in the wild.
 *
 * ── FOUR THINGS THAT MAKE THE DIAGRAM WORK ────────────────────────────────
 * • ONE SHARED HUE DOMAIN for both tracks (243-289). Scaling each track to its
 *   own data would rig the comparison — the held row's ten identical hues
 *   would spread across the full width and prove the opposite.
 * • MARKERS AT 0.4 OPACITY so coincident ones ACCUMULATE. Ten stacked dots at
 *   full opacity look like one dot; semi-opaque, the held row's single point
 *   reads dense and the drifting row's isolated ones read sparse. The density
 *   is the argument and it costs no annotation — the brief forbids degree
 *   figures, and this is how you say it without them.
 * • A HAIRLINE ON EVERY TILE. Without it the dark end of each ramp disappears
 *   into the dark card and the "same ten steps" claim stops being visible.
 * • LANDSCAPE TILES, ratio from the HEIGHT (40 x 28). Same lesson as
 *   COLOUR-01: width is set by the column, height is free.
 *
 * The two rows are deliberately similar. Per the brief's craft note, a reader
 * should have to check the track to be sure — that moment of "actually, yes"
 * is worth more than an obvious difference.
 */
const GAP_ID = '2180:91953';
const TILE_H = 28;
// One shared domain, or the comparison is rigged.
const HUE_MIN = 243, HUE_MAX = 289;

// [step, hex, hue in degrees] — from docs/generated/colour-02-hue-drift.json
const DRIFT = [["50","#f8f4fe",283.9],["100","#dae0fb",270.4],["200","#b3c7f5",263.6],["300","#8bacef",261.6],["400","#5a8de8",260.3],["500","#236ce1",259.8],["600","#1d55a9",259.9],["700","#173e71",259.2],["800","#12253a",257.6],["900","#10161a",248.2]];
const HELD  = [["50","#f0f5ff",260.2],["100","#d2e3fe",260.2],["200","#aac9fc",260.2],["300","#86b3fb",260.2],["400","#5794fa",260.2],["500","#236ce1",260.2],["600","#104fb2",260.2],["700","#032e71",260.2],["800","#011841",260.2],["900","#000923",260.2]];

const vars = await figma.variables.getLocalVariablesAsync();
const V = {}; for (const v of vars) V[v.name] = v;
await figma.loadFontAsync({ family: 'Asta Sans', style: 'Regular' });
const CORNERS = ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'];
const bound = (name) => figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#000000'), 'color', V[name]);

const gap = await figma.getNodeByIdAsync(GAP_ID);
for (const c of [...gap.children]) c.remove();
gap.name = 'COLOUR-02 · drifting vs held';
gap.strokes = []; gap.dashPattern = []; gap.fills = [];
gap.layoutMode = 'VERTICAL'; gap.primaryAxisSizingMode = 'AUTO';
gap.counterAxisAlignItems = 'CENTER'; gap.clipsContent = false;
gap.paddingLeft = gap.paddingRight = gap.paddingTop = gap.paddingBottom = 0;

const card = figma.createFrame();
gap.appendChild(card);                                    // append FIRST (gotcha 13)
card.name = 'drift comparison';
card.layoutMode = 'VERTICAL'; card.counterAxisSizingMode = 'FIXED';
card.resize(560, 100);
card.primaryAxisSizingMode = 'AUTO';                      // re-assert after resize (gotcha 7)
card.itemSpacing = 24; card.setBoundVariable('itemSpacing', V['space/space-24']);
card.paddingTop = card.paddingBottom = card.paddingLeft = card.paddingRight = 24;
for (const p of ['paddingTop','paddingBottom','paddingLeft','paddingRight']) card.setBoundVariable(p, V['space/space-24']);
card.fills = [bound('surface/raised')];
card.strokes = [bound('border/subtle')];
card.strokeAlign = 'INSIDE'; card.strokeWeight = 1; card.setBoundVariable('strokeWeight', V['border-width/1']);
for (const c of CORNERS) card.setBoundVariable(c, V['card/lg/radius']);
const raised = (await figma.getLocalEffectStylesAsync()).find(s => s.name === 'elevation/raised');
await card.setEffectStyleIdAsync(raised.id);
gap.layoutSizingHorizontal = 'FILL';
card.layoutSizingHorizontal = 'FILL';

const text = (parent, chars, size, lh, role) => {
  const t = figma.createText(); parent.appendChild(t);
  t.fontName = { family: 'Asta Sans', style: 'Regular' };
  t.characters = chars; t.fontSize = size; t.lineHeight = { unit: 'PIXELS', value: lh };
  t.fills = [bound(role)];
  t.textAutoResize = 'WIDTH_AND_HEIGHT';                  // HEIGHT keeps the creation width and wraps
  return t;
};

const block = (label, rows) => {
  const b = figma.createFrame(); card.appendChild(b);
  b.name = 'row — ' + label;
  b.layoutMode = 'VERTICAL'; b.primaryAxisSizingMode = 'AUTO'; b.counterAxisSizingMode = 'FIXED';
  b.itemSpacing = 10; b.fills = []; b.layoutSizingHorizontal = 'FILL';
  text(b, label, 13, 20, 'content/secondary').name = 'row label';

  const strip = figma.createFrame(); b.appendChild(strip);
  strip.name = 'ramp'; strip.layoutMode = 'HORIZONTAL';
  strip.itemSpacing = 6; strip.setBoundVariable('itemSpacing', V['space/space-6']);
  strip.counterAxisSizingMode = 'AUTO'; strip.primaryAxisSizingMode = 'FIXED';
  strip.fills = []; strip.layoutSizingHorizontal = 'FILL';
  for (const [step, hex] of rows) {
    const sw = figma.createFrame(); strip.appendChild(sw);
    sw.name = label + '/' + step;
    sw.layoutMode = 'VERTICAL';
    sw.counterAxisSizingMode = 'FIXED'; sw.primaryAxisSizingMode = 'FIXED';
    sw.resize(40, TILE_H);
    sw.fills = [figma.util.solidPaint(hex)];
    sw.strokes = [bound('border/subtle')];                // or the dark end vanishes into the card
    sw.strokeAlign = 'INSIDE'; sw.strokeWeight = 1;
    sw.setBoundVariable('strokeWeight', V['border-width/1']);
    sw.layoutSizingHorizontal = 'FILL';
    for (const c of CORNERS) sw.setBoundVariable(c, V['swatch/md/radius']);
  }

  // The hue track. Without it these are two blue ramps that look broadly
  // similar and a reader shrugs; with it the difference is instant.
  const track = figma.createFrame(); b.appendChild(track);
  track.name = 'hue track'; track.layoutMode = 'NONE';
  track.resize(100, 18); track.fills = []; track.clipsContent = false;
  track.layoutSizingHorizontal = 'FILL';
  const rule = figma.createRectangle(); track.appendChild(rule);
  rule.name = 'rule'; rule.x = 0; rule.y = 8; rule.resize(track.width, 1);
  rule.strokes = [];                                      // create* ships a default stroke (gotcha 28)
  rule.fills = [bound('border/subtle')];
  rule.constraints = { horizontal: 'STRETCH', vertical: 'MIN' };
  for (const [, , hue] of rows) {
    const m = figma.createEllipse(); track.appendChild(m);
    m.name = 'marker'; m.resize(7, 7);
    m.x = ((hue - HUE_MIN) / (HUE_MAX - HUE_MIN)) * (track.width - 7);
    m.y = 5;
    m.strokes = [];
    m.fills = [bound('content/muted')];
    m.opacity = 0.4;                                      // coincident markers accumulate
    m.constraints = { horizontal: 'SCALE', vertical: 'MIN' };
  }
  return b;
};
block('drifting', DRIFT);
block('held', HELD);
text(card, 'The same ten steps. One of them is a family.', 13, 20, 'content/muted').name = 'closing line';

return { card: { w: Math.round(card.width), h: Math.round(card.height) },
         rows: card.children.map(c => c.name) };
