// Arrange Avatar component set (433:7944)
// Grid: Shape sections side by side (Circle left / Square right) × Size rows × Type columns
// Run via Figma developer console or figma_execute.

const SET_ID = '433:7944';
const SIZE_ORDER  = ['md', 'xs', 'sm', 'lg', 'xl'];
const TYPE_ORDER  = ['Image', 'Initials', 'Placeholder'];
const SHAPE_ORDER = ['Circle', 'Square'];
const COMPACT_H   = { xs: 20, sm: 28, md: 32, lg: 40, xl: 48 };

const GAP_TYPE    = 48;  // between Type columns within a section
const GAP_SIZE    = 20;  // between size rows
const SECTION_GAP = 72;  // horizontal gap between Circle and Square blocks
const EDGE_PAD    = 24;  // no focus ring on Avatar, but keeps breathing room
const MAX_H       = COMPACT_H.xl; // 48

// Column X map by Shape section then Type
const colX = {};
let cx = EDGE_PAD;
for (let shi = 0; shi < SHAPE_ORDER.length; shi++) {
  const shape = SHAPE_ORDER[shi];
  colX[shape] = {};
  for (let ti = 0; ti < TYPE_ORDER.length; ti++) {
    colX[shape][TYPE_ORDER[ti]] = cx;
    cx += MAX_H;
    if (ti < TYPE_ORDER.length - 1) cx += GAP_TYPE;
  }
  if (shi < SHAPE_ORDER.length - 1) cx += SECTION_GAP;
}
const innerW = cx - EDGE_PAD;

// Row Y map by Size only (shared across both shape sections)
const rowY = {};
let ry = EDGE_PAD;
for (let si = 0; si < SIZE_ORDER.length; si++) {
  rowY[SIZE_ORDER[si]] = ry;
  ry += MAX_H;
  if (si < SIZE_ORDER.length - 1) ry += GAP_SIZE;
}
const innerH = ry - EDGE_PAD;

// Navigate to Avatar page
const page = figma.root.children.find(p => p.name === 'Avatar');
await figma.setCurrentPageAsync(page);
const set = await figma.getNodeByIdAsync(SET_ID);

// Position all variants
for (const child of set.children) {
  const sz   = child.name.match(/Size=(\w+)/)?.[1];
  const type = child.name.match(/Type=(\w+)/)?.[1];
  const shp  = child.name.match(/Shape=(\w+)/)?.[1];
  const h    = COMPACT_H[sz];
  child.x = colX[shp][type] + (MAX_H - h) / 2;
  child.y = rowY[sz]        + (MAX_H - h) / 2;
}

set.resize(innerW + EDGE_PAD * 2, innerH + EDGE_PAD * 2);

// === LABELS ===
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

const existing = page.findOne(n => n.name === 'Avatar Grid Labels');
if (existing) existing.remove();

const abs = set.absoluteBoundingBox;
const SAX = abs.x, SAY = abs.y;

function makeLbl(text, x, y, bold = false, fs = 11) {
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: bold ? 'Bold' : 'Regular' };
  t.fontSize = fs;
  t.characters = text;
  t.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
  t.x = x; t.y = y;
  return t;
}

const nodes = [];

// Shape section headers — bold, centred over each section's full column span, 54px above set
for (const shape of SHAPE_ORDER) {
  const x0 = colX[shape][TYPE_ORDER[0]];
  const x1 = colX[shape][TYPE_ORDER[TYPE_ORDER.length - 1]] + MAX_H;
  const lbl = makeLbl(shape, 0, 0, true, 12);
  lbl.x = SAX + x0 + (x1 - x0) / 2 - lbl.width / 2;
  lbl.y = SAY - 54;
  nodes.push(lbl);
}

// Type column headers — regular, centred over each column, 30px above set
for (const shape of SHAPE_ORDER) {
  for (const type of TYPE_ORDER) {
    const lbl = makeLbl(type, 0, 0, false, 10);
    lbl.x = SAX + colX[shape][type] + MAX_H / 2 - lbl.width / 2;
    lbl.y = SAY - 30;
    nodes.push(lbl);
  }
}

// Size row labels — left of set, vertically centred in MAX_H cell
for (const size of SIZE_ORDER) {
  const lbl = makeLbl(size, 0, 0, false, 11);
  lbl.x = SAX - 36;
  lbl.y = SAY + rowY[size] + MAX_H / 2 - lbl.height / 2;
  nodes.push(lbl);
}

const group = figma.group(nodes, page);
group.name = 'Avatar Grid Labels';

figma.viewport.scrollAndZoomIntoView([set, group]);
