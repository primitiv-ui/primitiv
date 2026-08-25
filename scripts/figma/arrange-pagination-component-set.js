/**
 * arrange-pagination-component-set.js
 *
 * Positions the composed `Pagination` component set into the documented grid
 * and regenerates its row/column labels.
 *
 * Grid structure:
 *   Pagination
 *     Rows    → Size (xs sm md lg xl — reading order)
 *     Columns → Variant (numbered / compact)
 *
 * Note the split between *dropdown* order and *grid* order. The set is built
 * md-first, so `Size`'s variantOptions read ["md","xs","sm","lg","xl"] and
 * Figma pre-selects md — the thing Collapsible and Select could not get
 * retroactively, because `ComponentSetNode.defaultVariant` is read-only. The
 * grid below is deliberately laid out in ascending reading order instead
 * (xs → xl); child order and dropdown order are independent, so the ramp reads
 * naturally on canvas without disturbing the md-first default.
 *
 * Column widths are measured from the widest member of each column rather than
 * assumed: a `numbered` row is ~2.2× the width of its `compact` sibling, and
 * both grow with Size, so a fixed column pitch would either overlap at xl or
 * leave a canyon at xs.
 *
 * EDGE_PAD exists because the nested Button / Icon Button instances draw an
 * OUTSET focus ring (offset + width beyond the control box). At State=default
 * nothing is painted there, but the moment a designer flips a nested instance
 * to State=focus the ring would clip against the set frame without it.
 *
 * ─── The set-drift trap ──────────────────────────────────────────────────────
 * Resizing a COMPONENT_SET makes Figma re-fit the frame around its children and
 * silently move `set.x` / `set.y` (observed elsewhere: a set jumping x=100 →
 * x=3566). Labels generated afterwards would then land against a drifted
 * origin. This script captures the anchor BEFORE the resize and restores it
 * after — verified idempotent, a re-run produces zero geometry change.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *  1. Open the Pagination page.
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
  const VARIANT_ORDER = ["numbered", "compact"];

  const EDGE_PAD = 24; // room for a nested control's outset focus ring
  const PAD = 64;
  const COL_GAP = 96;
  const ROW_GAP = 48;
  const LABEL_GAP = 16;

  const set = figma.currentPage.findOne(
    (n) => n.type === "COMPONENT_SET" && n.name === "Pagination"
  );
  if (!set) {
    figma.notify("Pagination component set not found on this page");
    return;
  }

  // Capture BEFORE any resize — see the set-drift trap in the header.
  const anchorX = set.x;
  const anchorY = set.y;

  // Clear labels from a previous run so this is re-runnable.
  figma.currentPage
    .findAll((n) => n.type === "TEXT" && n.name.startsWith("label:pagination:"))
    .forEach((n) => n.remove());

  const byName = {};
  set.children.forEach((c) => {
    byName[c.name] = c;
  });
  const at = (variant, size) => byName["Variant=" + variant + ", Size=" + size];

  const missing = [];
  VARIANT_ORDER.forEach((v) =>
    SIZE_ORDER.forEach((s) => {
      if (!at(v, s)) missing.push(v + "/" + s);
    })
  );
  if (missing.length) {
    figma.notify("Missing variants: " + missing.join(", "));
    return;
  }

  // Columns are sized from their widest member, not a fixed pitch.
  const colWidth = VARIANT_ORDER.map((v) =>
    Math.max.apply(null, SIZE_ORDER.map((s) => at(v, s).width))
  );
  const colX = [];
  let cx = PAD + EDGE_PAD;
  VARIANT_ORDER.forEach((v, i) => {
    colX.push(cx);
    cx += colWidth[i] + COL_GAP;
  });

  const rowY = [];
  let cy = PAD + EDGE_PAD;
  SIZE_ORDER.forEach((s) => {
    rowY.push(cy);
    cy +=
      Math.max.apply(null, VARIANT_ORDER.map((v) => at(v, s).height)) + ROW_GAP;
  });

  SIZE_ORDER.forEach((s, ri) => {
    VARIANT_ORDER.forEach((v, ci) => {
      const node = at(v, s);
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
    t.name = "label:pagination:" + text;
    t.x = set.x + x;
    t.y = set.y + y;
    t.fills = [{ type: "SOLID", color: { r: 0.45, g: 0.47, b: 0.5 } }];
    figma.currentPage.appendChild(t);
    return t;
  }

  VARIANT_ORDER.forEach((v, ci) => {
    label(v, colX[ci], PAD + EDGE_PAD - LABEL_GAP - 18, true);
  });
  SIZE_ORDER.forEach((s, ri) => {
    label(s, PAD + EDGE_PAD - 34, rowY[ri] + 8, true);
  });

  figma.notify(
    "Pagination arranged: " +
      VARIANT_ORDER.length +
      " × " +
      SIZE_ORDER.length +
      " grid"
  );
})();
