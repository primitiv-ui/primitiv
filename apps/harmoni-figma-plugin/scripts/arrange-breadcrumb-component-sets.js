// Arrange Breadcrumb component sets
// Run via Figma developer console or figma_execute MCP tool.
//
// Sets:
//   Breadcrumb/Item      436:12220  Size (xs|sm|md|lg|xl) — single col
//   Breadcrumb/Separator 436:12221  Size × Type (icon|text) — 2-col grid
//   Breadcrumb           436:12911  Size × Separator (icon|text) — 2-col grid

const GAP_TYPE = 48;   // between Type/Separator columns
const GAP_SIZE = 20;   // between Size rows
const EDGE_PAD = 24;   // inner padding — keeps focus-ring overflow from clipping
const LABEL_LEFT = 56; // size label offset left of set
const LABEL_TOP  = 28; // col label offset above set

const SIZES     = ['md', 'xs', 'sm', 'lg', 'xl'];
const SEP_TYPES = ['icon', 'text'];

function makeLabel(text, bold) {
  const t = figma.createText();
  t.characters = text;
  t.fontName = { family: 'Inter', style: bold ? 'Bold' : 'Regular' };
  t.fontSize = 11;
  t.fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }];
  return t;
}

// ── Arrange Breadcrumb/Item (single column, Size only) ────────────────────
async function arrangeItem() {
  const existingLabels = figma.currentPage.findOne(n => n.name === 'Breadcrumb/Item Grid Labels');
  if (existingLabels) existingLabels.remove();

  const set = await figma.getNodeByIdAsync('436:12220');
  set.x = 100;
  set.y = 100;

  let maxW = 0;
  const rowMaxH = {};
  for (const s of SIZES) rowMaxH[s] = 0;
  for (const v of set.children) {
    const sz = v.name.match(/Size=(\w+)/)?.[1];
    if (!sz) continue;
    maxW = Math.max(maxW, v.width);
    rowMaxH[sz] = Math.max(rowMaxH[sz], v.height);
  }

  const rowY = {};
  let y = 0;
  for (const s of SIZES) { rowY[s] = y; y += rowMaxH[s] + GAP_SIZE; }
  const totalH = y - GAP_SIZE;
  for (const s of SIZES) rowY[s] += EDGE_PAD;

  for (const v of set.children) {
    const sz = v.name.match(/Size=(\w+)/)?.[1];
    if (!sz) continue;
    v.x = EDGE_PAD;
    v.y = rowY[sz];
  }
  set.resize(maxW + EDGE_PAD * 2, totalH + EDGE_PAD * 2);

  const labelNodes = [];
  for (const s of SIZES) {
    const lbl = makeLabel(s, false);
    lbl.x = set.x - LABEL_LEFT;
    lbl.y = set.y + rowY[s] + rowMaxH[s] / 2 - lbl.height / 2;
    labelNodes.push(lbl);
  }
  const grp = figma.group(labelNodes, figma.currentPage);
  grp.name = 'Breadcrumb/Item Grid Labels';

  return { w: set.width, h: set.height };
}

// ── Arrange a 2-col Size × Type/Separator set ─────────────────────────────
async function arrangeTwoColSet(setId, colAxis, colValues, setX, setY, labelGroupName) {
  const existingLabels = figma.currentPage.findOne(n => n.name === labelGroupName);
  if (existingLabels) existingLabels.remove();

  const set = await figma.getNodeByIdAsync(setId);
  set.x = setX;
  set.y = setY;

  const colMaxW = {};
  const rowMaxH = {};
  for (const c of colValues) colMaxW[c] = 0;
  for (const s of SIZES) rowMaxH[s] = 0;

  for (const v of set.children) {
    const sz  = v.name.match(/Size=(\w+)/)?.[1];
    const col = v.name.match(new RegExp(`${colAxis}=(\\w+)`))?.[1];
    if (!sz || !col) continue;
    colMaxW[col] = Math.max(colMaxW[col], v.width);
    rowMaxH[sz]  = Math.max(rowMaxH[sz],  v.height);
  }

  const colX = {};
  let cx = 0;
  for (const c of colValues) { colX[c] = cx; cx += colMaxW[c] + GAP_TYPE; }
  const totalW = cx - GAP_TYPE;

  const rowY = {};
  let ry = 0;
  for (const s of SIZES) { rowY[s] = ry; ry += rowMaxH[s] + GAP_SIZE; }
  const totalH = ry - GAP_SIZE;

  for (const c of colValues) colX[c] += EDGE_PAD;
  for (const s of SIZES) rowY[s] += EDGE_PAD;

  for (const v of set.children) {
    const sz  = v.name.match(/Size=(\w+)/)?.[1];
    const col = v.name.match(new RegExp(`${colAxis}=(\\w+)`))?.[1];
    if (!sz || !col) continue;
    v.x = colX[col];
    v.y = rowY[sz];
  }
  set.resize(totalW + EDGE_PAD * 2, totalH + EDGE_PAD * 2);

  const labelNodes = [];
  for (const c of colValues) {
    const lbl = makeLabel(c, true);
    lbl.x = setX + colX[c] + colMaxW[c] / 2 - lbl.width / 2;
    lbl.y = setY - LABEL_TOP;
    labelNodes.push(lbl);
  }
  for (const s of SIZES) {
    const lbl = makeLabel(s, false);
    lbl.x = setX - LABEL_LEFT;
    lbl.y = setY + rowY[s] + rowMaxH[s] / 2 - lbl.height / 2;
    labelNodes.push(lbl);
  }
  const grp = figma.group(labelNodes, figma.currentPage);
  grp.name = labelGroupName;

  return { w: set.width, h: set.height };
}

(async () => {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

  // Breadcrumb/Item — single column at (100, 100)
  const item = await arrangeItem();

  // Breadcrumb/Separator — 2-col at (100 + itemW + 80, 100)
  const SEP_X = 100 + item.w + 80;
  await arrangeTwoColSet('436:12221', 'Type', ['icon', 'text'], SEP_X, 100, 'Breadcrumb/Separator Grid Labels');

  // Breadcrumb composition — 2-col below Item set
  const BC_Y = 100 + item.h + 80;
  await arrangeTwoColSet('436:12911', 'Separator', ['icon', 'text'], 100, BC_Y, 'Breadcrumb Grid Labels');

  figma.viewport.scrollAndZoomIntoView([
    await figma.getNodeByIdAsync('436:12220'),
    await figma.getNodeByIdAsync('436:12221'),
    await figma.getNodeByIdAsync('436:12911'),
  ]);
})();
