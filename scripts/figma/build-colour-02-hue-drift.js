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
 * THREE MECHANISMS WERE TRIED. The first two look right on paper and fail:
 *   1. Mix toward pure white and black in sRGB — 3.2 degrees. Mixing toward a
 *      NEUTRAL holds hue almost perfectly.
 *   2. Mix toward a TINTED white and black — 35.7 degrees, but ALL of it in
 *      the two end steps, leaving eight of ten swatches identical to the real
 *      ramp. A RANGE IS NOT A DRIFT, and the number hid that.
 *   3. Interpolate in sRGB between two hand-picked ends — worse, 24.5, because
 *      blending a pale end into a saturated seed snaps hue to the saturated one.
 * What ships: the real ramp's LIGHTNESS AND CHROMA with only the HUE drifted,
 * steadily, +16 to -15 degrees and pinned to the seed at 500. That is what
 * picking each step by eye produces, it measures 31.0 against the real ramp's
 * 0.0, and it is the only construction that isolates the one variable the
 * diagram is about — so the comparison cannot be accused of smuggling in a
 * lightness or saturation difference.
 *
 * ── FOUR THINGS THAT MAKE THE DIAGRAM WORK ────────────────────────────────
 * • ONE SHARED HUE DOMAIN for both tracks, CENTRED ON THE SEED. Scaling each
 *   track to its own data would rig the comparison — the held row's ten
 *   identical hues would spread across the full width and prove the opposite.
 *   Centring it on nothing in particular was nearly as bad: the held stack
 *   landed at 37% and read as misplaced. Centred on the seed it sits at
 *   exactly 50%, with the drifting row scattering symmetrically around it.
 * • ~3.2 DEGREES OF DRIFT PER STEP, PLUS A WOBBLE. Two corrections got here.
 *   First: an early version ran +16 to 0 across five steps and 0 to -15 across
 *   four, to pin the seed at 500 — which made every gap in the dark half wider
 *   than every gap in the light half, visible as rings that were not evenly
 *   spread. The constant is worth more than the pin, which is invisible here
 *   (the two 500s now differ by ~2 degrees, which no eye can see). Second: a
 *   PERFECTLY constant drift spaces the rings perfectly evenly, and that reads
 *   as systematic — as though a different rule had been applied, rather than
 *   as though nobody was in control. A small fixed wobble puts the gaps in a
 *   5.8-10.2% band instead of a flat 8.0%.
 *
 *   THE WOBBLE IS THE ONE STYLISED NUMBER IN THIS ILLUSTRATION. Everything
 *   else is measured out of the engine; this is chosen, deterministic, and
 *   labelled as such in the example so nobody later mistakes it for data.
 * • THE TRACK IS A PAINTED SPECTRUM, not a rule. A plain rule sitting under
 *   the tiles at the same width invites the eye to map marker position to the
 *   TILE ABOVE IT, which is a different quantity: the held row's marker sits
 *   at hue 260 and lands under the 300 tile, so the diagram reads as broken.
 *   Painting the actual hue sweep removes the ambiguity — nobody reads a
 *   spectrum as a row of steps. Reported from review, and the fix is the
 *   axis explaining itself rather than a caption explaining the axis.
 * • MARKERS ARE RINGS, not dots. They sit ON colour now, so they have to stay
 *   legible over any hue while letting it show through. The HELD row's is the
 *   exception: solid, and success-green, because it is a verdict rather than a
 *   sample. It reads as an annotation and not as a hue value precisely because
 *   green is nowhere on this blue scale — the one place an off-scale colour
 *   helps rather than confuses.
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
const HUE_MIN = 239.9, HUE_MAX = 279.9;

// [step, hex, hue in degrees] — from docs/generated/colour-02-hue-drift.json
const DRIFT = [["50","#f2f5ff",274.3],["100","#d8e1fe",271.9],["200","#b3c6fd",269.0],["300","#8eb0fc",265.1],["400","#5a94fa",261.0],["500","#0f6ee0",257.4],["600","#0053b0",254.7],["700","#003270",252.4],["800","#001a40",249.7],["900","#000b22",245.8]];
const HELD  = [["50","#f0f5ff",259.9],["100","#d2e3fe",259.9],["200","#aac9fc",259.9],["300","#86b3fb",259.9],["400","#5794fa",259.9],["500","#236ce1",259.9],["600","#104fb2",259.9],["700","#032e71",259.9],["800","#011841",259.9],["900","#000923",259.9]];
// The track's own background: a hue sweep at the seed's L and C.
const SWEEP = ["#007bd6","#0079d7","#0078d9","#0077da","#0076db","#0074dc","#0073dd","#0072de","#0071df","#006fe0","#0e6ee0","#1d6de1","#286be1","#306ae1","#3769e2","#3d67e2","#4366e2","#4865e2","#4d63e2","#5262e1","#5661e1","#5a60e0","#5e5ee0","#625ddf"];

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
  track.name = 'hue scale'; track.layoutMode = 'NONE';
  track.resize(100, 18); track.fills = []; track.clipsContent = false;
  track.layoutSizingHorizontal = 'FILL';
  const band = figma.createRectangle(); track.appendChild(band);
  band.name = 'spectrum'; band.x = 0; band.y = 6; band.resize(track.width, 8);
  band.strokes = [];                                      // create* ships a default stroke (gotcha 28)
  band.cornerRadius = 4;
  band.constraints = { horizontal: 'STRETCH', vertical: 'MIN' };
  band.fills = [{ type: 'GRADIENT_LINEAR', gradientTransform: [[1, 0, 0], [0, 1, 0]],
    gradientStops: SWEEP.map((hex, i) => ({
      position: i / (SWEEP.length - 1),
      color: { ...figma.util.solidPaint(hex).color, a: 1 },
    })) }];
  for (const [, , hue] of rows) {
    const m = figma.createEllipse(); track.appendChild(m);
    m.name = 'marker'; m.resize(10, 10);
    m.x = ((hue - HUE_MIN) / (HUE_MAX - HUE_MIN)) * (track.width - 10);
    m.y = 5;
    m.strokes = [bound('content/primary')];
    m.strokeWeight = 2; m.strokeAlign = 'CENTER';
    if (label === 'held') {
      // Solid, and green. The held marker is not a sample on the scale, it is
      // a verdict about the row: ten coincident rings already say "all in one
      // place", and the fill says why that is the good outcome — without a
      // legend, which the brief's no-annotation rule rules out. Full opacity,
      // because there is no density to encode when every step lands together.
      m.fills = [bound('feedback/success/solid/background')];
    } else {
      m.fills = [];                                       // hollow: it sits ON the spectrum
      m.opacity = 0.55;                                   // coincident rings accumulate
    }
    m.constraints = { horizontal: 'SCALE', vertical: 'MIN' };
  }
  return b;
};
block('drifting', DRIFT);
block('held', HELD);
text(card, 'The same ten steps. One of them is a family.', 13, 20, 'content/muted').name = 'closing line';

// ── mobile: the same card, reflowed ────────────────────────────────────────
// No bleed and no veil, unlike COLOUR-01. The brief's below-48rem rule is
// "full width beneath the prose, rows still stacked", and this card is
// self-contained: its tiles just get narrower (24px) and the hue track scales
// with them, which is the one thing that has to survive. Cloning and
// reflowing beats rescaling, which would drop the labels below real type size.
const MOBILE_GAP = '2183:92294';
const mgap = await figma.getNodeByIdAsync(MOBILE_GAP);
for (const c of [...mgap.children]) c.remove();
mgap.name = 'COLOUR-02 · drifting vs held';
mgap.strokes = []; mgap.dashPattern = []; mgap.fills = [];
mgap.layoutMode = 'VERTICAL'; mgap.primaryAxisSizingMode = 'AUTO';
mgap.counterAxisAlignItems = 'CENTER'; mgap.clipsContent = false;
mgap.paddingTop = mgap.paddingBottom = mgap.paddingLeft = mgap.paddingRight = 0;
mgap.layoutSizingHorizontal = 'FILL';
const mcard = card.clone();
mgap.appendChild(mcard);
mcard.name = 'drift comparison';
mcard.layoutSizingHorizontal = 'FILL';
mcard.primaryAxisSizingMode = 'AUTO';

return { desktop: { w: Math.round(card.width), h: Math.round(card.height) },
         mobile: { w: Math.round(mcard.width), h: Math.round(mcard.height) },
         rows: card.children.map(c => c.name) };
