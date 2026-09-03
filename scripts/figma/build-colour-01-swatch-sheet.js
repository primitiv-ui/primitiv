/**
 * COLOUR-01 — the docs-site home page colour specimen sheet.
 *
 * Run through the Desktop Bridge (`figma_execute`). Idempotent: it clears the
 * COLOUR-01 frame on `Home — desktop (v3)` and rebuilds.
 *
 * ── WHERE THE DATA COMES FROM, AND WHY IT MATTERS ─────────────────────────
 * The sheet's entire claim is that THE ENGINE chose each foreground. So the
 * hexes below are not picked by eye and not derived from a light/dark
 * threshold — they are dumped straight out of harmoni-core:
 *
 *   cargo run -p harmoni-core --features swatch-sheet --example swatch-sheet
 *
 * which writes `docs/generated/colour-01-swatch-sheet.json` (both themes, plus
 * each pairing's `foregroundSource` and contrast ratio). Regenerate that and
 * re-paste below whenever the palette moves. A hand-picked foreground here
 * would produce a visually similar image that is a lie about the exact thing
 * the section asserts.
 *
 * ── FOUR DECISIONS THAT LOOK ARBITRARY AND ARE NOT ────────────────────────
 * • LIGHT TO DARK, left to right. In the DARK palette step 900 is the lightest
 *   and 50 the darkest, so each row runs 900 -> 50. The visual progression is
 *   the conventional one and every swatch still carries its true step number.
 * • FIVE RAMPS, not ten. An earlier pass added violet/teal/lime/amber/magenta
 *   to show the engine across the wheel; it read as a swatch dump and buried
 *   the point. brand · success · warning · danger · info, in that order.
 * • FLUSH SWATCHES. Any gap inside a row stops it reading as one scale.
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
const LABEL_W = 76, SW_H = 68;

// [step, swatch hex, the engine's best_foreground for that swatch]
const DATA = {
  brand:[["50","#121922","#e1ecfe"],["100","#0e2140","#e1ecfe"],["200","#032967","#e1ecfe"],["300","#053a8a","#e1ecfe"],["400","#1452b5","#e1ecfe"],["500","#236ce1","#ffffff"],["600","#5291f9","#121922"],["700","#8bb6fb","#121922"],["800","#bed6fd","#121922"],["900","#e1ecfe","#121922"]],
  success:[["50","#131b12","#c9fbc6"],["100","#0d290c","#c9fbc6"],["200","#043906","#c9fbc6"],["300","#084f0c","#c9fbc6"],["400","#0f6c14","#c9fbc6"],["500","#008c11","#000000"],["600","#4dab4c","#131b12"],["700","#7ccc78","#131b12"],["800","#a7e8a4","#131b12"],["900","#c9fbc6","#131b12"]],
  warning:[["50","#1e170f","#fee7d0"],["100","#382105","#fee7d0"],["200","#533105","#fee7d0"],["300","#79490b","#fee7d0"],["400","#ad6c14","#000000"],["500","#e88e00","#1e170f"],["600","#f5a54b","#1e170f"],["700","#fdbe7e","#1e170f"],["800","#fdd7b0","#1e170f"],["900","#fee7d0","#1e170f"]],
  danger:[["50","#231412","#fee4e1"],["100","#3e110e","#fee4e1"],["200","#5d0607","#fee4e1"],["300","#7f0b0d","#fee4e1"],["400","#ad1316","#fee4e1"],["500","#db2424","#ffffff"],["600","#f65e53","#231412"],["700","#fc988c","#231412"],["800","#fdc6bf","#231412"],["900","#fee4e1","#231412"]],
  info:[["50","#121a1b","#c7f5fc"],["100","#0c272b","#c7f5fc"],["200","#05383e","#c7f5fc"],["300","#094e57","#c7f5fc"],["400","#116d78","#c7f5fc"],["500","#008e9d","#121a1b"],["600","#4fabb8","#121a1b"],["700","#7cc8d4","#121a1b"],["800","#a6e3ec","#121a1b"],["900","#c7f5fc","#121a1b"]],
};

const vars = await figma.variables.getLocalVariablesAsync();
const V = {}; for (const v of vars) V[v.name] = v;
await figma.loadFontAsync({ family: 'Asta Sans', style: 'Regular' });

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
card.itemSpacing = 16;
card.setBoundVariable('itemSpacing', V['space/space-16']);
card.paddingTop = card.paddingBottom = card.paddingLeft = card.paddingRight = 32;
for (const p of ['paddingTop','paddingBottom','paddingLeft','paddingRight']) card.setBoundVariable(p, V['space/space-32']);
card.fills = [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#ffffff'), 'color', V['surface/raised'])];
card.strokes = [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#000000'), 'color', V['border/subtle'])];
card.strokeAlign = 'INSIDE'; card.strokeWeight = 1; card.setBoundVariable('strokeWeight', V['border-width/1']);
for (const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']) card.setBoundVariable(c, V['card/lg/radius']);
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
  t.fills = bindTo
    ? [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#000000'), 'color', bindTo)]
    : [figma.util.solidPaint(fill)];
  t.textAlignHorizontal = 'CENTER';
  t.textAutoResize = 'HEIGHT';
  return t;
};

for (const [name, steps] of Object.entries(DATA)) {
  const row = figma.createFrame();
  card.appendChild(row);
  row.name = 'ramp — ' + name;
  row.layoutMode = 'HORIZONTAL'; row.counterAxisAlignItems = 'CENTER';
  row.primaryAxisSizingMode = 'FIXED'; row.counterAxisSizingMode = 'AUTO';
  row.itemSpacing = 12; row.fills = [];
  row.layoutSizingHorizontal = 'FILL';

  const label = text(row, name, 13, 20, null, V['content/secondary']);
  label.name = 'ramp name';
  label.textAlignHorizontal = 'LEFT';
  label.resize(LABEL_W, label.height);
  label.layoutSizingHorizontal = 'FIXED';

  const strip = figma.createFrame();
  row.appendChild(strip);
  strip.name = 'ramp';
  strip.layoutMode = 'HORIZONTAL'; strip.itemSpacing = 0;  // flush, or it stops reading as a scale
  strip.counterAxisSizingMode = 'AUTO'; strip.primaryAxisSizingMode = 'FIXED';
  strip.fills = []; strip.clipsContent = true;
  strip.layoutSizingHorizontal = 'FILL';
  for (const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']) strip.setBoundVariable(c, V['swatch/md/radius']);

  for (const [step, hex, fg] of [...steps].reverse()) {    // light -> dark
    const sw = figma.createFrame();
    strip.appendChild(sw);
    sw.name = name + '/' + step;
    sw.layoutMode = 'VERTICAL';
    sw.primaryAxisAlignItems = 'CENTER'; sw.counterAxisAlignItems = 'CENTER';
    sw.counterAxisSizingMode = 'FIXED'; sw.primaryAxisSizingMode = 'FIXED';
    sw.resize(100, SW_H); sw.itemSpacing = 2;
    sw.fills = [figma.util.solidPaint(hex)];
    sw.strokes = [];                                      // create* ships a default stroke (gotcha 28)
    sw.layoutSizingHorizontal = 'FILL';
    // "Ag": the ascender and descender together are what make legibility
    // judgeable rather than merely assertable.
    text(sw, 'Ag', 18, 22, fg);
    const cap = text(sw, step, 10, 13, fg);
    cap.opacity = 0.7;
  }
}
return { card: { w: Math.round(card.width), h: Math.round(card.height) },
         order: card.children.map(c => c.name.replace('ramp — ', '')) };
