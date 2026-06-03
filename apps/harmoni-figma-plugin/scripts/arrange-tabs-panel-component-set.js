// Arrange Tabs/Panel component set
// Grid: 1 row × 5 cols (Size: md first, then xs sm lg xl)
// Run via figma_execute using the live set ID below.

const PANEL_SET_ID = '425:5539';
const EDGE = 24;
const CGAP = 32; // gap between size columns

const SIZES = ['md', 'xs', 'sm', 'lg', 'xl'];

await figma.loadAllPagesAsync();
const page = figma.root.children.find(p => p.name === 'Tabs');
await figma.setCurrentPageAsync(page);
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

const set = await figma.getNodeByIdAsync(PANEL_SET_ID);

const variants = {};
for (const c of set.children) {
  const sz = c.name.match(/Size=(\w+)/)?.[1];
  if (sz) variants[sz] = c;
}

// Position variants in a single row
let curX = EDGE, maxH = 0;
for (const sz of SIZES) {
  const comp = variants[sz];
  if (!comp) continue;
  comp.x = curX; comp.y = EDGE;
  curX += comp.width + CGAP;
  maxH = Math.max(maxH, comp.height);
}
curX -= CGAP;
set.resize(curX + EDGE, maxH + EDGE * 2);

// Remove old labels
const old = page.findOne(n => n.name === 'Tabs/Panel Grid Labels');
if (old) old.remove();

// Column labels above each panel
const lblNodes = [];
curX = EDGE;
for (const sz of SIZES) {
  const comp = variants[sz];
  if (!comp) continue;
  const lbl = figma.createText();
  lbl.characters = sz;
  lbl.fontSize = 9;
  lbl.fontName = { family: 'Inter', style: 'Regular' };
  lbl.fills = [{ type: 'SOLID', color: { r: .4, g: .4, b: .4 } }];
  lbl.textAlignHorizontal = 'CENTER';
  lbl.x = set.x + curX + comp.width / 2 - lbl.width / 2;
  lbl.y = set.y - 20;
  page.appendChild(lbl); lblNodes.push(lbl);
  curX += comp.width + CGAP;
}

if (lblNodes.length) {
  const grp = figma.group(lblNodes, page);
  grp.name = 'Tabs/Panel Grid Labels';
}

// Default instance: md at index 0
const def = variants['md'];
if (def) set.insertChild(0, def);

return { done: true };
