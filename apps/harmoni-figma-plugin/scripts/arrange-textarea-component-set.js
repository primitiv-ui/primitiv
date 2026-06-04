/**
 * Arrange Textarea component set into a Filled × State × Size grid.
 *
 * Grid: 2 filled major groups (empty | filled) × 5 state sub-columns × 5 size rows = 50 variants.
 * Run once after building the set, or re-run after adding variants.
 *
 * Usage — figma_execute (replace the ID lookup if the set is moved):
 *   const componentSet = await figma.getNodeByIdAsync('439:14511');
 */

const SET_ID  = '439:14511';   // Textarea component set
const SIZES   = ['md', 'xs', 'sm', 'lg', 'xl'];   // md first → default instance
const STATES  = ['default', 'hover', 'focus', 'disabled', 'invalid'];
const FILLED  = ['empty', 'filled'];

const GAP_SUB    = 16;   // between state sub-columns within a filled group
const GAP_FILLED = 64;   // clear visual gap between empty / filled groups
const GAP_SIZE   = 20;   // between size rows
const EDGE_PAD   = 24;   // inner padding — keeps −4px focus-ring overflow from clipping

(async () => {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

  const componentSet = await figma.getNodeByIdAsync(SET_ID);

  // ----- index -----
  function parseVariant(name) {
    return {
      sz:     name.match(/Size=(\w+)/)?.[1],
      state:  name.match(/State=(\w+)/)?.[1],
      filled: name.match(/Filled=(\w+)/)?.[1],
    };
  }

  const byKey = {};
  for (const c of componentSet.children) {
    const { sz, state, filled } = parseVariant(c.name);
    if (sz && state && filled) byKey[`${sz}|${state}|${filled}`] = c;
  }

  // ----- measure -----
  const colMaxWidth  = {};
  const rowMaxHeight = {};

  for (const size of SIZES) {
    rowMaxHeight[size] = 0;
    for (const filled of FILLED) {
      for (const state of STATES) {
        const key    = `${size}|${state}|${filled}`;
        const colKey = `${filled}|${state}`;
        const c = byKey[key];
        if (!c) continue;
        colMaxWidth[colKey]  = Math.max(colMaxWidth[colKey] ?? 0, c.width);
        rowMaxHeight[size]   = Math.max(rowMaxHeight[size], c.height);
      }
    }
  }

  // ----- column X: filled major, state sub -----
  const colX = {};
  let x = 0;
  for (let fi = 0; fi < FILLED.length; fi++) {
    const filled = FILLED[fi];
    for (let si = 0; si < STATES.length; si++) {
      const state  = STATES[si];
      const colKey = `${filled}|${state}`;
      colX[colKey] = x;
      x += (colMaxWidth[colKey] ?? 0);
      if (si < STATES.length - 1) x += GAP_SUB;
    }
    if (fi < FILLED.length - 1) x += GAP_FILLED;
  }
  const totalW = x;

  // ----- row Y positions -----
  const rowY = {};
  let y = 0;
  for (const size of SIZES) {
    rowY[size] = y;
    y += (rowMaxHeight[size] ?? 0) + GAP_SIZE;
  }
  const totalH = y - GAP_SIZE;

  // ----- apply EDGE_PAD -----
  for (const k of Object.keys(colX)) colX[k] += EDGE_PAD;
  for (const k of Object.keys(rowY)) rowY[k] += EDGE_PAD;

  // ----- position components -----
  for (const size of SIZES) {
    for (const filled of FILLED) {
      for (const state of STATES) {
        const c = byKey[`${size}|${state}|${filled}`];
        if (!c) continue;
        c.x = colX[`${filled}|${state}`];
        c.y = rowY[size];
      }
    }
  }

  componentSet.resize(totalW + EDGE_PAD * 2, totalH + EDGE_PAD * 2);

  // ----- default instance: md/default/empty → top-left -----
  const defaultComp = byKey['md|default|empty'];
  if (defaultComp) componentSet.insertChild(0, defaultComp);

  // ----- labels -----
  const existingLabels = figma.currentPage.findOne(n => n.name === 'Textarea Grid Labels');
  if (existingLabels) existingLabels.remove();

  function makeLabel(text, x, y, bold = false) {
    const t = figma.createText();
    t.characters = text;
    t.fontName = { family: 'Inter', style: bold ? 'Bold' : 'Regular' };
    t.fontSize = 11;
    t.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
    t.x = x;
    t.y = y;
    return t;
  }

  const labelNodes = [];
  const setX = componentSet.x;
  const setY = componentSet.y;

  // Filled group header labels
  const GROUP_LABEL_Y = setY - 48;
  for (const filled of FILLED) {
    const firstCol = `${filled}|${STATES[0]}`;
    const lastCol  = `${filled}|${STATES[STATES.length - 1]}`;
    const gLeft  = setX + colX[firstCol];
    const gRight = setX + colX[lastCol] + (colMaxWidth[lastCol] ?? 0);
    const gMid   = (gLeft + gRight) / 2;
    const lbl = makeLabel(filled, 0, GROUP_LABEL_Y, true);
    lbl.x = gMid - lbl.width / 2;
    labelNodes.push(lbl);
  }

  // State sub-column labels
  const SUB_LABEL_Y = setY - 24;
  for (const filled of FILLED) {
    for (const state of STATES) {
      const colKey = `${filled}|${state}`;
      const colW   = colMaxWidth[colKey] ?? 0;
      const lbl    = makeLabel(state, 0, SUB_LABEL_Y, false);
      lbl.x = setX + colX[colKey] + colW / 2 - lbl.width / 2;
      labelNodes.push(lbl);
    }
  }

  // Size row labels
  const SIZE_LABEL_X = setX - 56;
  for (const size of SIZES) {
    const rowH   = rowMaxHeight[size] ?? 0;
    const rowMid = setY + rowY[size] + rowH / 2;
    const lbl    = makeLabel(size, SIZE_LABEL_X, 0, false);
    lbl.y = rowMid - lbl.height / 2;
    labelNodes.push(lbl);
  }

  const labelGroup = figma.group(labelNodes, figma.currentPage);
  labelGroup.name = 'Textarea Grid Labels';

  figma.viewport.scrollAndZoomIntoView([componentSet]);
})();
