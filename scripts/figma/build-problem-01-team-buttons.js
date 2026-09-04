/**
 * PROBLEM-01 — three teams' "Save changes" buttons, subtly wrong.
 *
 * Run through the Desktop Bridge (`figma_execute`). Idempotent: it clears the
 * PROBLEM-01 frame and rebuilds. Flip `MOBILE` for the narrow breakpoint.
 *
 * ── THE SUBTLETY IS MEASURED, NOT EYEBALLED ──────────────────────────────
 * The brief's hardest instruction: "getting the differences to sit right at the
 * edge of perceptible is the entire craft of this image. If in doubt, make them
 * MORE similar, not less." Picking three hexes by eye cannot honour that,
 * because the whole question is HOW FAR APART they are.
 *
 * So the colours come from `crates/harmoni-core/examples/swatch-sheet.rs`
 * (`write_team_buttons`), which places each blue in OkLCH by an explicit hue and
 * chroma offset from the brand seed and reports the pairwise **Oklab dE**:
 *
 *     Billing #176fdd · Onboarding #2c6ce7 · Settings #3966de
 *     dE 0.0199 · 0.0257 · 0.0186   (target band 0.02-0.04)
 *
 * The FIRST pass ran roughly double those offsets and landed at dE 0.036-0.049,
 * where #0371d9 read cyan-ish against #4661da violet-ish — the "no team would
 * ship that" failure the brief explicitly warns about. The numbers caught it
 * before the render did. Never hand-edit the hexes here; change the offsets in
 * the Rust and regenerate.
 *
 * ── NONE OF THE THREE IS THE BRAND COLOUR, DELIBERATELY ──────────────────
 * Primitiv is the fix this section sets up, not one of the three teams. Putting
 * the real brand blue among them would quietly frame one button as already
 * correct, which is the same mistake as the brief's must-not about "a
 * comparison against a 'correct' fourth button".
 *
 * ── WHY A SHARED-HEIGHT WELL ─────────────────────────────────────────────
 * The brief wants the buttons "vertically centred on their own optical centres
 * rather than their bounding boxes (their heights differ, and aligning boxes
 * would hide that)". Each button therefore sits in a fixed 52px well with
 * centre alignment: the three share ONE centreline, the height difference reads
 * symmetrically above and below rather than as a step, and the captions still
 * land on a single baseline.
 *
 * ── EVERY DIFFERENCE IS AN INLINE OVERRIDE, AND THAT IS THE POINT ────────
 * Nothing here is bound to a token. These are other teams' buttons, so the
 * drift has to be literal: `fills`, `cornerRadius`, `paddingLeft/Right`, a
 * `resize()` for height, and a `fontName` swap for the label weight. Geometry
 * is deltas off the real `framed-control/md` comfortable values (height 40,
 * radius 8, padding-inline 16), not invented numbers.
 *
 * Worth knowing: **Button's label is SemiBold by default**, so it is the first
 * TWO that drop to Medium, not the third that rises.
 *
 * ── THE FRAME HAS NO FILL, ON PURPOSE ────────────────────────────────────
 * "No frame, no card, no container. They sit on the page ground." Section 03 is
 * one of the alternating unfilled bands, so reviewing this in isolation exports
 * white and tells you nothing — screenshot the SECTION, or temporarily fill it.
 */
const MOBILE = false;
const DESKTOP_GAP = '2180:91904';
const MOBILE_GAP  = '2183:92241';
const WELL_H = 52;                       // clears the tallest (45) with air both sides

// from docs/generated/problem-01-team-buttons.json — regenerate, never edit
const DATA = [
  { team: 'Billing',    hex: '#176fdd', h: 40, r: 4,  pad: 16, weight: 'Medium' },
  { team: 'Onboarding', hex: '#2c6ce7', h: 42, r: 6,  pad: 20, weight: 'Medium' },
  { team: 'Settings',   hex: '#3966de', h: 45, r: 10, pad: 16, weight: 'SemiBold' },
];

const sets = {};
for (const p of figma.root.children) {
  let kids; try { kids = p.children; } catch (e) { continue; }
  for (const c of kids) if (c.type === 'COMPONENT_SET') sets[c.name] = c;
}
const vars = await figma.variables.getLocalVariablesAsync();
const V = {}; for (const v of vars) V[v.name] = v;
await figma.loadFontAsync({ family: 'Asta Sans', style: 'Regular' });
await figma.loadFontAsync({ family: 'Khand', style: 'Medium' });
await figma.loadFontAsync({ family: 'Khand', style: 'SemiBold' });

const gap = await figma.getNodeByIdAsync(MOBILE ? MOBILE_GAP : DESKTOP_GAP);
for (const c of [...gap.children]) c.remove();
gap.name = 'PROBLEM-01 · three teams, three buttons';
gap.fills = []; gap.strokes = []; gap.dashPattern = [];
gap.layoutMode = 'VERTICAL';
gap.counterAxisSizingMode = 'FIXED';
gap.resize(MOBILE ? 342 : 1200, MOBILE ? 100 : 400);
gap.primaryAxisSizingMode = MOBILE ? 'AUTO' : 'FIXED';   // re-assert after resize (gotcha 7)
gap.counterAxisAlignItems = 'CENTER';
gap.clipsContent = false;
gap.paddingLeft = gap.paddingRight = 0;
if (MOBILE) {
  gap.paddingTop = gap.paddingBottom = 40;
  for (const p of ['paddingTop', 'paddingBottom']) gap.setBoundVariable(p, V['space/space-40']);
  gap.itemSpacing = 40; gap.setBoundVariable('itemSpacing', V['space/space-40']);
  gap.layoutSizingHorizontal = 'FILL';
} else {
  gap.paddingTop = gap.paddingBottom = 0;
  gap.primaryAxisAlignItems = 'CENTER';                  // wide, quiet margins
}

// desktop puts the three on one line; mobile stacks them (brief, below-36rem)
let host = gap;
if (!MOBILE) {
  host = figma.createFrame(); gap.appendChild(host);
  host.name = 'three teams'; host.fills = [];
  host.layoutMode = 'HORIZONTAL';
  host.primaryAxisSizingMode = 'AUTO'; host.counterAxisSizingMode = 'AUTO';
  host.counterAxisAlignItems = 'MIN';
  host.itemSpacing = 56; host.setBoundVariable('itemSpacing', V['space/space-56']);
}

const master = sets['Button'].children.find(c => c.name === 'Variant=primary, Size=md, State=default');
const built = [];
for (const d of DATA) {
  const col = figma.createFrame(); host.appendChild(col);
  col.name = 'team — ' + d.team; col.fills = [];
  col.layoutMode = 'VERTICAL';
  col.primaryAxisSizingMode = 'AUTO'; col.counterAxisSizingMode = 'AUTO';
  col.counterAxisAlignItems = 'CENTER';
  col.itemSpacing = 12; col.setBoundVariable('itemSpacing', V['space/space-12']);

  const well = figma.createFrame(); col.appendChild(well);
  well.name = 'well'; well.fills = [];
  well.layoutMode = 'HORIZONTAL';
  well.resize(10, WELL_H);
  well.layoutSizingHorizontal = 'HUG';                   // resize() pinned it FIXED
  well.layoutSizingVertical = 'FIXED';
  well.primaryAxisAlignItems = 'CENTER';
  well.counterAxisAlignItems = 'CENTER';                 // ONE shared centreline

  const b = master.createInstance(); well.appendChild(b);
  b.setProperties({ 'Label#347:3401': 'Save changes',
                    'Leading Icon#347:3389': false, 'Trailing Icon#347:3395': false });
  // literal overrides — this is drift; nothing here is bound to a token
  b.fills = [figma.util.solidPaint(d.hex)];
  b.cornerRadius = d.r;
  b.paddingLeft = d.pad; b.paddingRight = d.pad;
  b.layoutSizingVertical = 'FIXED';
  b.resize(b.width, d.h);
  const txt = b.children.find(c => c.type === 'TEXT');
  if (txt) txt.fontName = { family: 'Khand', style: d.weight };

  const cap = figma.createText(); col.appendChild(cap);
  cap.fontName = { family: 'Asta Sans', style: 'Regular' };
  cap.characters = d.team;                               // TEAM names, not component names
  cap.fontSize = 14; cap.lineHeight = { unit: 'PIXELS', value: 20 };
  cap.setBoundVariable('fontSize', V['label/sm/font-size']);
  cap.setBoundVariable('lineHeight', V['label/sm/line-height']);
  cap.fills = [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#000000'), 'color', V['content/muted'])];
  cap.textAutoResize = 'WIDTH_AND_HEIGHT';
  cap.textAlignHorizontal = 'CENTER';

  built.push({ team: d.team, btn: Math.round(b.width) + '×' + Math.round(b.height), r: b.cornerRadius });
}
return { gap: Math.round(gap.width) + '×' + Math.round(gap.height), built };
