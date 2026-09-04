/**
 * DENSITY-01 — the docs-site home page density demo panel.
 *
 * Run through the Desktop Bridge (`figma_execute`). Idempotent: it clears the
 * DENSITY-01 frame on `Home — desktop (v3)` and on `Home — mobile (v3)` and
 * rebuilds both. Pass `MOBILE` to pick which.
 *
 * ── WHAT THIS FRAME IS, AND WHAT IT IS NOT ────────────────────────────────
 * The brief types DENSITY-01 as a LIVE DEMO. Figma cannot hold the dial, so
 * this frame is the panel's DESIGN at its load state — Comfortable selected —
 * and the site implements the four-way switch over it. Do not "improve" the
 * still into two panels at two densities side by side: the brief's composition
 * argument is ONE stage of FIXED height driven by ONE control, and a
 * before/after pair silently replaces that with a comparison.
 *
 * ── NOTHING IS HARDCODED PER DENSITY, AND THAT IS THE WHOLE POINT ─────────
 * The `stage` frame pins `Context = Comfortable` and every descendant resolves
 * its own geometry AND ITS OWN TYPE SIZE through the token layer. To see
 * another mode, change that one mode pin on `stage` and re-render — nothing
 * else in this script knows which density it is drawing. Verified at both
 * extremes: Dense reads as an operations tool, Spacious as a marketing page,
 * with identical markup. Natural stage heights, measured:
 *
 *     Dense 298 · Compact 432 · Comfortable 460 · Spacious 588
 *
 * ── FIVE THINGS THAT WILL BITE ────────────────────────────────────────────
 * • A DENSITY MODE CHANGE DOES NOT REFLOW WITHIN THE SAME `figma_execute`
 *   CALL. Set the pin, return, and measure in the NEXT call. Measuring in the
 *   same call returns the PREVIOUS mode's geometry and looks exactly like
 *   "density does nothing" — all four modes reported an identical 472 here
 *   before this was understood. Cost a full wrong diagnosis.
 * • TEXT NODES YOU CREATE MUST BIND `fontSize` AND `lineHeight` TO THE
 *   CONTEXT VARIABLES, not carry literals. Type genuinely is density-scaled
 *   (`heading/h3` runs 16 / 26 / 32 / 52 across Dense→Spacious), so a
 *   hand-set 32 silently opts the editorial column out of the very thing the
 *   panel exists to demonstrate.
 * • A `Divider` at `Orientation=vertical` still FILLs on the HORIZONTAL axis
 *   if you ask it to. In a horizontal stage that makes it a third flex child
 *   and it eats a third of the width (both regions came out 357 instead of
 *   535). It wants `layoutSizingHorizontal = 'FIXED'` at 1 and
 *   `layoutSizingVertical = 'FILL'` — and the FILL only counts because the
 *   stage is FIXED height (CLAUDE.md gotcha 29).
 * • THE STAGE IS FIXED HEIGHT (brief must-not: "Let the panel change height
 *   between modes"), sized to 620 so Spacious very nearly fits. The honest
 *   consequence is that the SITE's stage must scroll internally at Spacious,
 *   and that Dense leaves real empty space below the table. Both are correct:
 *   a stage that resizes makes the page jump, which hides the effect.
 * • `Table / Row` needs the `Cells=custom` variants to hold a column layout of
 *   our own; `Cells=fixed` bakes the master's widths and rejects `resize()` on
 *   its sublayers (gotcha 14). Same recipe as HERO-01.
 *
 * ── TWO DELIBERATE DEPARTURES FROM THE BRIEF ──────────────────────────────
 * • EIGHT BODY ROWS, not six. Six left ~160px of dead stage below the table at
 *   Comfortable, which reads as a layout fault rather than as headroom. Eight
 *   fills the fixed stage at the mode the still actually ships.
 * • MOBILE KEEPS ALL FOUR RADIOS ON ONE ROW as the brief demands, which at
 *   342px only works at `Size=xs` with 8px gaps (measured: 266px of 316
 *   available). The readout then moves to its own line beneath them rather
 *   than being dropped — the craft notes call it the detail that converts a
 *   developer, and it costs one line.
 */
const MOBILE = false;                       // flip to build the mobile frame
const DESKTOP_GAP = '2180:91926';
const MOBILE_GAP  = '2183:92265';
const CTX = 'VariableCollectionId:369:31958';
const MODES = { Dense: '369:8', Compact: '369:9', Comfortable: '369:10', Spacious: '369:11' };
const CORNERS = ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'];

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

const frame = (parent, name, mode, gapPx, gapVar) => {
  const f = figma.createFrame(); parent.appendChild(f);   // append FIRST (gotcha 13)
  f.name = name; f.fills = [];
  f.layoutMode = mode;                                    // createFrame is NONE (gotcha 22)
  f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
  if (gapPx != null) { f.itemSpacing = gapPx; if (gapVar) f.setBoundVariable('itemSpacing', V[gapVar]); }
  return f;
};
const pad = (f, px, name) => {
  for (const p of ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'])
    { f[p] = px; f.setBoundVariable(p, V[name]); }
};
const text = (parent, chars, o) => {
  const t = figma.createText(); parent.appendChild(t);
  t.fontName = o.mono ? { family: 'JetBrains Mono', style: 'Regular' }
                      : { family: 'Asta Sans', style: o.weight === 'Medium' ? 'Medium' : 'Regular' };
  t.characters = chars;
  t.fontSize = o.size; t.lineHeight = { unit: 'PIXELS', value: o.lh };
  t.fills = [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#000000'), 'color', V[o.colour])];
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  // bind, never hardcode — type is density-scaled and a literal opts out of it
  if (o.fam) {
    t.setBoundVariable('fontSize', V[o.fam + '/font-size']);
    t.setBoundVariable('lineHeight', V[o.fam + '/line-height']);
  }
  if (o.flow) { t.textAutoResize = 'HEIGHT'; t.layoutSizingHorizontal = 'FILL'; }
  return t;
};
const put = (parent, setName, variant, props) => {
  const master = sets[setName].children.find(c => c.name === variant);
  if (!master) throw new Error('missing ' + setName + ' / ' + variant);
  const i = master.createInstance(); parent.appendChild(i);
  if (props) { try { i.setProperties(props); } catch (e) {} }
  return i;
};
const findSlot = (n, d) => {
  if (d < 0) return null;
  if (n.type === 'SLOT') return n;
  let k; try { k = n.children; } catch (e) { return null; }
  if (k) for (const c of k) { const r = findSlot(c, d - 1); if (r) return r; }
  return null;
};
const fillH = (n) => { try { n.layoutSizingHorizontal = 'FILL'; } catch (e) {} return n; };
const setQuote = async (bq, chars) => {
  let q = null;
  (function walk(n, d) { if (q || d < 0) return;
    if (n.type === 'TEXT' && n.name === 'Quote') { q = n; return; }
    let k; try { k = n.children; } catch (e) { return; } if (k) for (const c of k) walk(c, d - 1); })(bq, 4);
  if (!q) return;
  for (const f of q.getRangeAllFontNames(0, q.characters.length)) await figma.loadFontAsync(f);
  q.characters = chars;
};

const W        = MOBILE ? 342 : 1200;
const STAGE_H  = MOBILE ? null : 620;         // fixed on desktop; mobile hugs and scrolls the page
const COLS     = MOBILE ? [125, 100, 85] : [185, 145, 110, 95];
const HEAD     = MOBILE ? ['Name', 'Owner', 'Status'] : ['Name', 'Owner', 'Updated', 'Status'];
const CELL_SZ  = MOBILE ? 'xs' : 'sm';
const CTRL_SZ  = MOBILE ? 'xs' : 'sm';
const BODY = [
  ['Checkout flow',    'A. Lovelace',  '2h ago', 'success', 'Live'],
  ['Billing settings', 'G. Hopper',    '5h ago', 'success', 'Live'],
  ['Search index',     'K. Johnson',   'Mon',    'warning', 'Degraded'],
  ['Export worker',    'A. Turing',    'Mon',    'success', 'Live'],
  ['Audit log',        'B. Liskov',    'Tue',    'info',    'Staged'],
  ['Legacy importer',  'E. Dijkstra',  'Mar 12', 'danger',  'Failing'],
  ['Webhook relay',    'M. Hamilton',  'Tue',    'success', 'Live'],
  ['Invoice PDFs',     'R. Hoare',     'Mar 09', 'info',    'Staged'],
];
const QUOTE = 'One attribute, and the table got tighter while the article got roomier. ' +
              'Nobody had to agree on a row height.';

const gap = await figma.getNodeByIdAsync(MOBILE ? MOBILE_GAP : DESKTOP_GAP);
for (const c of [...gap.children]) c.remove();
gap.name = 'DENSITY-01 · density demo panel';
gap.fills = []; gap.strokes = []; gap.dashPattern = [];
gap.layoutMode = 'VERTICAL'; gap.primaryAxisSizingMode = 'AUTO';
gap.counterAxisAlignItems = 'MIN'; gap.clipsContent = false;
gap.paddingTop = gap.paddingBottom = gap.paddingLeft = gap.paddingRight = 0;
gap.layoutSizingHorizontal = 'FILL';

const card = figma.createFrame(); gap.appendChild(card);
card.name = 'DENSITY-01 · density demo panel';
card.layoutMode = 'VERTICAL'; card.itemSpacing = 0;
card.counterAxisSizingMode = 'FIXED'; card.resize(W, 100);
card.primaryAxisSizingMode = 'AUTO';                       // re-assert after resize (gotcha 7)
card.fills = [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#ffffff'), 'color', V['surface/raised'])];
card.strokes = [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#000000'), 'color', V['border/subtle'])];
card.strokeAlign = 'INSIDE'; card.strokeWeight = 1;
card.setBoundVariable('strokeWeight', V['border-width/1']);
for (const c of CORNERS) card.setBoundVariable(c, V[MOBILE ? 'card/md/radius' : 'card/lg/radius']);
card.clipsContent = true; card.layoutSizingHorizontal = 'FILL';

// ── control strip ──────────────────────────────────────────────────────────
const strip = MOBILE ? frame(card, 'control strip', 'VERTICAL', 8, 'space/space-8')
                     : frame(card, 'control strip', 'HORIZONTAL', 16, 'space/space-16');
pad(strip, MOBILE ? 12 : 16, MOBILE ? 'space/space-12' : 'space/space-16');
strip.counterAxisAlignItems = MOBILE ? 'MIN' : 'CENTER';
if (!MOBILE) strip.primaryAxisAlignItems = 'SPACE_BETWEEN';
strip.layoutSizingHorizontal = 'FILL';

const radios = frame(strip, 'density radios', 'HORIZONTAL',
                     MOBILE ? 8 : 24, MOBILE ? 'space/space-8' : 'space/space-24');
radios.counterAxisAlignItems = 'CENTER';
for (const [label, on] of [['Dense', 0], ['Compact', 0], ['Comfortable', 1], ['Spacious', 0]])
  put(radios, 'Radio', `Size=${MOBILE ? 'xs' : 'md'}, State=${on ? 'checked' : 'unchecked'}, Interaction=default`,
      { 'Label#881:183': label, 'Show label#881:224': true });

text(strip, 'data-density="comfortable"',
     { size: 11, lh: 16, mono: true, colour: 'content/muted', fam: 'code/xs' });

fillH(put(card, 'Divider', 'Orientation=horizontal'));

// ── stage ──────────────────────────────────────────────────────────────────
const stage = frame(card, 'stage', MOBILE ? 'VERTICAL' : 'HORIZONTAL',
                    MOBILE ? 24 : 32, MOBILE ? 'space/space-24' : 'space/space-32');
pad(stage, MOBILE ? 16 : 32, MOBILE ? 'space/space-16' : 'space/space-32');
stage.counterAxisAlignItems = 'MIN';
stage.layoutSizingHorizontal = 'FILL';
stage.clipsContent = true;
stage.setExplicitVariableModeForCollection(ctxCollection, MODES.Comfortable);

const OVERLINE = { size: 12, lh: 16, weight: 'Medium', colour: 'content/muted', fam: 'overline/xs' };
const region = (name) => {
  const r = frame(stage, name, 'VERTICAL', MOBILE ? 12 : 16, MOBILE ? 'space/space-12' : 'space/space-16');
  r.counterAxisAlignItems = 'MIN';
  return fillH(r);
};

// LEFT / TOP — the operations scene
const ops = region('region — operations');
text(ops, 'OPERATIONS', OVERLINE);
const toolbar = frame(ops, 'toolbar', 'HORIZONTAL', MOBILE ? 8 : 16, MOBILE ? 'space/space-8' : 'space/space-16');
toolbar.counterAxisAlignItems = 'CENTER';
toolbar.primaryAxisAlignItems = 'SPACE_BETWEEN';
fillH(toolbar);
const seg = put(toolbar, 'Segmented Control', `Size=${CTRL_SZ}, Count=3`);
// the set exposes only Size and Count — labels live on the nested Items, and
// each needs FILL or the control sits short of its own width
['All', 'Active', 'Archived'].forEach((label, i) => {
  const item = seg.children[i]; if (!item) return;
  try { item.setProperties({ 'Label#1216:207': label }); } catch (e) {}
  fillH(item);
});
put(toolbar, 'Button', `Variant=secondary, Size=${CTRL_SZ}, State=default`, { 'Label#347:3401': 'Export' });

const table = fillH(frame(ops, 'table', 'VERTICAL', 0));
const cellMaster = sets['Table / Cell'].children.find(c => c.name === `Size=${CELL_SZ}, Align=start`);
const mkRow = (variantName, cells) => {
  const r = sets['Table / Row'].children.find(c => c.name === variantName).createInstance();
  table.appendChild(r); fillH(r);
  const slot = findSlot(r, 5); if (!slot) return;
  for (const c of [...slot.children]) { try { c.remove(); } catch (e) {} }
  for (const spec of cells) {
    const cell = cellMaster.createInstance(); slot.appendChild(cell);
    if (spec.badge) {
      cell.setProperties({ 'Show text#1883:19': false, 'Show content#1883:3': true, 'Right Border#604:175': false });
      cell.resize(spec.w, cell.height);
      const inner = findSlot(cell, 5);
      if (inner) {
        for (const c of [...inner.children]) { try { c.remove(); } catch (e) {} }
        const b = sets['Badge'].children
          .find(x => x.name === `Tone=${spec.tone}, Variant=label, Size=${MOBILE ? 'xs' : 'sm'}`).createInstance();
        inner.appendChild(b); b.setProperties({ 'Label#1389:0': spec.badge });
        try {
          inner.layoutMode = 'HORIZONTAL'; inner.primaryAxisSizingMode = 'AUTO';
          inner.counterAxisSizingMode = 'AUTO'; inner.counterAxisAlignItems = 'CENTER';
        } catch (e) {}
      }
    } else {
      cell.setProperties({ 'Text#604:164': spec.text, 'Show text#1883:19': true, 'Show content#1883:3': false, 'Right Border#604:175': false });
      cell.resize(spec.w, cell.height);
    }
  }
  try {
    slot.layoutMode = 'HORIZONTAL'; slot.primaryAxisSizingMode = 'AUTO';
    slot.counterAxisSizingMode = 'AUTO'; slot.itemSpacing = 0;
  } catch (e) {}
};
mkRow('Section=head, State=default, Cells=custom', HEAD.map((t, i) => ({ text: t, w: COLS[i] })));
for (const [name, owner, when, tone, status] of (MOBILE ? BODY.slice(0, 6) : BODY)) {
  const cells = MOBILE ? [{ text: name, w: COLS[0] }, { text: owner, w: COLS[1] }]
                       : [{ text: name, w: COLS[0] }, { text: owner, w: COLS[1] }, { text: when, w: COLS[2] }];
  cells.push({ badge: status, tone, w: COLS[COLS.length - 1] });
  mkRow('Section=body, State=default, Cells=custom', cells);
}

// the seam between the two scenes
const seam = put(stage, 'Divider', MOBILE ? 'Orientation=horizontal' : 'Orientation=vertical');
if (MOBILE) fillH(seam);
else { seam.layoutSizingHorizontal = 'FIXED'; seam.resize(1, seam.height); }

// RIGHT / BOTTOM — the editorial scene
const ed = region('region — editorial');
text(ed, 'EDITORIAL', OVERLINE);
text(ed, 'What we learned shipping one system to two products',
     { size: 32, lh: 40, weight: 'Medium', colour: 'content/primary', fam: 'heading/h3', flow: true });
text(ed, 'The operations team wanted every row on screen at once. The marketing team wanted room to breathe. For a year we ran two component libraries and paid for it twice.',
     { size: 16, lh: 24, colour: 'content/secondary', fam: 'body/md', flow: true });
if (!MOBILE)   // below 36rem the brief cuts the editorial region to one paragraph
  text(ed, 'Density is inherited. Set it once at the root, or on the one panel that needs to be tighter than everything around it.',
       { size: 16, lh: 24, colour: 'content/secondary', fam: 'body/md', flow: true });
const bq = fillH(put(ed, 'Blockquote', `Tone=accent, Citation=without, Size=${MOBILE ? 'sm' : 'md'}`));
await setQuote(bq, QUOTE);
put(ed, 'Button', 'Variant=primary, Size=md, State=default', { 'Label#347:3401': 'Read more' });

// The stage is fixed LAST, so the regions measure naturally first and the
// vertical seam has a FIXED-height parent to FILL against (gotcha 29).
if (STAGE_H) {
  stage.layoutSizingVertical = 'FIXED';
  stage.resize(stage.width, STAGE_H);
  stage.layoutSizingHorizontal = 'FILL';
  seam.layoutSizingVertical = 'FILL';
}

return {
  card: { id: card.id, w: Math.round(card.width), h: Math.round(card.height) },
  stage: Math.round(stage.height),
  ops: { w: Math.round(ops.width), h: Math.round(ops.height) },
  ed: { w: Math.round(ed.width), h: Math.round(ed.height) },
};
