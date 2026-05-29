// arrange-checkbox-component-set.js
// Arranges the Checkbox component set (240 variants) into a labelled grid.
// Run via figma_execute — replace the findOne lookup with getNodeByIdAsync if the ID is known.
//
// Grid axes:
//   Rows: Context (compact→comfortable→spacious→dense), md-first within each section
//   Cols: State (unchecked|checked|indeterminate) × Interaction (default|hover|focus|disabled)
//
// Re-run safe: deletes "Checkbox Grid Labels" group before regenerating.

const SIZE_ORDER        = ['md', 'xs', 'sm', 'lg', 'xl'];
const CONTEXT_ORDER     = ['compact', 'comfortable', 'spacious', 'dense'];
const STATE_ORDER       = ['unchecked', 'checked', 'indeterminate'];
const INTERACTION_ORDER = ['default', 'hover', 'focus', 'disabled'];

const GAP_INTERACTION = 8;
const GAP_STATE       = 32;
const GAP_SIZE        = 12;
const GAP_DENSITY     = 64;
const EDGE_PAD        = 8; // keeps −4 px focus-ring overflow from being clipped

function parseProps(name) {
  return {
    ctx:  name.match(/Context=(\w+)/)?.[1],
    sz:   name.match(/Size=(\w+)/)?.[1],
    st:   name.match(/State=(\w+)/)?.[1],
    iact: name.match(/Interaction=(\w+)/)?.[1],
  };
}

const set = figma.currentPage.findOne(n => n.type === 'COMPONENT_SET' && n.name === 'Checkbox');
if (!set) throw new Error('Checkbox component set not found on this page');

// Measure max width/height per column and row cell
const colWidths = {}, rowHeights = {};
for (const comp of set.children) {
  const { ctx, sz, st, iact } = parseProps(comp.name);
  const ck = `${st}_${iact}`;
  const rk = `${ctx}_${sz}`;
  colWidths[ck]  = Math.max(colWidths[ck]  || 0, comp.width);
  rowHeights[rk] = Math.max(rowHeights[rk] || 0, comp.height);
}

// Column X positions
const colX = {};
let x = 0;
for (const st of STATE_ORDER) {
  for (let i = 0; i < INTERACTION_ORDER.length; i++) {
    const iact = INTERACTION_ORDER[i];
    const k = `${st}_${iact}`;
    colX[k] = x;
    x += colWidths[k];
    if (i < INTERACTION_ORDER.length - 1) x += GAP_INTERACTION;
  }
  x += GAP_STATE;
}
const totalW = x - GAP_STATE;

// Row Y positions
const rowY = {};
let y = 0;
for (let ci = 0; ci < CONTEXT_ORDER.length; ci++) {
  const ctx = CONTEXT_ORDER[ci];
  for (let si = 0; si < SIZE_ORDER.length; si++) {
    const sz = SIZE_ORDER[si];
    const k = `${ctx}_${sz}`;
    rowY[k] = y;
    y += rowHeights[k];
    if (si < SIZE_ORDER.length - 1) y += GAP_SIZE;
  }
  if (ci < CONTEXT_ORDER.length - 1) y += GAP_DENSITY;
}
const totalH = y;

// Apply EDGE_PAD to all positions
for (const k of Object.keys(colX))  colX[k]  += EDGE_PAD;
for (const k of Object.keys(rowY))  rowY[k]  += EDGE_PAD;

// Position components — centred within their grid cell
for (const comp of set.children) {
  const { ctx, sz, st, iact } = parseProps(comp.name);
  const ck = `${st}_${iact}`;
  const rk = `${ctx}_${sz}`;
  comp.x = colX[ck] + Math.floor((colWidths[ck] - comp.width)  / 2);
  comp.y = rowY[rk] + Math.floor((rowHeights[rk] - comp.height) / 2);
}

// Resize component set
set.resize(totalW + EDGE_PAD * 2, totalH + EDGE_PAD * 2);

// Default instance: compact / md / unchecked / default (top-left cell)
const defaultComp = [...set.children].find(
  c => c.name === 'Context=compact, Size=md, State=unchecked, Interaction=default'
);
if (defaultComp) set.insertChild(0, defaultComp);

// Labels
const existing = figma.currentPage.findOne(n => n.name === 'Checkbox Grid Labels');
if (existing) existing.remove();

await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

const labelNodes = [];

// State group headers — bold, centred over each group's full width
for (const st of STATE_ORDER) {
  const firstX    = colX[`${st}_default`];
  const lastKey   = `${st}_disabled`;
  const groupRight = colX[lastKey] + colWidths[lastKey];
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: 'Bold' };
  t.fontSize = 12;
  t.characters = st.charAt(0).toUpperCase() + st.slice(1);
  t.x = set.x + (firstX + groupRight) / 2 - t.width / 2;
  t.y = set.y - 48;
  labelNodes.push(t);
}

// Interaction sub-labels — regular, left-aligned to each column
for (const st of STATE_ORDER) {
  for (const iact of INTERACTION_ORDER) {
    const t = figma.createText();
    t.fontName = { family: 'Inter', style: 'Regular' };
    t.fontSize = 10;
    t.characters = iact;
    t.x = set.x + colX[`${st}_${iact}`];
    t.y = set.y - 24;
    labelNodes.push(t);
  }
}

// Context density labels — bold, vertically centred over each density section
for (const ctx of CONTEXT_ORDER) {
  const topY    = rowY[`${ctx}_md`];
  const botKey  = `${ctx}_xl`;
  const sectionBot = rowY[botKey] + rowHeights[botKey];
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: 'Bold' };
  t.fontSize = 12;
  t.characters = ctx.charAt(0).toUpperCase() + ctx.slice(1);
  t.x = set.x - 180;
  t.y = set.y + (topY + sectionBot) / 2 - t.height / 2;
  labelNodes.push(t);
}

// Size row labels — regular, vertically centred over each size row
for (const ctx of CONTEXT_ORDER) {
  for (const sz of SIZE_ORDER) {
    const k = `${ctx}_${sz}`;
    const t = figma.createText();
    t.fontName = { family: 'Inter', style: 'Regular' };
    t.fontSize = 10;
    t.characters = sz;
    t.x = set.x - 56;
    t.y = set.y + rowY[k] + rowHeights[k] / 2 - t.height / 2;
    labelNodes.push(t);
  }
}

const labelGroup = figma.group(labelNodes, figma.currentPage);
labelGroup.name = 'Checkbox Grid Labels';

figma.viewport.scrollAndZoomIntoView([set, labelGroup]);
