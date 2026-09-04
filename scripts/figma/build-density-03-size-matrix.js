/**
 * DENSITY-03 — every size at every density, plus the copy block that frames it.
 *
 * Run through the Desktop Bridge (`figma_execute`). Idempotent: it removes any
 * existing block/matrix and rebuilds. Flip `MOBILE` for the narrow breakpoint.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 * The density section argued density and never mentioned `size`, so a reader
 * could reasonably conclude density IS the size control. It is not: density is
 * set once for a product or region, size is set per component, and the two
 * compose. This is the frame that shows the whole space rather than asserting
 * it.
 *
 * ── THE NUMBERS ARE THE ARGUMENT, AND THEY ARE REAL ──────────────────────
 * Every button is a real `Button` instance at its own size slot, inside a strip
 * pinning its own Context density mode. Nothing is scaled. The heights that
 * fall out are exactly `framed-control/{size}/height`:
 *
 *                 xs   sm   md   lg   xl
 *     dense       16   20   24   32   40
 *     compact     20   28   32   40   48
 *     comfortable 24   32   40   48   56
 *     spacious    28   40   48   56   68
 *
 * **Equal heights run diagonally**, which is the whole point made visible:
 * `dense/xl`, `compact/lg`, `comfortable/md` and `spacious/sm` are all 40px —
 * four different routes to the same physical control. That is what independent
 * axes that compose actually look like, and it is measured, not drawn.
 *
 * ── THE DENSITY PIN GOES ON THE CELL STRIP, NEVER THE ROW ────────────────
 * A row also holds the density's own NAME. Pin the row and that label scales
 * with the mode it is naming — Dense's label would render smaller than
 * Spacious's, which reads as a mistake and quietly undermines the axis being
 * demonstrated. Pin the strip of cells only.
 *
 * ── COLUMN WIDTHS ARE MEASURED FIRST, NOT GUESSED ────────────────────────
 * Button width varies with both axes, so a column has to be as wide as its
 * widest cell (spacious, always). Build a throwaway probe strip per density
 * offscreen, read the real widths, take the per-column max, then discard it:
 *
 *     colW = [44, 59, 75, 94, 105]   (377px of grid in a 1200px column)
 *
 * ── MOBILE SHOWS sm/md/lg, AND THE CHOICE IS NOT ARBITRARY ───────────────
 * Five columns do not fit at 342px. Dropping to the extremes (xs/md/xl) would
 * show more range but leave only TWO cells on the 40px diagonal; sm/md/lg keeps
 * THREE (`compact/lg`, `comfortable/md`, `spacious/sm`), so the diagonal — the
 * thing the copy points at — stays legible. The copy was reworded from "four of
 * these" to "equal heights run diagonally" for exactly this reason: a literal
 * count is true on desktop and false on mobile.
 *
 * Mobile also moves the density label ABOVE its row. A left label column cannot
 * hold "Comfortable" at 342px without eating the grid.
 */
const MOBILE = false;
const DESKTOP_SECTION = '2180:91847';
const MOBILE_SECTION  = '2183:92259';
const CTX = 'VariableCollectionId:369:31958';
const MODES = [['Dense','369:8'],['Compact','369:9'],['Comfortable','369:10'],['Spacious','369:11']];
const SIZES = MOBILE ? ['sm','md','lg'] : ['xs','sm','md','lg','xl'];
const COLGAP = MOBILE ? 16 : 48;
const LABELW = 96;
const LABEL = 'Button';   // change here; column widths re-derive from it

const sets = {};
for (const p of figma.root.children) {
  let kids; try { kids = p.children; } catch (e) { continue; }
  for (const c of kids) if (c.type === 'COMPONENT_SET') sets[c.name] = c;
}
const vars = await figma.variables.getLocalVariablesAsync();
const V = {}; for (const v of vars) V[v.name] = v;
const ctxCollection = await figma.variables.getVariableCollectionByIdAsync(CTX);
await figma.loadFontAsync({ family: 'Asta Sans', style: 'Regular' });
await figma.loadFontAsync({ family: 'Asta Sans', style: 'Medium' });

// match the page's existing h4 face rather than guessing at it
const probeSec = await figma.getNodeByIdAsync(DESKTOP_SECTION);
let h4font = null;
(function find(n, d) { if (h4font || d > 6) return;
  for (const c of n.children || []) {
    if (c.type === 'TEXT' && c.name === 'heading/h4') { h4font = c.fontName; return; }
    find(c, d + 1);
  } })(probeSec, 0);
await figma.loadFontAsync(h4font);

// ── column widths are PROBED, never hardcoded ────────────────────────────
// Button width varies with BOTH axes and with the label, so a column has to be
// as wide as its widest cell (spacious, always). An earlier version baked the
// widths for the label "Save"; changing the label to "Button" then clipped
// cells on both breakpoints with nothing erroring. Measuring at build time is
// what makes the label a safe thing to change.
const probe = figma.createFrame();
figma.currentPage.appendChild(probe);
probe.layoutMode = 'VERTICAL'; probe.x = -9000; probe.y = -9000;
for (const [, id] of MODES) {
  const strip = figma.createFrame(); probe.appendChild(strip);
  strip.layoutMode = 'HORIZONTAL'; strip.itemSpacing = 8;
  strip.primaryAxisSizingMode = 'AUTO'; strip.counterAxisSizingMode = 'AUTO';
  strip.setExplicitVariableModeForCollection(ctxCollection, id);
  for (const sz of SIZES) {
    const m = sets['Button'].children.find(c => c.name === 'Variant=primary, Size=' + sz + ', State=default');
    const b = m.createInstance(); strip.appendChild(b);
    b.setProperties({ 'Label#347:3401': LABEL, 'Leading Icon#347:3389': false, 'Trailing Icon#347:3395': false });
  }
}
const measured = probe.children.map(st => st.children.map(b => Math.round(b.width)));
const COLW = SIZES.map((_, i) => Math.max(...measured.map(r => r[i])));
probe.remove();

const sec = await figma.getNodeByIdAsync(MOBILE ? MOBILE_SECTION : DESKTOP_SECTION);
const content = sec.children.find(c => c.name === 'content');
for (const c of [...content.children]) {
  if (/DENSITY-03/.test(c.name)) { c.remove(); continue; }
  if (c.name === 'flow · tight' && (c.children || []).some(k => /different questions/.test(k.characters || ''))) c.remove();
}

const frame = (parent, name, mode, gapPx, gapVar) => {
  const f = figma.createFrame(); parent.appendChild(f);
  f.name = name; f.fills = []; f.layoutMode = mode;
  f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
  if (gapPx != null) { f.itemSpacing = gapPx; if (gapVar) f.setBoundVariable('itemSpacing', V[gapVar]); }
  return f;
};
const text = (parent, chars, o) => {
  const t = figma.createText(); parent.appendChild(t);
  t.fontName = o.font || { family: 'Asta Sans', style: o.weight === 'Medium' ? 'Medium' : 'Regular' };
  t.characters = chars; t.fontSize = o.size; t.lineHeight = { unit: 'PIXELS', value: o.lh };
  t.fills = [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#000000'), 'color', V[o.colour])];
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  if (o.align) t.textAlignHorizontal = o.align;
  if (o.fam) { t.setBoundVariable('fontSize', V[o.fam + '/font-size']); t.setBoundVariable('lineHeight', V[o.fam + '/line-height']); }
  return t;
};

const idx = content.children.findIndex(c => /DENSITY-01/.test(c.name));

// ── the copy block, in the owl's nesting: h4 -> tight -> paragraphs -> normal
const block = frame(content, 'flow · tight', 'VERTICAL', 12, 'flow/tight');
block.counterAxisAlignItems = 'MIN';
content.insertChild(idx + 1, block);
block.layoutSizingHorizontal = 'FILL';
const h = text(block, 'Density and size are different questions',
               { size: 28, lh: 36, font: h4font, colour: 'content/primary', fam: 'heading/h4' });
h.textAutoResize = 'HEIGHT'; h.layoutSizingHorizontal = 'FILL';
const paras = frame(block, 'flow · normal', 'VERTICAL', 20, 'flow/normal');
paras.counterAxisAlignItems = 'MIN'; paras.layoutSizingHorizontal = 'FILL';
for (const p of [
  'Density is set once, for a product or a region — how tight everything is. Size is set per component — how prominent that one thing should be. They are independent, and they compose. Below is every size at every density, out of one set of tokens.',
  'Read across a row and the controls grow within one density. Read down a column and the density changes at one size. Equal heights then run diagonally — a large control in a dense product is the same 40px as a small one in a spacious product.',
]) {
  const t = text(paras, p, { size: 16, lh: 24, colour: 'content/secondary', fam: 'body/md' });
  t.textAutoResize = 'HEIGHT'; t.layoutSizingHorizontal = 'FILL';
}

// ── the matrix ───────────────────────────────────────────────────────────
const gap = frame(content, 'DENSITY-03 · size and density', 'VERTICAL',
                  MOBILE ? 20 : 24, MOBILE ? 'space/space-20' : 'space/space-24');
content.insertChild(idx + 2, gap);
gap.counterAxisAlignItems = 'CENTER';
gap.layoutSizingHorizontal = 'FILL';
gap.paddingTop = gap.paddingBottom = MOBILE ? 16 : 24;

const LBL = { size: MOBILE ? 12 : 13, lh: MOBILE ? 16 : 18, weight: 'Medium', colour: 'content/muted' };
const sizedCell = (parent, name, w, h) => {
  const c = figma.createFrame(); parent.appendChild(c);
  c.name = name; c.fills = []; c.layoutMode = 'HORIZONTAL';
  c.resize(w, h);
  c.layoutSizingHorizontal = 'FIXED';
  c.layoutSizingVertical = 'HUG';                     // resize() pinned it FIXED
  // LEFT-aligned, not centred. Centring each button in its own column makes
  // the size growth spread symmetrically and the columns hard to trace; a
  // shared left edge per column makes growth read rightward and lets the eye
  // follow a single column down through the four densities.
  c.primaryAxisAlignItems = 'MIN'; c.counterAxisAlignItems = 'CENTER';
  return c;
};

const head = frame(gap, 'sizes', 'HORIZONTAL', COLGAP);
head.counterAxisAlignItems = 'CENTER';
if (!MOBILE) {
  const corner = figma.createFrame(); head.appendChild(corner);
  corner.name = 'corner'; corner.fills = []; corner.layoutMode = 'HORIZONTAL';
  corner.resize(LABELW, 18);
  corner.layoutSizingHorizontal = 'FIXED'; corner.layoutSizingVertical = 'FIXED';
}
SIZES.forEach((s, i) => text(sizedCell(head, 'col ' + s, COLW[i], 18), s, LBL));

const addStrip = (parent, modeId) => {
  const strip = frame(parent, 'cells', 'HORIZONTAL', COLGAP);
  // TOP edge shared, not centred — with the columns already sharing a left
  // edge, this makes growth read consistently down-and-right instead of
  // radiating from a centre, and both axes become traceable at a glance.
  strip.counterAxisAlignItems = 'MIN';
  // the pin belongs HERE, not on the row — a pinned row scales its own label
  strip.setExplicitVariableModeForCollection(ctxCollection, modeId);
  SIZES.forEach((s, i) => {
    const cell = sizedCell(strip, 'cell ' + s, COLW[i], 10);
    const m = sets['Button'].children.find(c => c.name === 'Variant=primary, Size=' + s + ', State=default');
    const b = m.createInstance(); cell.appendChild(b);
    b.setProperties({ 'Label#347:3401': LABEL,
                      'Leading Icon#347:3389': false, 'Trailing Icon#347:3395': false });
  });
  return strip;
};

for (const [mode, id] of MODES) {
  if (MOBILE) {
    const group = frame(gap, 'row — ' + mode, 'VERTICAL', 8, 'space/space-8');
    group.counterAxisAlignItems = 'MIN';
    text(group, mode, LBL);                            // label ABOVE at 342px
    addStrip(group, id);
  } else {
    const row = frame(gap, 'row — ' + mode, 'HORIZONTAL', COLGAP);
    row.counterAxisAlignItems = 'MIN';                 // label hangs from the top too
    const lbl = figma.createFrame(); row.appendChild(lbl);
    lbl.name = 'label'; lbl.fills = []; lbl.layoutMode = 'HORIZONTAL';
    lbl.resize(LABELW, 18);
    lbl.layoutSizingHorizontal = 'FIXED'; lbl.layoutSizingVertical = 'HUG';
    lbl.primaryAxisAlignItems = 'MAX';                 // right-aligned against the grid
    text(lbl, mode, LBL);
    addStrip(row, id);
  }
}
return { gap: Math.round(gap.width) + '×' + Math.round(gap.height),
         order: content.children.map(c => c.name.slice(0, 30)) };
