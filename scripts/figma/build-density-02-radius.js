/**
 * DENSITY-02 — the docs-site home page derived-corner-radius diagram.
 *
 * Run through the Desktop Bridge (`figma_execute`). Idempotent: it clears the
 * DENSITY-02 frame and rebuilds. Flip `MOBILE` for the narrow breakpoint.
 *
 * ── THE NUMBERS ARE REAL, AND THEY HAD TO BE CHECKED FIRST ────────────────
 * Nothing here is scaled by hand. Each of the four buttons is ONE `Button`
 * instance at `Size=md` sitting in a well that pins a different Context
 * density mode, so its height is whatever the token layer says it is:
 *
 *     Dense 24 → 4  ·  Compact 32 → 6  ·  Comfortable 40 → 8  ·  Spacious 48 → 8
 *
 * ── WHY THE FORMULA IS SHOWN IN TWO STEPS ─────────────────────────────────
 * The brief asked for a single line, `radius = height × 0.1875`. Printed beside
 * these figures that line REFUTES ITSELF: 8 ÷ 40 is 0.20, 4 ÷ 24 is 0.167, and
 * only height 32 lands on 0.1875 exactly. A reader who checks the arithmetic —
 * exactly the reader this section is written for — concludes the diagram lies.
 *
 * It does not lie; it was incomplete. Checked against `packages/tokens/src/
 * context.json` across all **20 `framed-control` mode × size pairs**:
 *
 *   • RADIUS IS A PURE FUNCTION OF HEIGHT. Nine distinct heights, and the same
 *     height never gets two different radii — across different density modes
 *     AND different size slots. `height 40` is `dense/xl`, `compact/lg`,
 *     `comfortable/md` and `spacious/sm`, and all four ship radius 8.
 *   • EVERY ONE OF THE 20 EQUALS `snap(height × 3/16)` onto the rungs the
 *     family uses (2/4/6/8/10/12), ties resolved downward. No exceptions.
 *
 * So the ratio scatters because of the SNAP, not because anyone assigned by
 * hand — and the second line is what makes the first line true. This also
 * corrected `docs/character-brief.md`, which justified adopting the coefficient
 * on the grounds that today's radii float "with no pattern".
 *
 * ── COMFORTABLE AND SPACIOUS SHARE RADIUS 8. LEAVE IT ─────────────────────
 * Two of the four buttons have identical corners on visibly different heights.
 * That looks like a mistake and is the most informative thing in the frame: it
 * is the snap, visible. Do not pick four modes that avoid it, and do not round
 * the figures to hide it — the brief's own must-not is "Round the figures to
 * make them tidier. Real values, awkward ones included."
 *
 * ── THE RADIUS ARC WAS DROPPED, DELIBERATELY ──────────────────────────────
 * The brief asks for a faint arc traced on one corner of each button. Rejected:
 * over a primary-blue fill a `border/strong` arc is low-contrast, and placed
 * outside the corner it becomes a second annotation competing with the figures
 * directly below. At these sizes the buttons' own corners already read (Dense
 * is visibly tighter than Spacious), and the brief's own must-not warns against
 * drawing the arcs heavily.
 *
 * ── MOBILE IS A STAIRCASE, NOT A NARROWER ROW ────────────────────────────
 * Built as four equal columns first and rejected on sight. With centred buttons
 * of unequal widths, each gap is `(colW - w1)/2 + (colW - w2)/2`, so at 342px
 * they came out **31 / 18 / 7px** — the row visibly crowds to the right, and no
 * amount of alignment fixes it because the widths themselves are the cause.
 * Stacked, the four buttons share a LEFT edge and both dimensions grow down the
 * list; the figures then line up in a readable column instead of being squeezed
 * under a 75px button. The well is fixed at 96 — clear of the widest button
 * (Spacious at 90) — so the left edges stay put if a label ever changes length.
 *
 * ── TWO THINGS THAT WILL BITE ─────────────────────────────────────────────
 * • `well.resize(10, 48)` PINS THE WELL'S WIDTH TO 10 (gotcha 7 — resize flips
 *   sizing modes), which squashes every button into a 10px sliver. Re-assert
 *   `layoutSizingHorizontal = 'HUG'` immediately after. The first render showed
 *   four blue slivers reading "ti".
 * • `layoutSizingHorizontal = 'FILL'` DOES NOT EQUALISE COLUMNS — it hands each
 *   child its content width plus an equal share of the LEFTOVER, so the four
 *   came out 98/115/121/124 and the group sat off-centre. Set an explicit
 *   width, and FLOOR the division: `round(494/4)` is 124, and 4 × 124 = 496
 *   overflows the row by 2px.
 */
const MOBILE = false;
const DESKTOP_GAP = '2180:91936';
const MOBILE_GAP  = '2183:92275';
const CTX = 'VariableCollectionId:369:31958';
// [name, Context modeId, real framed-control/md height, real radius]
const MODES = [['Dense', '369:8', 24, 4], ['Compact', '369:9', 32, 6],
               ['Comfortable', '369:10', 40, 8], ['Spacious', '369:11', 48, 8]];
const CORNERS = ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'];
const TALLEST = 48;

const sets = {};
for (const p of figma.root.children) {
  let kids; try { kids = p.children; } catch (e) { continue; }
  for (const c of kids) if (c.type === 'COMPONENT_SET') sets[c.name] = c;
}
const vars = await figma.variables.getLocalVariablesAsync();
const V = {}; for (const v of vars) V[v.name] = v;
await figma.loadFontAsync({ family: 'Asta Sans', style: 'Regular' });
await figma.loadFontAsync({ family: 'Asta Sans', style: 'Medium' });
await figma.loadFontAsync({ family: 'JetBrains Mono', style: 'Regular' });
const ctxCollection = await figma.variables.getVariableCollectionByIdAsync(CTX);

const frame = (parent, name, mode, gapVar) => {
  const f = figma.createFrame(); parent.appendChild(f);
  f.name = name; f.fills = []; f.layoutMode = mode;
  f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
  if (gapVar) { f.itemSpacing = 12; f.setBoundVariable('itemSpacing', V[gapVar]); }
  return f;
};
const text = (parent, chars, o) => {
  const t = figma.createText(); parent.appendChild(t);
  t.fontName = o.mono ? { family: 'JetBrains Mono', style: 'Regular' }
                      : { family: 'Asta Sans', style: o.weight === 'Medium' ? 'Medium' : 'Regular' };
  t.characters = chars; t.fontSize = o.size; t.lineHeight = { unit: 'PIXELS', value: o.lh };
  t.fills = [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#000000'), 'color', V[o.colour])];
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  t.textAlignHorizontal = o.align || 'LEFT';
  return t;
};

const W       = MOBILE ? 342 : 560;
const PAD_X   = MOBILE ? 20 : 32,  PAD_X_VAR = MOBILE ? 'space/space-20' : 'space/space-32';
const PAD_Y   = MOBILE ? 24 : 32,  PAD_Y_VAR = MOBILE ? 'space/space-24' : 'space/space-32';
// A generic label, not a realistic one ("Continue"). The frame is a specimen of
// geometry, and a long word makes the Dense button so wide it stops reading as
// the tightest of the four.
const LABEL   = 'Button';   // both breakpoints — see the docstring
const NAME_SZ = MOBILE ? 13 : 14, FIG_SZ = MOBILE ? 11 : 11, BODY_SZ = MOBILE ? 13 : 14;
const WELL_W  = 96;   // mobile only: clears the widest button (Spacious, 90)

const gap = await figma.getNodeByIdAsync(MOBILE ? MOBILE_GAP : DESKTOP_GAP);
for (const c of [...gap.children]) c.remove();
gap.name = 'DENSITY-02 · derived corner radius';
gap.fills = []; gap.strokes = []; gap.dashPattern = [];
gap.layoutMode = 'VERTICAL'; gap.counterAxisSizingMode = 'FIXED';
gap.resize(W, MOBILE ? 320 : 420);
gap.primaryAxisSizingMode = MOBILE ? 'AUTO' : 'FIXED';
gap.counterAxisAlignItems = 'CENTER'; gap.primaryAxisAlignItems = 'CENTER';
gap.paddingTop = gap.paddingBottom = gap.paddingLeft = gap.paddingRight = 0;
gap.clipsContent = false; gap.layoutSizingHorizontal = 'FILL';

const card = figma.createFrame(); gap.appendChild(card);
card.name = 'derived radius';
card.layoutMode = 'VERTICAL'; card.counterAxisSizingMode = 'FIXED';
card.resize(W, MOBILE ? 100 : 420);
card.primaryAxisSizingMode = MOBILE ? 'AUTO' : 'FIXED';   // re-assert after resize (gotcha 7)
card.counterAxisAlignItems = 'CENTER'; card.primaryAxisAlignItems = 'CENTER';
// prose rhythm comes from the flow scale, not hand-picked gaps — the same
// `flow/*` Context variables the web's Prose owl resolves (RFC 0016)
card.itemSpacing = 32; card.setBoundVariable('itemSpacing', V['flow/section']);
for (const p of ['paddingLeft', 'paddingRight']) { card[p] = PAD_X; card.setBoundVariable(p, V[PAD_X_VAR]); }
for (const p of ['paddingTop', 'paddingBottom']) { card[p] = PAD_Y; card.setBoundVariable(p, V[PAD_Y_VAR]); }
card.fills = [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#ffffff'), 'color', V['surface/raised'])];
card.strokes = [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#000000'), 'color', V['border/subtle'])];
card.strokeAlign = 'INSIDE'; card.strokeWeight = 1; card.setBoundVariable('strokeWeight', V['border-width/1']);
for (const c of CORNERS) card.setBoundVariable(c, V[MOBILE ? 'card/md/radius' : 'card/lg/radius']);
card.layoutSizingHorizontal = 'FILL';

// ── the four densities ───────────────────────────────────────────────────
// DESKTOP is a ROW, bottom-aligned so height reads as growth upward.
// MOBILE is a STAIRCASE, and that is not a stylistic preference. Four equal
// columns with centred buttons of unequal widths put each gap at
// `(colW - w1)/2 + (colW - w2)/2`, which at 342px came out 31 / 18 / 7px —
// visibly crowding to the right. Stacked, the buttons share a LEFT edge and
// both dimensions grow down the list, so there is no distribution to get
// wrong, and the figures line up in a readable column.
const cols = [];
const list = frame(card, 'four densities', MOBILE ? 'VERTICAL' : 'HORIZONTAL');
list.layoutSizingHorizontal = 'FILL';
// SPACE_AROUND on desktop, not MIN and not equal-width columns. Fixed columns
// of 123 with centred buttons gave gaps of 57 / 40 / 25px; equal space AROUND
// four HUG columns of near-equal width gives 57 / 51 / 52.
list.primaryAxisAlignItems = MOBILE ? 'MIN' : 'SPACE_AROUND';
list.counterAxisAlignItems = 'MIN';
if (MOBILE) { list.itemSpacing = 20; list.setBoundVariable('itemSpacing', V['space/space-20']); }

for (const [name, modeId, h, r] of MODES) {
  const cell = MOBILE ? frame(list, 'row — ' + name, 'HORIZONTAL')
                      : frame(list, 'column — ' + name, 'VERTICAL', 'flow/tight');
  if (MOBILE) {
    cell.itemSpacing = 16; cell.setBoundVariable('itemSpacing', V['space/space-16']);
    cell.counterAxisAlignItems = 'CENTER';
  } else {
    cell.counterAxisAlignItems = 'CENTER';
  }

  const well = figma.createFrame(); cell.appendChild(well);
  well.name = 'well'; well.fills = [];
  if (MOBILE) {
    // 96 clears the widest button (Spacious at 90) with a little slack, so the
    // four left edges line up and nothing shifts when a label changes length.
    well.layoutMode = 'HORIZONTAL';
    well.resize(WELL_W, 10);
    well.layoutSizingHorizontal = 'FIXED';
    well.layoutSizingVertical = 'HUG';        // resize() pinned it FIXED (gotcha 7)
    well.primaryAxisAlignItems = 'MIN';       // shared LEFT edge
  } else {
    well.layoutMode = 'VERTICAL';
    well.resize(10, TALLEST);
    well.layoutSizingHorizontal = 'HUG';      // resize() pinned it FIXED at 10 (gotcha 7)
    well.layoutSizingVertical = 'FIXED';
    well.primaryAxisAlignItems = 'MAX';       // shared BOTTOM edge across all four
  }
  well.counterAxisAlignItems = 'CENTER';
  well.setExplicitVariableModeForCollection(ctxCollection, modeId);
  const b = sets['Button'].children.find(c => c.name === 'Variant=primary, Size=md, State=default').createInstance();
  well.appendChild(b);
  b.setProperties({ 'Label#347:3401': LABEL });

  const caps = frame(cell, 'figures', 'VERTICAL');
  caps.itemSpacing = 2;
  caps.counterAxisAlignItems = MOBILE ? 'MIN' : 'CENTER';
  const align = MOBILE ? 'LEFT' : 'CENTER';
  text(caps, name, { size: NAME_SZ, lh: NAME_SZ + 4, weight: 'Medium', colour: 'content/secondary', align });
  if (MOBILE) {
    text(caps, 'height ' + h + ' · radius ' + r, { size: FIG_SZ, lh: FIG_SZ + 4, mono: true, colour: 'content/muted', align });
  } else {
    text(caps, 'height ' + h, { size: FIG_SZ, lh: FIG_SZ + 4, mono: true, colour: 'content/muted', align });
    text(caps, 'radius ' + r, { size: FIG_SZ, lh: FIG_SZ + 4, mono: true, colour: 'content/muted', align });
  }
  cols.push(cell);
}
// ── the derivation, in two steps: the snap is what makes step one true ────
const formula = frame(card, 'formula', 'VERTICAL', 'flow/tight');
formula.counterAxisAlignItems = 'CENTER';
formula.layoutSizingHorizontal = 'FILL';
text(formula, 'radius = height × 3/16',
     { size: BODY_SZ, lh: 20, mono: true, colour: 'content/primary', align: 'CENTER' });
const s = text(formula, 'snapped to the nearest step on the radius scale',
               { size: BODY_SZ, lh: 20, colour: 'content/muted', align: 'CENTER' });
s.textAutoResize = 'HEIGHT'; s.layoutSizingHorizontal = 'FILL';

text(card, 'Nobody assigns these. They fall out.',
     { size: BODY_SZ, lh: 20, colour: 'content/muted', align: 'CENTER' });

return {
  card: { id: card.id, w: Math.round(card.width), h: Math.round(card.height) },
  buttons: cols.map(c => { const b = c.children[0].children[0];
                           return Math.round(b.width) + '×' + Math.round(b.height); }),
};
