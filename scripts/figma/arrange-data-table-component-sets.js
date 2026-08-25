/**
 * Arrange the Data Table component sets into labelled Size x variant grids.
 *
 * Paste into the Figma developer console (allow pasting first) with the
 * "Data Table" page open, or run via figma_execute.
 *
 * Covers the six sets built for RFC 0021's Data Table composite:
 *   Data Table (composed)      Size x Expanded
 *   Data Table / Header Row    Size
 *   Data Table / Row           Size x (State . Expanded)
 *   Data Table / Detail Row    Size
 *   Data Table / Toolbar       Size
 *   Data Table / Footer        Size
 *
 * Two things this script is careful about, both learned the hard way:
 *
 *  1. Resizing a COMPONENT_SET makes Figma re-fit the frame and silently move
 *     set.x / set.y (observed elsewhere as a set jumping x=100 -> x=3566), so
 *     the intended origin is captured BEFORE the resize and restored after —
 *     otherwise the labels generated next land against a drifted origin.
 *     Same precaution as arrange-tree-component-sets.js.
 *
 *  2. Text nodes created by script default to textAutoResize "NONE" with
 *     whatever height resize() left, which makes any later overlap audit
 *     meaningless. Every label here is WIDTH_AND_HEIGHT.
 *
 * Idempotent: re-running deletes the previous "<name> Grid Labels" groups and
 * regenerates them, and repositioning is absolute rather than relative, so a
 * second run produces zero net geometry change.
 */

const GAP = 48; // between variants
const EDGE = 24; // set padding — also keeps focus rings off the set edge
const SET_GAP = 200; // between sets
const LABEL_GUTTER = 140; // room for the Size labels at the left

const SPEC = [
  { name: "Data Table", rowAxis: "Size", colAxis: "Expanded" },
  { name: "Data Table / Header Row", rowAxis: "Size", colAxis: null },
  { name: "Data Table / Row", rowAxis: "Size", colAxis: ["State", "Expanded"] },
  { name: "Data Table / Detail Row", rowAxis: "Size", colAxis: null },
  { name: "Data Table / Toolbar", rowAxis: "Size", colAxis: null },
  { name: "Data Table / Footer", rowAxis: "Size", colAxis: null },
];

const INK = { r: 0.09, g: 0.09, b: 0.11 };
const MUTE = { r: 0.42, g: 0.44, b: 0.48 };
const SEMIBOLD = { family: "Asta Sans", style: "SemiBold" };
const REGULAR = { family: "Asta Sans", style: "Regular" };

const axisValue = (name, axis) => {
  const m = new RegExp("(^|, )" + axis + "=([^,]+)").exec(name);
  return m ? m[2] : "";
};

async function arrange() {
  await figma.loadFontAsync(SEMIBOLD);
  await figma.loadFontAsync(REGULAR);

  const page = figma.currentPage;
  await page.loadAsync();

  const label = (chars, size, bold, colour) => {
    const t = figma.createText();
    t.fontName = bold ? SEMIBOLD : REGULAR;
    t.fontSize = size;
    t.characters = chars;
    t.textAutoResize = "WIDTH_AND_HEIGHT";
    t.fills = [{ type: "SOLID", color: colour || INK }];
    return t;
  };

  // Clear previous label groups so a re-run does not stack duplicates.
  for (const node of [...page.children]) {
    if (node.type === "GROUP" && /Grid Labels$/.test(node.name)) node.remove();
  }

  const report = [];
  let cursorY = 0;

  for (const spec of SPEC) {
    const set = page.children.find(
      (n) => n.type === "COMPONENT_SET" && n.name === spec.name,
    );
    if (!set) {
      report.push({ name: spec.name, skipped: "not found on this page" });
      continue;
    }

    const rowKeys = set.variantGroupProperties[spec.rowAxis].values.slice();
    const colAxes = spec.colAxis
      ? Array.isArray(spec.colAxis)
        ? spec.colAxis
        : [spec.colAxis]
      : [];

    // Cartesian product of the column axes, in the order Figma reports them.
    const colKeys =
      colAxes.length === 0
        ? [""]
        : colAxes
            .reduce((acc, ax) => {
              const vals = set.variantGroupProperties[ax].values;
              return acc.length === 0
                ? vals.map((v) => [v])
                : acc.flatMap((a) => vals.map((v) => a.concat(v)));
            }, [])
            .map((a) => a.join(" · "));

    const cellW = Math.max(...set.children.map((c) => c.width));

    // Per-ROW height, not one global max: every set here genuinely grows with
    // Size (a Row runs 40/44/48/56/60, a bar 48/56/64/72/80), so a single max
    // would leave a large dead gap under every row but xl.
    const rowH = {};
    for (const rk of rowKeys) {
      rowH[rk] = Math.max(
        ...set.children
          .filter((c) => axisValue(c.name, spec.rowAxis) === rk)
          .map((c) => c.height),
      );
    }
    const yOf = {};
    let acc = EDGE;
    for (const rk of rowKeys) {
      yOf[rk] = acc;
      acc += rowH[rk] + GAP;
    }

    // (1) Capture the origin before touching geometry.
    const anchor = { x: 0 + LABEL_GUTTER, y: cursorY };

    for (const v of set.children) {
      const rk = axisValue(v.name, spec.rowAxis);
      const ci =
        colAxes.length === 0
          ? 0
          : colKeys.indexOf(colAxes.map((ax) => axisValue(v.name, ax)).join(" · "));
      if (!(rk in yOf) || ci < 0) continue;
      v.x = EDGE + ci * (cellW + GAP);
      v.y = yOf[rk];
    }

    set.resizeWithoutConstraints(
      EDGE * 2 + colKeys.length * cellW + (colKeys.length - 1) * GAP,
      acc - GAP + EDGE,
    );

    // (1) Restore it: the resize above may have moved the set.
    set.x = anchor.x;
    set.y = anchor.y;

    const labels = [];
    const title = label(spec.name, 28, true);
    page.appendChild(title);
    title.x = set.x;
    title.y = set.y - title.height - 24;
    labels.push(title);

    for (const rk of rowKeys) {
      const l = label(rk, 14, true, MUTE);
      page.appendChild(l);
      l.x = set.x - LABEL_GUTTER + 40;
      l.y = set.y + yOf[rk] + rowH[rk] / 2 - l.height / 2;
      labels.push(l);
    }

    if (colKeys[0] !== "") {
      for (let ci = 0; ci < colKeys.length; ci++) {
        const l = label(colKeys[ci], 13, false, MUTE);
        page.appendChild(l);
        l.x = set.x + EDGE + ci * (cellW + GAP);
        l.y = set.y - l.height - 6;
        labels.push(l);
      }
    }

    const group = figma.group(labels, page);
    group.name = spec.name + " Grid Labels";

    cursorY = set.y + set.height + SET_GAP;
    report.push({
      name: spec.name,
      x: Math.round(set.x),
      y: Math.round(set.y),
      w: Math.round(set.width),
      h: Math.round(set.height),
      grid: rowKeys.length + " x " + colKeys.length,
      rowHeights: rowKeys.map((rk) => rk + "=" + Math.round(rowH[rk])).join(" "),
    });
  }

  return report;
}

arrange();
