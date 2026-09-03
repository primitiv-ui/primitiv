/**
 * HERO-01 — the docs-site home page hero illustration.
 *
 * Run through the Desktop Bridge (`figma_execute`). Idempotent: it clears the
 * HERO-01 frame on `Home — desktop (v3)` and rebuilds from scratch. The mobile
 * frame takes a clone of the finished wall, narrowed to two columns.
 *
 * ── DIRECTION, after three passes ─────────────────────────────────────────
 * 1. The brief in `docs/docs-site-home-copy.md` asked for two tilted "specimen
 *    boards" in opposite themes. Built in full and rejected on sight: 2.5° over
 *    a 1040px board drops the far edge 45px, which turns every table rule into
 *    a slope and reads as MISALIGNED rather than placed; and an 8% offset on a
 *    same-size rear board shows only a thin L of half-cut buttons, which reads
 *    as a rendering fault rather than as a second theme.
 * 2. Replaced by a straight-on wall of components, bled past every edge, with a
 *    radial vignette over the top. Right structure, but a parts bin: a stack of
 *    unrelated controls proves the parts exist, not that they compose.
 * 3. FINAL: the wall is built from SIX COMPOSED VIGNETTES — a sign-up form, a
 *    settings panel, a member card, a release table, an install panel, a file
 *    tree — each a real screen fragment on its own panel. Columns are staggered
 *    and cross-seeded with clones of each OTHER column's vignette, so no two
 *    neighbours run the same sequence. This is the version that reads as a
 *    product built from Primitiv rather than as a component library.
 *
 * ── TWO THINGS THAT WILL BITE ─────────────────────────────────────────────
 * • THE VIGNETTE USES A RAW HEX. A gradient stop can bind a colour variable but
 *   adopts that variable's own alpha (CLAUDE.md gotcha 3 / the Card scrim), and
 *   this fade needs alpha 0 -> 1 of one colour. The stops carry `#141414`
 *   literally — `surface/default` in dark, the only mode these frames pin.
 * • THE OVERFLOW AUDIT WILL FLAG THIS FRAME, CORRECTLY AND HARMLESSLY. The wall
 *   is deliberately larger than the frame that clips it — that is what "bleed"
 *   means — so the usual "no child extends past its parent's padding box" check
 *   reports it. Do not "fix" it by shrinking the wall.
 * • THE STOPS ARE FRAME-WIDTH SPECIFIC. The desktop radius swallows the whole
 *   wall at 390px, so the mobile veil carries its own, wider, stops. Retune
 *   both if either frame's width changes.
 */
const DESKTOP_GAP = '2180:91877';
const MOBILE_GAP  = '2183:92210';
const INTENT = 'VariableCollectionId:346:4407', INTENT_DARK = '372:1';
const W = 300, INNER = 260, GROUND = { r: 0x14 / 255, g: 0x14 / 255, b: 0x14 / 255 };

const sets = {};
for (const p of figma.root.children) {
  let kids; try { kids = p.children; } catch (e) { continue; }
  for (const c of kids) if (c.type === 'COMPONENT_SET') sets[c.name] = c;
}
const vars = await figma.variables.getLocalVariablesAsync();
const V = {}; for (const v of vars) V[v.name] = v;

const gap = await figma.getNodeByIdAsync(DESKTOP_GAP);
for (const c of [...gap.children]) c.remove();
gap.name = 'HERO-01 · component wall';
gap.layoutMode = 'NONE'; gap.clipsContent = true;
gap.fills = []; gap.strokes = []; gap.dashPattern = [];
gap.layoutSizingHorizontal = 'FILL';
gap.resize(gap.width, 750);

const wall = figma.createFrame();
gap.appendChild(wall);                                  // append FIRST (gotcha 13)
wall.name = 'HERO-01 · component wall';
wall.layoutMode = 'HORIZONTAL';
wall.primaryAxisSizingMode = 'AUTO'; wall.counterAxisSizingMode = 'AUTO';
wall.counterAxisAlignItems = 'MIN'; wall.itemSpacing = 24; wall.fills = [];
wall.setExplicitVariableModeForCollection(await figma.variables.getVariableCollectionByIdAsync(INTENT), INTENT_DARK);

const panel = (name) => {
  const f = figma.createFrame(); wall.appendChild(f); f.name = name;
  f.layoutMode = 'VERTICAL'; f.counterAxisSizingMode = 'FIXED'; f.resize(W, 100);
  f.primaryAxisSizingMode = 'AUTO';                     // re-assert after resize (gotcha 7)
  f.counterAxisAlignItems = 'MIN'; f.itemSpacing = 16;
  f.paddingTop = f.paddingBottom = f.paddingLeft = f.paddingRight = 20;
  f.fills = [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#ffffff'), 'color', V['surface/raised'])];
  f.strokes = [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#000000'), 'color', V['border/subtle'])];
  f.strokeAlign = 'INSIDE'; f.strokeWeight = 1; f.setBoundVariable('strokeWeight', V['border-width/1']);
  for (const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']) f.setBoundVariable(c, V['card/md/radius']);
  f.clipsContent = true;
  return f;
};
const put = (parent, setName, variant, props, fill) => {
  const set = sets[setName]; if (!set) return null;
  const master = variant ? set.children.find(c => c.name === variant) : (set.defaultVariant || set.children[0]);
  if (!master) return null;
  const i = master.createInstance(); parent.appendChild(i);
  if (props) { try { i.setProperties(props); } catch (e) {} }
  if (fill) { try { i.layoutSizingHorizontal = 'FILL'; } catch (e) {} }
  else if (i.width > INNER) { try { i.resize(INNER, i.height); } catch (e) {} }
  return i;
};
const findSlot = (n, d) => {
  if (d < 0) return null;
  if (n.type === 'SLOT') return n;
  let k; try { k = n.children; } catch (e) { return null; }
  if (k) for (const c of k) { const r = findSlot(c, d - 1); if (r) return r; }
  return null;
};
const setInputValue = (field, value) => {
  let input = null;
  const find = (n, d) => { if (input || d < 0) return;
    if (n.type === 'INSTANCE' && /Input/.test(n.name)) { input = n; return; }
    let k; try { k = n.children; } catch (e) { return; } if (k) for (const c of k) find(c, d - 1); };
  find(field, 5);
  if (input) { try { input.setProperties({ 'Value#394:1335': value, 'Filled': 'filled' }); } catch (e) {} }
};
const row = (parent, name, gapPx, wrap) => {
  const f = figma.createFrame(); parent.appendChild(f); f.name = name;
  f.layoutMode = 'HORIZONTAL'; f.itemSpacing = gapPx; f.fills = [];
  f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
  if (wrap) { f.layoutWrap = 'WRAP'; f.counterAxisSpacing = 8; }
  return f;
};

// ── 1 · sign-up form ───────────────────────────────────────────────────────
const c1 = panel('vignette — sign-up form');
const email = put(c1, 'Field', 'State=default, Size=md', { 'Label#394:1386': 'Work email', 'Helper#394:1418': 'We only use this for sign-in.', 'Show helper#394:1434': true }, true);
const pass  = put(c1, 'Field', 'State=default, Size=md', { 'Label#394:1386': 'Password', 'Helper#394:1418': 'At least 12 characters.', 'Show helper#394:1434': true }, true);
if (email) setInputValue(email, 'ada@example.com');
if (pass)  setInputValue(pass, '•'.repeat(12));
put(c1, 'Checkbox', 'Size=md, State=checked, Interaction=default', { 'Label#881:61': 'Keep me signed in', 'Show label#881:122': true });
put(c1, 'Button', 'Variant=primary, Size=md, State=default', { 'Label#347:3401': 'Create account' }, true);

// ── 2 · notification settings ──────────────────────────────────────────────
const c2 = panel('vignette — notification settings');
put(c2, 'Switch', 'Size=md, State=checked, Interaction=default',   { 'Label#881:265': 'Email digest',    'Show label#881:306': true });
put(c2, 'Switch', 'Size=md, State=unchecked, Interaction=default', { 'Label#881:265': 'Product updates', 'Show label#881:306': true });
put(c2, 'Switch', 'Size=md, State=checked, Interaction=default',   { 'Label#881:265': 'Security alerts', 'Show label#881:306': true });
put(c2, 'Divider', 'Orientation=horizontal', null, true);
const seg = put(c2, 'Segmented Control', 'Size=sm, Count=3', null, true);
// The set exposes only Size and Count — the labels live on the nested
// `Segmented Control / Item` instances, which default to "Segment". Set them
// per item, and FILL each one or they hug their text and leave the control
// short of its own width.
if (seg) {
  const SEGMENTS = ['Daily', 'Weekly', 'Never'];
  seg.children.forEach((item, i) => {
    try { item.setProperties({ 'Label#1216:207': SEGMENTS[i % SEGMENTS.length] }); } catch (e) {}
    try { item.layoutSizingHorizontal = 'FILL'; } catch (e) {}
  });
}
put(c2, 'Slider', 'Orientation=Horizontal, Variant=Single, Size=md, State=default', null, true);
put(c2, 'Button', 'Variant=secondary, Size=sm, State=default', { 'Label#347:3401': 'Save changes' }, true);

// ── 3 · member card ────────────────────────────────────────────────────────
const c3 = panel('vignette — member card');
put(c3, 'Avatar', 'Size=lg, Type=Image, Shape=Circle');
put(c3, 'Badge', 'Tone=info, Variant=label, Size=sm', { 'Label#1389:0': 'Owner' });
const tags = row(c3, 'tags', 8, true);
put(tags, 'Tag', 'Tone=neutral, Size=sm', { 'Label#1390:41': 'design-system' });
put(tags, 'Tag', 'Tone=neutral, Size=sm', { 'Label#1390:41': 'accessibility' });
put(c3, 'Avatar Group', 'Size=md, Count=4, Direction=ltr', { 'Show counter#1480:1283': true });
put(c3, 'Button', 'Variant=secondary, Size=sm, State=default', { 'Label#347:3401': 'View profile' }, true);
put(c3, 'Alert', 'Tone=info, Size=sm', { 'Title#1400:212': 'Invite pending', 'Description#1400:233': 'Sent 2 days ago to ada@example.com.', 'Show title#1400:254': true }, true);

// ── 4 · release table, Status column carrying real Badges ──────────────────
const c4 = panel('vignette — release table');
const table = figma.createFrame(); c4.appendChild(table);
table.name = 'table'; table.layoutMode = 'VERTICAL'; table.itemSpacing = 0; table.fills = [];
table.counterAxisSizingMode = 'FIXED'; table.primaryAxisSizingMode = 'AUTO'; table.layoutSizingHorizontal = 'FILL';
const cellC = sets['Table / Cell'].children.find(c => c.name === 'Size=xs, Align=start');
const mkRow = (variantName, cells) => {
  const r = sets['Table / Row'].children.find(c => c.name === variantName).createInstance();
  table.appendChild(r); r.layoutSizingHorizontal = 'FILL';
  const slot = findSlot(r, 5); if (!slot) return;
  for (const c of [...slot.children]) { try { c.remove(); } catch (e) {} }
  for (const spec of cells) {
    const cell = cellC.createInstance(); slot.appendChild(cell);
    if (spec.badge) {
      cell.setProperties({ 'Show text#1883:19': false, 'Show content#1883:3': true, 'Right Border#604:175': false });
      cell.resize(spec.w, cell.height);
      const inner = findSlot(cell, 5);
      if (inner) {
        for (const c of [...inner.children]) { try { c.remove(); } catch (e) {} }
        const b = sets['Badge'].children.find(x => x.name === `Tone=${spec.tone}, Variant=label, Size=xs`).createInstance();
        inner.appendChild(b); b.setProperties({ 'Label#1389:0': spec.badge });
        try { inner.layoutMode = 'HORIZONTAL'; inner.primaryAxisSizingMode = 'AUTO'; inner.counterAxisSizingMode = 'AUTO'; inner.counterAxisAlignItems = 'CENTER'; } catch (e) {}
      }
    } else {
      cell.setProperties({ 'Text#604:164': spec.text, 'Show text#1883:19': true, 'Show content#1883:3': false, 'Right Border#604:175': false });
      cell.resize(spec.w, cell.height);
    }
  }
  try { slot.layoutMode = 'HORIZONTAL'; slot.primaryAxisSizingMode = 'AUTO'; slot.counterAxisSizingMode = 'AUTO'; slot.itemSpacing = 0; } catch (e) {}
};
mkRow('Section=head, State=default, Cells=custom', [{ text: 'Component', w: 150 }, { text: 'Status', w: 110 }]);
for (const [n, tone, label] of [['Button','success','Stable'],['Select','success','Stable'],['Combobox','info','Beta'],['Tree','success','Stable']])
  mkRow('Section=body, State=default, Cells=custom', [{ text: n, w: 150 }, { badge: label, tone, w: 110 }]);
put(c4, 'Pagination', 'Variant=compact, Size=xs');

// ── 5 · install and docs ───────────────────────────────────────────────────
const c5 = panel('vignette — install');
put(c5, 'Breadcrumb', 'Size=xs,Separator=icon,Overflow=false');
const tabs = row(c5, 'tabs', 4);
put(tabs, 'Tabs / Trigger', 'Size=sm, State=active, Interaction=default',   { 'Label#425:0': 'Docs' });
put(tabs, 'Tabs / Trigger', 'Size=sm, State=inactive, Interaction=default', { 'Label#425:0': 'API' });
put(tabs, 'Tabs / Trigger', 'Size=sm, State=inactive, Interaction=default', { 'Label#425:0': 'Examples' });
put(c5, 'Code Block', 'Size=xs, Type=tabbed', { 'Show Line Numbers#601:158': false }, true);
put(c5, 'Inline Code', 'Size=sm', { 'Code#612:474': 'primitiv add button' });
put(c5, 'Kbd', 'Size=sm', { 'Key#612:468': '⌘K' });

// ── 6 · file tree ──────────────────────────────────────────────────────────
const c6 = panel('vignette — file tree');
const nav = row(c6, 'nav', 8);
put(nav, 'Navigation Menu / Bar Link', 'Size=sm, State=active, Interaction=default',   { 'Label#1333:937': 'Components' });
put(nav, 'Navigation Menu / Bar Link', 'Size=sm, State=inactive, Interaction=default', { 'Label#1333:937': 'Tokens' });
const tree = figma.createFrame(); c6.appendChild(tree);
tree.name = 'tree'; tree.layoutMode = 'VERTICAL'; tree.itemSpacing = 2; tree.fills = [];
tree.counterAxisSizingMode = 'FIXED'; tree.primaryAxisSizingMode = 'AUTO'; tree.layoutSizingHorizontal = 'FILL';
for (const [label, state] of [['components','default'],['button.tsx','selected'],['select.tsx','default'],['combobox.tsx','default'],['tokens.css','default']])
  put(tree, 'Tree / Item', `Size=sm, State=${state}`, { 'Label#1590:0': label, 'Show icon#1590:6': true }, true);
put(c6, 'Listbox / Option', 'State=default, Selected=true, Size=sm', { 'Label#1569:533': 'Show hidden files' }, true);

// ── stack into staggered, cross-seeded columns ─────────────────────────────
const leads = [...wall.children];
const cols = [];
for (let i = 0; i < leads.length; i++) {
  const col = figma.createFrame(); wall.appendChild(col);
  col.name = 'column ' + (i + 1);
  col.layoutMode = 'VERTICAL'; col.counterAxisSizingMode = 'FIXED'; col.resize(W, 100);
  col.primaryAxisSizingMode = 'AUTO';                   // re-assert after resize (gotcha 7)
  col.counterAxisAlignItems = 'MIN'; col.itemSpacing = 24; col.fills = []; col.clipsContent = false;
  cols.push(col);
}
for (let i = 0; i < leads.length; i++) cols[i].appendChild(leads[i]);
// a different order per column, so no two neighbours run the same sequence
const ORDER = [[3,1,5,2],[5,3,0,4],[1,4,2,0],[0,5,3,1],[2,0,4,5],[4,2,1,3]];
// Masonry aligns every column's TOP and lets differing panel heights do the
// work. An earlier pass staggered the starts instead; on the page that read as
// six lists nudged out of true rather than as one wall.
for (let i = 0; i < cols.length; i++) {
  let n = 0;
  while (cols[i].height < 1120 && n < ORDER[i].length * 3) { cols[i].appendChild(leads[ORDER[i][n % ORDER[i].length]].clone()); n++; }
}
wall.counterAxisAlignItems = 'MIN';
wall.x = Math.round((gap.width - wall.width) / 2);
wall.y = -150;

// ── the treatment ──────────────────────────────────────────────────────────
const stop = (position, a) => ({ position, color: { ...GROUND, a } });
const veil = (parent, name, fill) => {
  const r = figma.createRectangle(); parent.appendChild(r);
  r.name = name; r.x = 0; r.y = 0; r.resize(parent.width, parent.height);
  r.strokes = [];                                       // create* ships a default stroke (gotcha 28)
  r.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
  r.fills = [fill];
};
veil(gap, 'veil — vignette', { type: 'GRADIENT_RADIAL',
  gradientTransform: [[1.35, 0, -0.175], [0, 1.05, -0.025]],
  gradientStops: [stop(0, 0), stop(0.62, 0), stop(0.88, 0.62), stop(1, 0.96)] });
veil(gap, 'veil — foot', { type: 'GRADIENT_LINEAR', gradientTransform: [[0, 1, 0], [-1, 0, 1]],
  gradientStops: [stop(0, 0), stop(0.62, 0), stop(1, 1)] });

// ── mobile: the same wall, two columns, its own wider stops ────────────────
const mgap = await figma.getNodeByIdAsync(MOBILE_GAP);
for (const c of [...mgap.children]) c.remove();
mgap.name = 'HERO-01 · component wall';
mgap.layoutMode = 'NONE'; mgap.clipsContent = true;
mgap.fills = []; mgap.strokes = []; mgap.dashPattern = [];
mgap.layoutSizingHorizontal = 'FILL';
mgap.resize(mgap.width, 520);
const mw = wall.clone();
mgap.appendChild(mw);
mw.name = 'HERO-01 · component wall';
// THREE columns on a phone, full-bleed: the middle one reads in full at 300px
// with 45px to spare either side, and its neighbours bleed off both frame
// edges as slivers, so the wall still says "there is more of this". Two
// columns showed neither completely; one column revealed a panel but read as
// an isolated card rather than as part of a system.
for (const c of mw.children.slice(3)) c.remove();
mw.x = Math.round((mgap.width - mw.width) / 2);
mw.y = 8;                                               // the lead panel starts inside the frame
// No radial vignette here — it crushed the top of the very panel this is meant
// to reveal. Shallow side fades instead, because the flanking columns are
// meant to be seen, not hidden.
const HX = [[1, 0, 0], [0, 1, 0]];
veil(mgap, 'veil — left',  { type: 'GRADIENT_LINEAR', gradientTransform: HX,
  gradientStops: [stop(0, 0.85), stop(0.14, 0)] });
veil(mgap, 'veil — right', { type: 'GRADIENT_LINEAR', gradientTransform: HX,
  gradientStops: [stop(0.86, 0), stop(1, 0.85)] });
veil(mgap, 'veil — foot', { type: 'GRADIENT_LINEAR', gradientTransform: [[0, 1, 0], [-1, 0, 1]],
  gradientStops: [stop(0, 0), stop(0.55, 0), stop(1, 1)] });

return {
  desktop: { wall: { w: Math.round(wall.width), h: Math.round(wall.height) }, columns: cols.length },
  mobile: { wall: { w: Math.round(mw.width), h: Math.round(mw.height) }, columns: mw.children.length },
};
