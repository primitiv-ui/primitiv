/**
 * arrange-stepper-component-sets.js
 *
 * Positions the `Stepper / Step` component set into the documented grid and
 * regenerates its row/column labels.
 *
 * Grid structure:
 *   Stepper / Step
 *     Rows    → Size (xs sm md lg xl — reading order)
 *     Columns → State (upcoming current complete error disabled),
 *               sub-grouped by Orientation (below | beside)
 *
 * Note the split between *dropdown* order and *grid* order. The set is built
 * md-first, so `Size`'s variantOptions read ["md","xs","sm","lg","xl"] and
 * Figma pre-selects md — the thing Collapsible and Select could not get
 * retroactively, because `ComponentSetNode.defaultVariant` is read-only. The
 * grid below is laid out in ascending reading order instead (xs → xl); child
 * order and dropdown order are independent, so the ramp reads naturally on
 * canvas without disturbing the md-first default.
 *
 * Column widths are measured from the widest member of each column rather than
 * assumed: a `beside` step is far wider than its `below` sibling (the label
 * sits next to the marker rather than under it), and both grow with Size, so a
 * fixed column pitch would overlap at xl and leave a canyon at xs.
 *
 * EDGE_PAD exists because the marker draws an OUTSET focus ring (the canonical
 * two-frame anatomy at -2 / -4 px). At `Focus ring = false` nothing is painted
 * there, but the moment a designer flips the boolean the ring would clip
 * against the set frame without it.
 *
 * ─── The set-drift trap ──────────────────────────────────────────────────────
 * Resizing a COMPONENT_SET makes Figma re-fit the frame around its children and
 * silently move `set.x` / `set.y` (observed on Tree: a set jumping x=100 →
 * x=3566). Labels generated afterwards would then land against a drifted
 * origin. This script captures the anchor BEFORE the resize and restores it
 * after — verified idempotent, a re-run produces zero geometry change.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *  1. Open the Stepper page.
 *  2. Open the developer console: Plugins → Development → Open console (⌘⌥I / Ctrl+Alt+I).
 *  3. Click in the console input, type  allow pasting  and press Enter.
 *  4. Paste this script and press Enter.
 *
 *  Nothing needs to be selected — the set is looked up by name.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(async function () {
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  // Grid reading order (ascending). NOT the dropdown order — see the header.
  const SIZE_ORDER = ["xs", "sm", "md", "lg", "xl"];
  const STATE_ORDER = ["upcoming", "current", "complete", "error", "disabled"];
  const ORIENTATION_ORDER = ["below", "beside"];

  const EDGE_PAD = 24; // room for the marker's outset focus ring
  const PAD = 64;
  const COL_GAP = 72;
  const GROUP_GAP = 160; // between the `below` block and the `beside` block
  const ROW_GAP = 56;
  const LABEL_GAP = 16;

  const set = figma.currentPage.findOne(
    (n) => n.type === "COMPONENT_SET" && n.name === "Stepper / Step"
  );
  if (!set) {
    figma.notify("Stepper / Step component set not found on this page");
    return;
  }

  // Capture BEFORE any resize — see the set-drift trap in the header.
  const anchorX = set.x;
  const anchorY = set.y;

  // Clear labels from a previous run so this is re-runnable.
  figma.currentPage
    .findAll((n) => n.type === "TEXT" && n.name.startsWith("label:stepper:"))
    .forEach((n) => n.remove());

  const byName = {};
  set.children.forEach((c) => {
    byName[c.name] = c;
  });
  const at = (o, st, s) =>
    byName["Orientation=" + o + ", State=" + st + ", Size=" + s];

  const missing = [];
  ORIENTATION_ORDER.forEach((o) =>
    STATE_ORDER.forEach((st) =>
      SIZE_ORDER.forEach((s) => {
        if (!at(o, st, s)) missing.push(o + "/" + st + "/" + s);
      })
    )
  );
  if (missing.length) {
    figma.notify("Missing variants: " + missing.slice(0, 6).join(", "));
    return;
  }

  // Flatten to columns: [below × 5 states, beside × 5 states].
  const columns = [];
  ORIENTATION_ORDER.forEach((o) =>
    STATE_ORDER.forEach((st) => columns.push({ o, st }))
  );

  // Columns are sized from their widest member, not a fixed pitch.
  const colWidth = columns.map((c) =>
    Math.max.apply(
      null,
      SIZE_ORDER.map((s) => at(c.o, c.st, s).width)
    )
  );

  const colX = [];
  let cx = PAD + EDGE_PAD;
  columns.forEach((c, i) => {
    // extra breathing room where the orientation block changes
    if (i > 0 && c.o !== columns[i - 1].o) cx += GROUP_GAP - COL_GAP;
    colX.push(cx);
    cx += colWidth[i] + COL_GAP;
  });

  const rowY = [];
  let cy = PAD + EDGE_PAD;
  SIZE_ORDER.forEach((s) => {
    rowY.push(cy);
    cy +=
      Math.max.apply(
        null,
        columns.map((c) => at(c.o, c.st, s).height)
      ) + ROW_GAP;
  });

  SIZE_ORDER.forEach((s, ri) => {
    columns.forEach((c, ci) => {
      const node = at(c.o, c.st, s);
      node.x = colX[ci];
      node.y = rowY[ri];
    });
  });

  set.resizeWithoutConstraints(
    cx - COL_GAP + PAD + EDGE_PAD,
    cy - ROW_GAP + PAD + EDGE_PAD
  );
  set.x = anchorX;
  set.y = anchorY;

  function label(text, x, y, bold) {
    const t = figma.createText();
    t.fontName = { family: "Inter", style: bold ? "Bold" : "Regular" };
    t.fontSize = bold ? 14 : 12;
    t.characters = text;
    // Script-made text defaults to textAutoResize NONE with whatever height
    // resize() left, which makes any overlap audit meaningless.
    t.textAutoResize = "WIDTH_AND_HEIGHT";
    t.name = "label:stepper:" + text;
    t.x = set.x + x;
    t.y = set.y + y;
    t.fills = [{ type: "SOLID", color: { r: 0.45, g: 0.47, b: 0.5 } }];
    figma.currentPage.appendChild(t);
    return t;
  }

  // Orientation headers sit above the state labels of their first column.
  ORIENTATION_ORDER.forEach((o) => {
    const first = columns.findIndex((c) => c.o === o);
    label(
      "Orientation = " + o,
      colX[first],
      PAD + EDGE_PAD - LABEL_GAP - 44,
      true
    );
  });
  columns.forEach((c, ci) => {
    label(c.st, colX[ci], PAD + EDGE_PAD - LABEL_GAP - 18, false);
  });
  SIZE_ORDER.forEach((s, ri) => {
    label(s, PAD + EDGE_PAD - 34, rowY[ri] + 8, true);
  });

  figma.notify(
    "Stepper / Step arranged: " +
      columns.length +
      " × " +
      SIZE_ORDER.length +
      " grid"
  );
})();
