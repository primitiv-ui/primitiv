/**
 * PATHS-01 — three paths rising from one shared base.
 *
 * Run through the Desktop Bridge (`figma_execute`). Idempotent: it clears the
 * PATHS-01 frame and rebuilds. Flip `MOBILE` for the narrow breakpoint.
 *
 * ── THE ONE DETAIL THAT CARRIES THE ARGUMENT ─────────────────────────────
 * The brief's craft note: "The shared portion of the Styled block aligning
 * exactly with the top of the Headless block is the detail that makes 'layers,
 * not options' legible without a word of explanation."
 *
 * So Styled is not one block with a line drawn on it — it is TWO slabs stacked,
 * the lower one exactly Headless's height and fill. Because both blocks are
 * bottom-aligned on the bar, the seam lands on Headless's top edge by
 * construction rather than by measurement, and it stays correct if the heights
 * are ever retuned. Verified: `headless.y === shared.y === 100`.
 *
 * ── THE BOTTOM EDGE IS OPEN, THE LEFT EDGE IS CLOSED ─────────────────────
 * Desktop slabs carry `strokeBottomWeight = 0`, so each block RISES FROM the
 * bar instead of sitting on it behind its own border. That also reduces the
 * Styled seam from a 2px double line (added's bottom + shared's top) to the
 * single hairline of shared's top edge.
 *
 * Mobile is the rotation, and there the same trick is WRONG: the base bar is
 * beneath the stack rather than to the left, so an open left edge just reads as
 * cropped by the frame. Mobile slabs are closed and rounded, aligned on a
 * common left edge, with length encoding completeness.
 *
 * ── surface/subtle IS THIS SECTION'S OWN GROUND ──────────────────────────
 * The brief asks for the Figma block in `surface/subtle` "to sit slightly
 * apart". In the dark theme that token is `#202328` — exactly section 08's
 * fill — so the block rendered as an unfilled outline, which reads as empty
 * rather than as a different kind of thing, and empty ranks it below the code
 * paths (a must-not: "Keep the fills equally attractive"). It uses
 * `surface/default` (`#141414`) instead: a real if quiet difference against the
 * pair's `surface/raised` (`#121418`), with the 56px gap doing most of the
 * separating work. `surface/floating` (`#1e2126`) is too close to the ground to
 * help — checked.
 *
 * ── HEIGHT IS COMPLETENESS, NOT QUALITY ──────────────────────────────────
 * All three slabs share a width (desktop) or a height (mobile) so only ONE
 * dimension varies, and no fill is more attractive than another. Figma is
 * deliberately taller than Headless: the must-not is that the tallest block
 * must not look "best", and Headless is the right answer for many readers.
 *
 * ── MOBILE UNIFORM HEIGHT IS 112, AND IT WAS MEASURED ────────────────────
 * Styled's sub-line wraps to two lines at 138px of inner width, which
 * overflowed a 96px slab by 15px. Every slab is 112 so the height stays
 * constant across the three and only length carries meaning.
 */
const MOBILE = false;
const DESKTOP_GAP = '2180:92004';
const MOBILE_GAP  = '2183:92351';

// desktop: shared width, varying height. mobile: shared height, varying width.
const W = 270, BAR_H = MOBILE ? 64 : 72;
const H_HEADLESS = 170, H_ADDED = 100, H_FIGMA = 210;
const MH = 112, W_HEADLESS = 170, W_ADDED = 62, W_FIGMA = 205;

const vars = await figma.variables.getLocalVariablesAsync();
const V = {}; for (const v of vars) V[v.name] = v;
await figma.loadFontAsync({ family: 'Asta Sans', style: 'Regular' });
await figma.loadFontAsync({ family: 'Asta Sans', style: 'Medium' });
const ALL = ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'];
const TOP = ['topLeftRadius','topRightRadius'], RIGHT = ['topRightRadius','bottomRightRadius'];
const LEFT = ['topLeftRadius','bottomLeftRadius'];

const gap = await figma.getNodeByIdAsync(MOBILE ? MOBILE_GAP : DESKTOP_GAP);
for (const c of [...gap.children]) c.remove();
gap.name = 'PATHS-01 · three paths, one base';
gap.fills = []; gap.strokes = []; gap.dashPattern = [];   // the section supplies the ground
gap.layoutMode = 'VERTICAL';
gap.counterAxisSizingMode = 'FIXED';
gap.resize(MOBILE ? 342 : 1200, MOBILE ? 100 : 480);
gap.primaryAxisSizingMode = MOBILE ? 'AUTO' : 'FIXED';    // re-assert after resize
gap.clipsContent = false;
gap.paddingTop = gap.paddingBottom = gap.paddingLeft = gap.paddingRight = 0;
if (MOBILE) {
  gap.itemSpacing = 24; gap.setBoundVariable('itemSpacing', V['space/space-24']);
  gap.counterAxisAlignItems = 'MIN';
  gap.layoutSizingHorizontal = 'FILL';
} else {
  gap.itemSpacing = 0;
  gap.primaryAxisAlignItems = 'MAX';                      // the bar owns the bottom edge
  gap.counterAxisAlignItems = 'CENTER';
}

const frame = (parent, name, mode, gapPx, gapVar) => {
  const f = figma.createFrame(); parent.appendChild(f);
  f.name = name; f.fills = []; f.layoutMode = mode;
  f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
  if (gapPx != null) { f.itemSpacing = gapPx; if (gapVar) f.setBoundVariable('itemSpacing', V[gapVar]); }
  return f;
};
const text = (parent, chars, o) => {
  const t = figma.createText(); parent.appendChild(t);
  t.fontName = { family: 'Asta Sans', style: o.weight === 'Medium' ? 'Medium' : 'Regular' };
  t.characters = chars; t.fontSize = o.size; t.lineHeight = { unit: 'PIXELS', value: o.lh };
  t.fills = [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#000000'), 'color', V[o.colour])];
  t.textAutoResize = 'HEIGHT';
  if (o.align) t.textAlignHorizontal = o.align;
  t.setBoundVariable('fontSize', V[o.fam + '/font-size']);
  t.setBoundVariable('lineHeight', V[o.fam + '/line-height']);
  return t;
};
const slab = (parent, name, size, fillVar, roundOuter) => {
  const f = figma.createFrame(); parent.appendChild(f);
  f.name = name; f.layoutMode = 'VERTICAL';
  f.counterAxisSizingMode = 'FIXED';
  f.resize(MOBILE ? size : W, MOBILE ? MH : size);
  f.primaryAxisSizingMode = 'FIXED';
  const pad = MOBILE ? 16 : 20, padVar = MOBILE ? 'space/space-16' : 'space/space-20';
  for (const p of ['paddingLeft','paddingRight','paddingTop','paddingBottom'])
    { f[p] = pad; f.setBoundVariable(p, V[padVar]); }
  f.itemSpacing = MOBILE ? 2 : 4;
  f.fills = [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#ffffff'), 'color', V[fillVar])];
  f.strokes = [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#000000'), 'color', V['border/default'])];
  f.strokeAlign = 'INSIDE'; f.strokeWeight = 1; f.setBoundVariable('strokeWeight', V['border-width/1']);
  for (const c of ALL) f[c] = 0;
  if (MOBILE) {
    for (const c of LEFT) f.setBoundVariable(c, V['radii/8']);
    if (roundOuter) for (const c of RIGHT) f.setBoundVariable(c, V['radii/8']);
  } else {
    f.strokeBottomWeight = 0;                             // rises from the bar
    if (roundOuter) for (const c of TOP) f.setBoundVariable(c, V['radii/8']);
  }
  return f;
};
const label = (host, name, sub) => {
  text(host, name, { size: 16, lh: 24, weight: 'Medium', colour: 'content/primary', fam: 'label/md' })
    .layoutSizingHorizontal = 'FILL';
  text(host, sub, { size: 14, lh: 20, colour: 'content/secondary', fam: 'label/sm' })
    .layoutSizingHorizontal = 'FILL';
};

const stack = frame(gap, 'paths', MOBILE ? 'VERTICAL' : 'HORIZONTAL',
                    MOBILE ? 16 : 56, MOBILE ? 'space/space-16' : 'space/space-56');
stack.counterAxisAlignItems = MOBILE ? 'MIN' : 'MAX';
if (MOBILE) stack.layoutSizingHorizontal = 'FILL';

const pair = MOBILE ? stack : frame(stack, 'code paths', 'HORIZONTAL', 24, 'space/space-24');
if (!MOBILE) pair.counterAxisAlignItems = 'MAX';

const headless = slab(pair, 'Headless', MOBILE ? W_HEADLESS : H_HEADLESS, 'surface/raised', true);
label(headless, 'Headless', 'behaviour + props');

// two slabs, not one with a line on it: the lower is Headless's exact size and
// fill, so the seam is structural rather than measured
const styled = frame(pair, 'Styled', MOBILE ? 'HORIZONTAL' : 'VERTICAL', 0);
styled.counterAxisAlignItems = 'MIN';
if (MOBILE) {
  const shared = slab(styled, 'shared with Headless', W_HEADLESS, 'surface/raised', false);
  label(shared, 'Styled', 'behaviour + props + the design');
  const added = slab(styled, 'adds the design', W_ADDED, 'surface/raised', true);
  added.topLeftRadius = 0; added.bottomLeftRadius = 0;    // inner corners stay square
} else {
  const added = slab(styled, 'adds the design', H_ADDED, 'surface/raised', true);
  label(added, 'Styled', 'behaviour + props + the design');
  slab(styled, 'shared with Headless', H_HEADLESS, 'surface/raised', false);
}

if (MOBILE) {
  const spacer = figma.createFrame(); stack.appendChild(spacer);
  spacer.name = 'gap before Figma'; spacer.fills = []; spacer.layoutMode = 'VERTICAL';
  spacer.resize(1, 24);
  spacer.layoutSizingVertical = 'FIXED';
  spacer.setBoundVariable('height', V['space/space-24']);
  spacer.opacity = 0;                                     // stays in flow (prose-layout §6)
}

// surface/default, NOT surface/subtle — see the header note
const fig = slab(MOBILE ? stack : stack, 'Figma', MOBILE ? W_FIGMA : H_FIGMA, 'surface/default', true);
label(fig, 'Figma', 'the design, as a library');

// ── the base bar: the most confident element, because it is the point ────
const bar = figma.createFrame(); gap.appendChild(bar);
bar.name = 'base — one set of tokens';
bar.layoutMode = 'HORIZONTAL';
bar.counterAxisSizingMode = 'FIXED';
bar.resize(MOBILE ? 342 : 1200, BAR_H);
bar.primaryAxisSizingMode = 'FIXED';
bar.primaryAxisAlignItems = 'CENTER'; bar.counterAxisAlignItems = 'CENTER';
bar.fills = [figma.variables.setBoundVariableForPaint(figma.util.solidPaint('#ffffff'), 'color', V['action/primary/soft'])];
for (const c of ALL) bar.setBoundVariable(c, V['radii/8']);
bar.layoutSizingHorizontal = 'FILL';
if (MOBILE) {
  bar.paddingLeft = bar.paddingRight = 20; bar.paddingTop = bar.paddingBottom = 16;
  bar.layoutSizingVertical = 'HUG';
}
const bl = text(bar, 'one set of tokens, one set of accessible behaviours',
                { size: 16, lh: 24, weight: 'Medium', colour: 'content/primary', fam: 'label/md', align: 'CENTER' });
if (MOBILE) bl.layoutSizingHorizontal = 'FILL';
else bl.textAutoResize = 'WIDTH_AND_HEIGHT';

return { gap: Math.round(gap.width) + '×' + Math.round(gap.height),
         seamAligned: MOBILE ? null : Math.round(headless.y) };
