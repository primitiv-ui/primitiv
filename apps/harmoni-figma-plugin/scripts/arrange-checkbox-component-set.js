// arrange-checkbox-component-set.js
// Arranges the Checkbox component set (60 variants) into a labelled grid.
// Run via the Figma developer console with the Checkbox component set selected.
//
// Grid axes:
//   Rows: Size (md first, then xs sm lg xl)
//   Cols: State (unchecked | checked | indeterminate) × Interaction (default | hover | focus | disabled)
//
// Density is controlled by the containing frame's Context variable mode override.
// Re-run safe: deletes "Checkbox Grid Labels" group before regenerating.

(async function () {

  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

  const SIZE_ORDER        = ['md', 'xs', 'sm', 'lg', 'xl'];
  const STATE_ORDER       = ['unchecked', 'checked', 'indeterminate'];
  const INTERACTION_ORDER = ['default', 'hover', 'focus', 'disabled'];

  const GAP_INTERACTION = 8;
  const GAP_STATE       = 32;
  const GAP_SIZE        = 12;
  const EDGE_PAD        = 8;

  const set = figma.currentPage.selection.find(n => n.type === 'COMPONENT_SET');
  if (!set) {
    console.error('Nothing selected. Select the Checkbox component set and re-run.');
    return;
  }

  function parseProps(name) {
    return {
      sz:   name.match(/Size=(\w+)/)?.[1],
      st:   name.match(/State=(\w+)/)?.[1],
      iact: name.match(/Interaction=(\w+)/)?.[1],
    };
  }

  const all   = [...set.children].filter(n => n.type === 'COMPONENT');
  const valid = all.filter(c => {
    const { sz, st, iact } = parseProps(c.name);
    return sz && st && iact;
  });
  console.log(`Found ${valid.length} valid components in "${set.name}".`);

  const colWidths  = {};
  const rowHeights = {};
  for (const comp of valid) {
    const { sz, st, iact } = parseProps(comp.name);
    const ck = `${st}_${iact}`;
    colWidths[ck]  = Math.max(colWidths[ck]  || 0, comp.width);
    rowHeights[sz] = Math.max(rowHeights[sz] || 0, comp.height);
  }

  // Column x-positions
  const colX = {};
  let x = 0;
  for (let si = 0; si < STATE_ORDER.length; si++) {
    if (si > 0) x += GAP_STATE;
    for (let ii = 0; ii < INTERACTION_ORDER.length; ii++) {
      if (ii > 0) x += GAP_INTERACTION;
      const k = `${STATE_ORDER[si]}_${INTERACTION_ORDER[ii]}`;
      colX[k] = x;
      x += colWidths[k] || 0;
    }
  }

  // Row y-positions
  const rowY = {};
  let y = 0;
  for (let si = 0; si < SIZE_ORDER.length; si++) {
    if (si > 0) y += GAP_SIZE;
    rowY[SIZE_ORDER[si]] = y;
    y += rowHeights[SIZE_ORDER[si]] || 0;
  }

  for (const k of Object.keys(colX)) colX[k] += EDGE_PAD;
  for (const k of Object.keys(rowY)) rowY[k] += EDGE_PAD;

  set.resize(x + EDGE_PAD * 2, y + EDGE_PAD * 2);

  let placed = 0, skipped = 0;
  for (const comp of valid) {
    const { sz, st, iact } = parseProps(comp.name);
    const ck = `${st}_${iact}`;
    if (colX[ck] !== undefined && rowY[sz] !== undefined) {
      comp.x = colX[ck] + Math.floor((colWidths[ck] - comp.width)   / 2);
      comp.y = rowY[sz]  + Math.floor((rowHeights[sz] - comp.height) / 2);
      placed++;
    } else {
      console.warn(`Could not place: ${comp.name}`); skipped++;
    }
  }

  // Default instance: md / unchecked / default
  const defaultComp = valid.find(c => {
    const { sz, st, iact } = parseProps(c.name);
    return sz === 'md' && st === 'unchecked' && iact === 'default';
  });
  if (defaultComp) set.insertChild(0, defaultComp);

  // Labels
  const existing = figma.currentPage.findOne(n => n.name === 'Checkbox Grid Labels');
  if (existing) existing.remove();

  const labelNodes = [];

  function makeLabel(text, lx, ly, bold) {
    const t = figma.createText();
    t.fontName   = { family: 'Inter', style: bold ? 'Bold' : 'Regular' };
    t.fontSize   = bold ? 12 : 10;
    t.characters = text;
    t.x = lx; t.y = ly;
    figma.currentPage.appendChild(t);
    labelNodes.push(t);
    return t;
  }

  // State group headers + interaction sub-labels (above the set)
  for (const st of STATE_ORDER) {
    const firstX     = colX[`${st}_default`];
    const lastKey    = `${st}_disabled`;
    const groupRight = colX[lastKey] + colWidths[lastKey];
    const t = makeLabel(st.charAt(0).toUpperCase() + st.slice(1), 0, set.y - 48, true);
    t.x = set.x + (firstX + groupRight) / 2 - t.width / 2;

    for (const iact of INTERACTION_ORDER) {
      makeLabel(iact, set.x + colX[`${st}_${iact}`], set.y - 24, false);
    }
  }

  // Size row labels (left of the set)
  for (const sz of SIZE_ORDER) {
    const rowMidY = (rowY[sz] || 0) + (rowHeights[sz] || 0) / 2;
    const sl = makeLabel(sz, set.x - 56, 0, false);
    sl.y = set.y + rowMidY - sl.height / 2;
  }

  const labelGroup = figma.group(labelNodes, figma.currentPage);
  labelGroup.name  = 'Checkbox Grid Labels';

  figma.viewport.scrollAndZoomIntoView([set, labelGroup]);
  console.log(`Done. Placed ${placed}${skipped ? `, skipped ${skipped}` : ''}.`);

})().catch(err => console.error('Script error:', err.message));
