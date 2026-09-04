/**
 * Apply the Prose flow rhythm to the docs-site home page frames.
 *
 * Run through the Desktop Bridge (`figma_execute`) against `Home — desktop (v3)`
 * and `Home — mobile (v3)`. Idempotent: a second run finds the `flow · *`
 * wrappers already in place, treats them as opaque blocks, and changes nothing.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 * The page will be built with `Container` / `Stack` / `Prose`, so the design
 * has to encode what those actually render. Every section's content stack was
 * a flat 24px gap. `.primitiv-flow`'s owl (RFC 0016, `registry/components/
 * prose/styles.css`) renders, at Comfortable:
 *
 *     * + *            flow/normal   20     paragraph to paragraph
 *     * + h1,h2        flow/region   48     big air above a major heading
 *     * + h3,h4        flow/section  32     air above a sub-section
 *     h1..h4 + *       flow/tight    12     heading binds to its body
 *
 * So a run of [overline, h2, body/lg, body/md] renders 48 / 12 / 20 — not
 * 24 / 24 / 24. The heading was getting HALF the air above it and TWICE the
 * air below it that the built page will give.
 *
 * ── THE TRANSLATION: ONE GAP PER FRAME vs ONE GAP PER PAIR ───────────────
 * Figma auto-layout has a single `itemSpacing` per frame; the owl has a rule
 * per sibling PAIR. There is no way to express variable rhythm in one flat
 * frame, so the run becomes a RIGHT-NESTED CHAIN, walking from the last block
 * backwards and opening a new wrapper only when the wanted gap changes:
 *
 *     flow · region  [48]
 *       overline
 *       flow · tight  [12]
 *         heading/h2
 *         flow · normal  [20]
 *           body/lg
 *           body/md
 *
 * Consecutive equal gaps collapse into one frame, so a plain run of three
 * paragraphs stays a single `flow · normal`. This reproduces ANY gap sequence
 * exactly — it is not an approximation of the owl, it is the owl.
 *
 * ── THE STACK / PROSE SPLIT (settled with the human) ─────────────────────
 * A section is `<Stack gap="xl">` holding `<Prose>` runs and illustrations as
 * siblings — NOT one giant Prose containing the images. So text gets the owl,
 * and an illustration gets `stack/gap/xl` (32), which reads as a deliberate
 * break rather than as paragraph spacing. Under one-Prose-per-section a 675px
 * panel would sit 20px off the paragraph above it, with the same weight as a
 * paragraph break.
 *
 * ── WHAT IT WILL AND WILL NOT DESCEND INTO ───────────────────────────────
 * It recurses into plain layout frames only, and NEVER into a name containing
 * `·` (every illustration this repo builds is named `HERO-01 · …`,
 * `COLOUR-01 · …`) or starting with `⟦` (an unfilled illustration
 * placeholder), or into a component INSTANCE. Those own their internal
 * spacing; page prose does not reach inside them.
 *
 * It DOES reach card bodies (the proof-strip tiles, the four symptom cards,
 * the three path cards). That was more than intended on the first run and was
 * kept after looking at the renders: a card body is prose, and the pairs it
 * produces are exactly heading-asymmetry pairs, so `flow/tight` (12) is the
 * right answer there rather than the hand-picked 8.
 *
 * ── TWO THINGS THAT WILL BITE ────────────────────────────────────────────
 * • FIGMA NODES ARE NOT EXTENSIBLE. Stashing the wanted gap on the frame
 *   (`f.__gap = gap`) throws `TypeError: object is not extensible`. Track it
 *   in a local instead.
 * • REPARENTING DROPS FILL SIZING. Every block moved into a new wrapper needs
 *   `layoutSizingHorizontal = 'FILL'` re-asserted, wrappers included, or the
 *   text hugs and the measure collapses.
 * • DO NOT FORCE `FILL` ON A STACK ITEM. Only blocks moved into a NEW wrapper
 *   need their sizing re-asserted; a Stack item is merely reordered inside the
 *   frame it already lives in. An early version FILLed them anyway and
 *   stretched the hero `Lockup` instance — a 132x158 portrait mark — to
 *   1200x140, a 927% aspect error. Nothing errors and the layout still looks
 *   plausible; only the artwork is wrong. The check that finds it: walk every
 *   INSTANCE, compare `width/height` against its main component's, and flag
 *   any deviation over a few percent. Dividers, Buttons and code blocks
 *   legitimately deviate; aspect-locked artwork does not.
 * • A HUGGING TILE PLUS FILL CHILDREN COLLAPSES TO THE ONE INTRINSIC CHILD.
 *   Adding a 32px icon to the proof-strip tiles pulled every tile down to
 *   32px wide, because the tile hugs and every other descendant is FILL, so
 *   none of them is counted (CLAUDE.md gotcha 29). Give the tiles a definite
 *   width (FILL inside a FILL strip) before adding an intrinsic child.
 * • GROWING THE GAPS OVERFLOWS ANY FIXED-HEIGHT CARD. The three path cards
 *   were pinned to a row height and their footer link fell 19px out the
 *   bottom. After running this, re-equalise such rows: HUG every card, read
 *   the tallest, fix the row to it, then FILL the cards.
 */
const PAGES = ['2180:91840', '2183:92199'];   // Home — desktop (v3), mobile (v3)

// the four rungs, at Comfortable; the bound variable carries every other mode
const FLOW = { tight: 12, normal: 20, section: 32, region: 48 };
const FLOWVAR = { 12: 'flow/tight', 20: 'flow/normal', 32: 'flow/section', 48: 'flow/region' };
const PROSE = /^(overline|heading\/|display\/|body\/|label\/)/;

const vars = await figma.variables.getLocalVariablesAsync();
const V = {}; for (const v of vars) V[v.name] = v;

const isProse = (n) => PROSE.test(n.name);
const roleOf = (n) => {
  if (/^heading\/h[12]$|^display\//.test(n.name)) return 'h2';
  if (/^heading\/h[34]$/.test(n.name)) return 'h3';
  return 'block';
};
// the owl, as a function of the pair
const wanted = (prev, cur) => {
  const c = roleOf(cur), p = roleOf(prev);
  if (c === 'h2') return FLOW.region;
  if (c === 'h3') return FLOW.section;
  if (p === 'h2' || p === 'h3') return FLOW.tight;
  return FLOW.normal;
};

const mk = (gap) => {
  const f = figma.createFrame();
  f.name = 'flow · ' + FLOWVAR[gap].split('/')[1];
  f.fills = []; f.layoutMode = 'VERTICAL';
  f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
  f.counterAxisAlignItems = 'MIN';
  f.itemSpacing = gap; f.setBoundVariable('itemSpacing', V[FLOWVAR[gap]]);
  return f;                                  // no `f.__gap` — nodes aren't extensible
};
const fillAll = (n) => {
  for (const c of n.children || []) {
    try { c.layoutSizingHorizontal = 'FILL'; } catch (e) {}
    if (c.name.indexOf('flow · ') === 0) fillAll(c);
  }
};
const buildRun = (parent, blocks, index) => {
  if (blocks.length === 1) {
    parent.insertChild(index, blocks[0]);
    try { blocks[0].layoutSizingHorizontal = 'FILL'; } catch (e) {}
    return;
  }
  let node = blocks[blocks.length - 1], nodeGap = null;
  for (let i = blocks.length - 2; i >= 0; i--) {
    const gap = wanted(blocks[i], blocks[i + 1]);
    if (nodeGap === gap) node.insertChild(0, blocks[i]);   // same gap — keep one frame
    else { const f = mk(gap); f.appendChild(blocks[i]); f.appendChild(node); node = f; nodeGap = gap; }
  }
  parent.insertChild(index, node);
  node.layoutSizingHorizontal = 'FILL';
  fillAll(node);
};

// `isStack` marks the section's own content frame, which becomes the <Stack>
const restructure = (frame, isStack) => {
  const kids = [...frame.children];
  if (kids.filter(isProse).length < 2) return false;
  const groups = []; let run = [];
  for (const k of kids) {
    if (isProse(k)) run.push(k);
    else { if (run.length) { groups.push({ prose: run }); run = []; } groups.push({ item: k }); }
  }
  if (run.length) groups.push({ prose: run });
  if (isStack) { frame.itemSpacing = 32; frame.setBoundVariable('itemSpacing', V['stack/gap/xl']); }
  let idx = 0;
  for (const g of groups) {
    // NEVER touch a Stack item's sizing. insertChild into the SAME parent is a
    // reorder, not a reparent, so nothing is lost — and forcing FILL here
    // stretched the hero Lockup (a 132x158 portrait instance) to 1200x140.
    if (g.item) { frame.insertChild(idx, g.item); }
    else buildRun(frame, g.prose, idx);
    idx++;
  }
  return true;
};
const walk = (n, touched, depth) => {
  if (depth > 3) return;
  for (const c of [...(n.children || [])]) {
    if (c.type !== 'FRAME') continue;
    if (c.name.indexOf('·') > -1 || c.name.indexOf('⟦') === 0) continue;   // illustrations own their spacing
    if (c.layoutMode === 'VERTICAL' && restructure(c, false)) touched.push(c.name);
    walk(c, touched, depth + 1);
  }
};

const done = [];
for (const pageId of PAGES) {
  const page = await figma.getNodeByIdAsync(pageId);
  for (const sec of page.children) {
    const content = (sec.children || []).find(c => c.name === 'content');
    if (!content) continue;
    const t = [];
    if (restructure(content, true)) t.push('content');
    walk(content, t, 0);
    if (t.length) done.push({ page: page.name, section: sec.name.slice(0, 20), touched: t.length });
  }
}
return done;
