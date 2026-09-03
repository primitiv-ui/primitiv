/**
 * HERO-01 — the docs-site home page hero illustration.
 *
 * Run through the Desktop Bridge (`figma_execute`). Idempotent: it removes
 * whatever is in the HERO-01 gap and rebuilds from scratch.
 *
 * DIRECTION, settled 2026-09-03 after a first attempt was rejected:
 * the brief in `docs/docs-site-home-copy.md` called for two tilted "specimen
 * boards" in opposite themes. Built and reviewed, the tilt read as wonky
 * rather than as a physical artefact, and the rear board's 8% offset showed
 * only a sliver of half-cut buttons. Replaced by a straight-on WALL of real
 * components, packed into uniform columns and bled past every edge of the
 * frame, with a radial vignette closing it down at the edges. The brief's
 * `must-not` on "a gradient wash" is deliberately overridden here — the wash
 * IS the treatment now, and it is over the top rather than behind.
 *
 * WHY THE VIGNETTE USES A RAW HEX. A gradient stop can bind a colour variable
 * but adopts that variable's own alpha (CLAUDE.md, Figma gotcha 3 / the Card
 * scrim notes), and this fade needs alpha 0 -> 1 of one colour. So the stops
 * carry `#141414` literally — `surface/default` in dark mode, which is the
 * only mode this frame is pinned to. Re-point them if the hero ever ships a
 * light twin.
 */
const GAP_ID = '2180:91877';          // the HERO-01 frame on `Home — desktop (v3)`
const INTENT = 'VariableCollectionId:346:4407';
const INTENT_DARK = '372:1';
const COL_W = 280, GAP = 20, TARGET_H = 940;
const GROUND = { r: 0x14 / 255, g: 0x14 / 255, b: 0x14 / 255 };

const COLUMNS = [
  ['Button','Checkbox','Segmented Control','Progress','Tag','Switch','Radio','Toggle Group','Kbd'],
  ['Field','Badge','Slider','Avatar Group','Chip','Input','Icon Button','Pagination','Link'],
  ['Select / Trigger','Alert','Avatar','Breadcrumb','Tooltip / Content','Listbox / Option','Stepper / Step','Tabs / Trigger','Split Button'],
  ['Code Block','Card','CheckboxCard','Textarea','Popover / Content','Collapsible / Trigger','Dropdown / Item','Accordion/Item','Combobox'],
  ['Data Table / Row','Tree / Item','Navigation Menu / Bar Link','Miller Columns / Item','List','Blockquote','Inline Code','Listbox / CheckboxOption','Stepper / Segment'],
];
// Appended until each column clears TARGET_H, so no column runs dry above the crop.
const FILLERS = [
  ['Card','Tooltip / Content','Tag','Data Table / Row','Textarea','Avatar','Badge','Breadcrumb','Alert','Kbd','Listbox / Option'],
  ['Code Block','Tree / Item','Chip','Collapsible / Trigger','Tabs / Trigger','Card','Dropdown / Item','Blockquote','Toggle Group','Avatar','Select / Trigger'],
  ['Textarea','List','Kbd','CheckboxCard','Progress','Popover / Content','Switch','Inline Code','Card','Slider','Badge'],
  ['Tag','Avatar Group','Pagination','Icon Button','Checkbox','Tooltip / Content','Link','Radio','Breadcrumb','Chip','Segmented Control'],
  ['Field','Chip','Split Button','Alert','Icon Button','Progress','Code Block','Switch','Tag','Avatar Group','Textarea'],
];

const gap = await figma.getNodeByIdAsync(GAP_ID);
for (const c of [...gap.children]) c.remove();
gap.name = 'HERO-01 · component wall';
gap.layoutMode = 'NONE';
gap.clipsContent = true;
gap.fills = []; gap.strokes = []; gap.dashPattern = [];
gap.layoutSizingHorizontal = 'FILL';
gap.resize(gap.width, 750);

const sets = {};
for (const p of figma.root.children) {
  let kids; try { kids = p.children; } catch (e) { continue; }
  for (const c of kids) if (c.type === 'COMPONENT_SET') sets[c.name] = c;
}

const wall = figma.createFrame();
gap.appendChild(wall);                     // append FIRST, then configure (gotcha 13)
wall.name = 'HERO-01 · component wall';
wall.layoutMode = 'HORIZONTAL';
wall.primaryAxisSizingMode = 'AUTO';
wall.counterAxisSizingMode = 'AUTO';
wall.counterAxisAlignItems = 'MIN';
wall.itemSpacing = GAP;
wall.fills = [];
wall.setExplicitVariableModeForCollection(await figma.variables.getVariableCollectionByIdAsync(INTENT), INTENT_DARK);

const add = (col, name) => {
  const set = sets[name];
  if (!set) return false;
  try {
    const inst = (set.defaultVariant || set.children[0]).createInstance();
    col.appendChild(inst);
    if (inst.width > COL_W) inst.resize(COL_W, inst.height);
    return true;
  } catch (e) { return false; }
};

for (let ci = 0; ci < COLUMNS.length; ci++) {
  const col = figma.createFrame();
  wall.appendChild(col);
  col.name = 'column ' + (ci + 1);
  col.layoutMode = 'VERTICAL';
  col.counterAxisSizingMode = 'FIXED';
  col.resize(COL_W, 100);
  col.primaryAxisSizingMode = 'AUTO';       // re-assert after resize (gotcha 7)
  col.counterAxisAlignItems = 'MIN';
  col.itemSpacing = GAP;
  col.fills = [];
  col.clipsContent = true;                  // a wide component crops, it does not overflow
  for (const name of COLUMNS[ci]) add(col, name);
  for (let g = 0; col.height < TARGET_H && g < 40; g++) add(col, FILLERS[ci][g % FILLERS[ci].length]);
}
wall.x = -90; wall.y = -150;                // bleeds top, left and right

const stop = (position, a) => ({ position, color: { ...GROUND, a } });
const veil = (name, fill) => {
  const r = figma.createRectangle();
  gap.appendChild(r);
  r.name = name; r.x = 0; r.y = 0;
  r.resize(gap.width, gap.height);
  r.strokes = [];                           // create* ships a default stroke (gotcha 28)
  r.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
  r.fills = [fill];
};
veil('veil — vignette', { type: 'GRADIENT_RADIAL',
  gradientTransform: [[1.35, 0, -0.175], [0, 1.05, -0.025]],
  gradientStops: [stop(0, 0), stop(0.62, 0), stop(0.88, 0.62), stop(1, 0.96)] });
veil('veil — foot', { type: 'GRADIENT_LINEAR',
  gradientTransform: [[0, 1, 0], [-1, 0, 1]],
  gradientStops: [stop(0, 0), stop(0.62, 0), stop(1, 1)] });

return { wall: { w: Math.round(wall.width), h: Math.round(wall.height) },
         columns: wall.children.map(c => ({ name: c.name, items: c.children.length, h: Math.round(c.height) })) };
