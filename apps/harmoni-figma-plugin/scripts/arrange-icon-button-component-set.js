/**
 * Arrange Icon Button component set into a size-rows × variant/state-columns grid.
 * Run via figma_execute by replacing the findOne lookup with getNodeByIdAsync.
 *
 * Set ID: 433:8386
 * Grid: md first, then xs sm lg xl (rows) × primary/secondary/danger/ghost/link × 5 states (cols)
 * EDGE_PAD = 24 (keeps focus-ring overflow inside set bounds)
 *
 * After running: sweep all State=focus variants and resize ring frames to
 * (comp.width+8, comp.height+8) / (comp.width+4, comp.height+4) with x=-4/-2, y=-4/-2.
 * STRETCH constraints maintain correct offsets across density modes.
 */

const SET_ID = '433:8386';
const EDGE_PAD = 24;
const GAP_COL = 24;
const GAP_ROW = 24;
const GROUP_GAP = 48;

const SIZES = ['md', 'xs', 'sm', 'lg', 'xl'];
const VARIANTS = ['primary', 'secondary', 'danger', 'ghost', 'link'];
const STATES = ['default', 'hover', 'active', 'focus', 'disabled'];

(async () => {
  await figma.loadAllPagesAsync();
  const set = await figma.getNodeByIdAsync(SET_ID);
  if (!set) { console.error('Set not found'); return; }

  const page = set.parent;

  function parse(name) {
    const m = s => name.match(new RegExp(`${s}=(\\w+)`))?.[1];
    return { variant: m('Variant'), size: m('Size'), state: m('State') };
  }

  const lookup = {};
  for (const comp of set.children) {
    const { variant, size, state } = parse(comp.name);
    if (variant && size && state) lookup[`${variant}|${size}|${state}`] = comp;
  }

  // Column x positions
  let colX = EDGE_PAD;
  const colXMap = {};
  for (let vi = 0; vi < VARIANTS.length; vi++) {
    const variant = VARIANTS[vi];
    if (vi > 0) colX += GROUP_GAP;
    for (const state of STATES) {
      const c = lookup[`${variant}|md|${state}`];
      colXMap[`${variant}|${state}`] = colX;
      colX += (c ? c.width : 40) + GAP_COL;
    }
  }
  const totalWidth = colX - GAP_COL + EDGE_PAD;

  // Row y positions
  let rowY = EDGE_PAD;
  const rowYMap = {};
  for (const size of SIZES) {
    let maxH = 0;
    for (const variant of VARIANTS) {
      for (const state of STATES) {
        const c = lookup[`${variant}|${size}|${state}`];
        if (c) maxH = Math.max(maxH, c.height);
      }
    }
    rowYMap[size] = { y: rowY, h: maxH };
    rowY += maxH + GAP_ROW;
  }
  const totalHeight = rowY - GAP_ROW + EDGE_PAD;

  // Position all components
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const state of STATES) {
        const comp = lookup[`${variant}|${size}|${state}`];
        if (!comp) continue;
        comp.x = colXMap[`${variant}|${state}`];
        comp.y = rowYMap[size].y;
      }
    }
  }

  set.resize(totalWidth, totalHeight);

  // Sweep-fix ring frames for all focus variants
  for (const comp of set.children) {
    if (!comp.name.includes('State=focus')) continue;
    const w = comp.width, h = comp.height;
    const gap = comp.children.find(c => c.name === 'focus-ring-gap');
    const ring = comp.children.find(c => c.name === 'focus-ring');
    if (gap) { gap.resize(w + 4, h + 4); gap.x = -2; gap.y = -2; gap.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' }; }
    if (ring) { ring.resize(w + 8, h + 8); ring.x = -4; ring.y = -4; ring.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' }; }
  }

  // Labels
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

  const existing = page.findOne(n => n.name === 'Icon Button Grid Labels');
  existing?.remove();

  const labelsGroup = figma.createFrame();
  labelsGroup.name = 'Icon Button Grid Labels';
  labelsGroup.fills = [];
  labelsGroup.clipsContent = false;
  page.appendChild(labelsGroup);

  function makeLabel(txt, x, y, size = 10, bold = false) {
    const t = figma.createText();
    t.fontName = { family: 'Inter', style: bold ? 'Medium' : 'Regular' };
    t.fontSize = size;
    t.characters = txt;
    t.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
    t.x = x; t.y = y;
    labelsGroup.appendChild(t);
    return t;
  }

  const setX = set.x, setY = set.y;
  for (const size of SIZES) {
    const { y, h } = rowYMap[size];
    makeLabel(size.toUpperCase(), setX - 32, setY + y + h / 2 - 5, 10, true);
  }
  for (const variant of VARIANTS) {
    const firstX = colXMap[`${variant}|default`];
    const lastC = lookup[`${variant}|md|disabled`];
    const lastX = colXMap[`${variant}|disabled`] + (lastC ? lastC.width : 40);
    makeLabel(variant, setX + firstX + (lastX - firstX) / 2 - 20, setY - 28, 10, true);
    for (const state of STATES) {
      const cx = colXMap[`${variant}|${state}`];
      const c = lookup[`${variant}|md|${state}`];
      const cw = c ? c.width : 40;
      makeLabel(state.slice(0, 3), setX + cx + cw / 2 - 6, setY - 14, 8, false);
    }
  }

  labelsGroup.x = 0; labelsGroup.y = 0;
  labelsGroup.resize(totalWidth + 100, totalHeight + 60);

  // Default instance = md/primary/default (top-left)
  const defaultComp = lookup['primary|md|default'];
  if (defaultComp) set.insertChild(0, defaultComp);

  console.log(`Arranged ${set.children.length} variants into ${totalWidth}×${totalHeight} grid`);
})();
