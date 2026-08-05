/**
 * Arrange the "Split Button" component set into its documented grid.
 *
 * Grid: 9 columns (Variant x State) x 5 rows (Size, md-first).
 *
 * Run from the Figma developer console (or via figma_execute) with the
 * "Split Button" page open. Re-runnable: it only repositions existing
 * variants and rebuilds the sibling label frame.
 *
 * Two things here are load-bearing and should not be "tidied":
 *
 * 1. EDGE_PAD. Button's focus ring is a +4px OUTSET pair of frames drawn
 *    outside each half's box. Without padding at the set's edges the ring
 *    on an edge variant is clipped by the component-set bounds.
 *
 * 2. The origin variant decides the default. componentSet.defaultVariant
 *    has no setter via the plugin API, but Figma derives it from the
 *    TOP-LEFT-MOST variant by position. Keeping primary/md/closed at
 *    (EDGE_PAD, EDGE_PAD) is what makes a fresh instance come out as
 *    md/closed rather than xs/whatever-was-appended-last. This is the
 *    route past the md-first limitation recorded on the Collapsible and
 *    Select sets.
 */

const EDGE_PAD = 24;
const COL_GAP = 64;
const ROW_GAP = 56;

const SIZES = ["md", "xs", "sm", "lg", "xl"]; // md first — see note 2
const VARIANTS = ["primary", "secondary", "danger"];
const STATES = ["closed", "open", "disabled"];

const COLS = [];
for (const variant of VARIANTS) {
  for (const state of STATES) COLS.push([variant, state]);
}

const parseVariantName = (name) => {
  const out = {};
  name.split(", ").forEach((pair) => {
    const [key, value] = pair.split("=");
    out[key.toLowerCase()] = value;
  });
  return out;
};

const set = figma.currentPage.findOne(
  (n) => n.type === "COMPONENT_SET" && n.name === "Split Button",
);
if (!set) throw new Error('No "Split Button" component set on this page');

const grid = {};
for (const child of set.children) {
  const p = parseVariantName(child.name);
  grid[`${p.variant}|${p.state}|${p.size}`] = child;
}

const at = (variant, state, size) => {
  const node = grid[`${variant}|${state}|${size}`];
  if (!node) throw new Error(`Missing variant ${variant}/${state}/${size}`);
  return node;
};

// Column widths and row heights come from the content, not a fixed step:
// open variants carry a menu panel, so columns differ substantially.
const colW = COLS.map(([v, st]) =>
  Math.max(...SIZES.map((s) => at(v, st, s).width)),
);
const rowH = SIZES.map((s) =>
  Math.max(...COLS.map(([v, st]) => at(v, st, s).height)),
);

const colX = [];
let x = EDGE_PAD;
colW.forEach((w, i) => {
  colX[i] = x;
  x += w + COL_GAP;
});

const rowY = [];
let y = EDGE_PAD;
rowH.forEach((h, j) => {
  rowY[j] = y;
  y += h + ROW_GAP;
});

const setW = x - COL_GAP + EDGE_PAD;
const setH = y - ROW_GAP + EDGE_PAD;
set.resizeWithoutConstraints(setW, setH);

// Top-aligned within each row so the control rows line up regardless of
// how tall a given variant's menu panel is.
COLS.forEach(([v, st], i) =>
  SIZES.forEach((s, j) => {
    const node = at(v, st, s);
    node.x = colX[i];
    node.y = rowY[j];
  }),
);

set.x = 200;
set.y = 120;

// ---------------------------------------------------------------------------
// Labels live in a locked sibling frame, per the Icon Button convention — a
// COMPONENT_SET can only contain components, so they cannot go inside it.
// ---------------------------------------------------------------------------

async function label(chars, kind, tokenName) {
  const t = figma.createText();
  const [family, style, size, lineHeight] = {
    title: ["Khand", "SemiBold", 48, { unit: "AUTO" }],
    sub: ["Asta Sans", "Regular", 16, { unit: "PIXELS", value: 26 }],
    caps: ["Khand", "Medium", 13, { unit: "PIXELS", value: 18 }],
  }[kind];
  t.fontName = { family, style };
  t.fontSize = size;
  t.lineHeight = lineHeight;
  t.characters = chars;
  t.name = chars.slice(0, 40);
  const variable = (await figma.variables.getLocalVariablesAsync()).find(
    (v) => v.name === tokenName,
  );
  t.fills = [
    figma.variables.setBoundVariableForPaint(
      { type: "SOLID", color: { r: 0, g: 0, b: 0 } },
      "color",
      variable,
    ),
  ];
  return t;
}

await Promise.all([
  figma.loadFontAsync({ family: "Khand", style: "SemiBold" }),
  figma.loadFontAsync({ family: "Khand", style: "Medium" }),
  figma.loadFontAsync({ family: "Asta Sans", style: "Regular" }),
]);

const existing = figma.currentPage.findOne(
  (n) => n.name === "Split Button Grid Labels",
);
if (existing) {
  existing.locked = false;
  existing.remove();
}

const labels = figma.createFrame();
labels.name = "Split Button Grid Labels";
labels.x = 0;
labels.y = 0;
labels.fills = [];
labels.clipsContent = false;
labels.resize(set.x + setW + 40, set.y + setH + 40);
figma.currentPage.appendChild(labels);

for (let i = 0; i < COLS.length; i++) {
  const t = await label(`${COLS[i][0]} · ${COLS[i][1]}`, "caps", "content/primary");
  labels.appendChild(t);
  t.x = set.x + colX[i];
  t.y = set.y - 34;
}

for (let j = 0; j < SIZES.length; j++) {
  const t = await label(SIZES[j], "caps", "content/muted");
  labels.appendChild(t);
  t.x = 120;
  t.y = set.y + rowY[j] + 10;
}

const title = await label("Split Button", "title", "content/primary");
labels.appendChild(title);
title.x = 0;
title.y = -140;

const sub = await label(
  "Variant primary | secondary | danger  ·  Size xs-xl (md-first)  ·  State closed | open | disabled   —   45 variants",
  "sub",
  "content/muted",
);
labels.appendChild(sub);
sub.textAutoResize = "HEIGHT";
sub.resize(1000, sub.height);
sub.x = 0;
sub.y = -66;

labels.locked = true;

console.log(
  `Arranged ${set.children.length} variants — ${setW}x${setH}; defaultVariant = ${set.defaultVariant.name}`,
);
