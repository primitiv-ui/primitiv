/**
 * Arrange the Progress component set into a 5-row × 6-column grid.
 *
 * Rows:    Size — md (first/default), xs, sm, lg, xl
 * Columns: Intent × State — primary/default, primary/indeterminate,
 *          secondary/default, secondary/indeterminate,
 *          danger/default, danger/indeterminate
 *
 * Track height is density-invariant (progress/{size}/height aliases the
 * same size primitive across all 4 Context modes):
 *   xs=4px  sm=6px  md=8px  lg=12px  xl=16px
 *
 * Run in the Figma developer console on the Progress page.
 * Labels are placed as TEXT nodes on the page (ComponentSet can only
 * hold COMPONENT children).
 */

const SET_ID      = '443:7839';
const EDGE_PAD    = 24;
const VARIANT_W   = 240;
const COL_GAP     = 24;
const ROW_H       = 40;   // slot height: xl=16px + 24px breathing room
const COL_LABEL_H = 22;
const ROW_LABEL_W = 48;

const sizeOrder   = ['md','xs','sm','lg','xl'];
const sizeHeights = { xs: 4, sm: 6, md: 8, lg: 12, xl: 16 };
const colDefs = [
  { intent: 'primary',   state: 'default',      label: 'primary · default' },
  { intent: 'primary',   state: 'indeterminate', label: 'primary · indet.' },
  { intent: 'secondary', state: 'default',       label: 'secondary · default' },
  { intent: 'secondary', state: 'indeterminate', label: 'secondary · indet.' },
  { intent: 'danger',    state: 'default',       label: 'danger · default' },
  { intent: 'danger',    state: 'indeterminate', label: 'danger · indet.' },
];

await figma.loadFontAsync({ family: 'Khand', style: 'SemiBold' });
const set = await figma.getNodeByIdAsync(SET_ID);

// Remove stale labels
for (const n of [...figma.currentPage.children]) {
  if (n.type === 'TEXT' && n.getPluginData('progressLabel') === '1') n.remove();
}

function parseProps(name) {
  const p = {};
  for (const s of name.split(', ')) { const [k,v] = s.split('='); p[k.trim()] = v.trim(); }
  return p;
}

// Position variants
for (const v of set.children.filter(n => n.type === 'COMPONENT')) {
  const props = parseProps(v.name);
  const row = sizeOrder.indexOf(props.Size);
  const col = colDefs.findIndex(d => d.intent === props.Intent && d.state === props.State);
  if (row === -1 || col === -1) continue;
  const rowTop = EDGE_PAD + COL_LABEL_H + 8 + row * ROW_H;
  v.x = EDGE_PAD + ROW_LABEL_W + col * (VARIANT_W + COL_GAP);
  v.y = rowTop + Math.floor((ROW_H - sizeHeights[props.Size]) / 2);
}

// Promote md/primary/default as the default instance
const def = set.children.find(
  n => n.type === 'COMPONENT' && n.name === 'Size=md, Intent=primary, State=default'
);
if (def) set.insertChild(0, def);

// Resize set
const totalW = EDGE_PAD + ROW_LABEL_W + colDefs.length * (VARIANT_W + COL_GAP) - COL_GAP + EDGE_PAD;
const totalH = EDGE_PAD + COL_LABEL_H + 8 + sizeOrder.length * ROW_H + EDGE_PAD;
set.resizeWithoutConstraints(totalW, totalH);
set.x = 100; set.y = 100;

function makeLabel(chars, x, y) {
  const t = figma.createText();
  t.fontName = { family: 'Khand', style: 'SemiBold' };
  t.fontSize = 10;
  t.fills = [{ type: 'SOLID', color: { r: 0.55, g: 0.55, b: 0.55 } }];
  t.characters = chars;
  t.x = x; t.y = y;
  t.setPluginData('progressLabel', '1');
  figma.currentPage.appendChild(t);
}

// Column labels
for (let col = 0; col < colDefs.length; col++) {
  makeLabel(
    colDefs[col].label,
    set.x + EDGE_PAD + ROW_LABEL_W + col * (VARIANT_W + COL_GAP),
    set.y + EDGE_PAD + 4
  );
}
// Row labels
for (let row = 0; row < sizeOrder.length; row++) {
  const rowTop = EDGE_PAD + COL_LABEL_H + 8 + row * ROW_H;
  makeLabel(
    sizeOrder[row],
    set.x + EDGE_PAD,
    set.y + rowTop + Math.floor((ROW_H - 12) / 2)
  );
}
