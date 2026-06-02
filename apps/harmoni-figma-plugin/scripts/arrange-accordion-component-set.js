// Arrange Accordion/Item component set
// Grid: 20 rows (Size md-first × 4 Positions) × 8 cols (State closed|open × 4 Interactions)
// Run via figma_execute using the live set ID below.
// EDGE_PAD=24 keeps focus-ring overflow (−4px) clear of the set frame boundary.

const ITEM_SET_ID = '416:6729';
const EDGE    = 24;
const CGAP    = 16;  // gap between columns within a state group
const GRPGAP  = 32;  // extra gap between closed and open column groups
const RGAP    = 16;  // gap between rows — 16px ensures focus-ring overflow (4px/side) never overlaps
const SZ_EXTRA = 24; // extra gap between size groups

const SIZES     = ['md', 'xs', 'sm', 'lg', 'xl'];
const POSITIONS = ['standalone', 'first', 'middle', 'last'];
const STATES    = ['closed', 'open'];
const INTR      = ['default', 'hover', 'focus', 'disabled'];

await figma.loadAllPagesAsync();
const page = figma.root.children.find(p => p.name === 'Accordion');
await figma.setCurrentPageAsync(page);
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

const set = await figma.getNodeByIdAsync(ITEM_SET_ID);

// Build lookup: sz/pos/st/intr → component
const variants = {};
for (const c of set.children) {
  const sz  = c.name.match(/Size=(\w+)/)?.[1];
  const pos = c.name.match(/Position=(\w+)/)?.[1];
  const st  = c.name.match(/State=(\w+)/)?.[1];
  const in_ = c.name.match(/Interaction=(\w+)/)?.[1];
  if (sz && pos && st && in_) variants[`${sz}/${pos}/${st}/${in_}`] = c;
}

// Heights per size
const rowH = {};
for (const sz of SIZES) {
  const s = variants[`${sz}/standalone/closed/default`];
  rowH[sz] = s ? s.height : 32;
}

// Column definitions
const cols = [];
for (const st of STATES) for (const in_ of INTR) cols.push({ st, in_ });

// Position variants in the grid
let maxX = 0, curY = EDGE;
for (let si = 0; si < SIZES.length; si++) {
  const sz = SIZES[si];
  if (si > 0) curY += SZ_EXTRA;
  for (const pos of POSITIONS) {
    let curX = EDGE;
    for (let c = 0; c < cols.length; c++) {
      const { st, in_ } = cols[c];
      const comp = variants[`${sz}/${pos}/${st}/${in_}`];
      if (!comp) continue;
      comp.x = curX; comp.y = curY;
      curX += comp.width + CGAP;
      if (c === 3) curX += GRPGAP;
      maxX = Math.max(maxX, comp.x + comp.width);
    }
    curY += rowH[sz] + RGAP;
  }
}
curY -= RGAP;
set.resize(maxX + EDGE, curY + EDGE);

// Remove old labels group
const old = page.findOne(n => n.name === 'Accordion/Item Grid Labels');
if (old) old.remove();

// Row labels (sz · position)
const lblNodes = [];
curY = EDGE;
for (let si = 0; si < SIZES.length; si++) {
  const sz = SIZES[si];
  if (si > 0) curY += SZ_EXTRA;
  for (const pos of POSITIONS) {
    const h = rowH[sz];
    const lbl = figma.createText();
    lbl.characters = `${sz} · ${pos}`;
    lbl.fontSize = 9;
    lbl.fontName = { family: 'Inter', style: 'Regular' };
    lbl.fills = [{ type: 'SOLID', color: { r: .4, g: .4, b: .4 } }];
    lbl.x = set.x - 90; lbl.y = set.y + curY + h / 2 - 6;
    page.appendChild(lbl); lblNodes.push(lbl);
    curY += h + RGAP;
  }
}

// Column labels
let curX = EDGE;
for (let c = 0; c < cols.length; c++) {
  const { st, in_ } = cols[c];
  const sample = variants[`${SIZES[0]}/${POSITIONS[0]}/${st}/${in_}`];
  if (!sample) continue;
  const lbl = figma.createText();
  lbl.characters = `${st}\n${in_}`;
  lbl.fontSize = 9;
  lbl.fontName = { family: 'Inter', style: 'Regular' };
  lbl.fills = [{ type: 'SOLID', color: { r: .4, g: .4, b: .4 } }];
  lbl.textAlignHorizontal = 'CENTER';
  lbl.x = set.x + curX + sample.width / 2 - 20; lbl.y = set.y - 32;
  page.appendChild(lbl); lblNodes.push(lbl);
  curX += sample.width + CGAP;
  if (c === 3) curX += GRPGAP;
}

if (lblNodes.length) {
  const grp = figma.group(lblNodes, page);
  grp.name = 'Accordion/Item Grid Labels';
}

// Default instance: md/standalone/closed/default at index 0
const def = variants['md/standalone/closed/default'];
if (def) set.insertChild(0, def);

return { done: true };
