/**
 * arrange-select-component-set.js
 *
 * Positions all variants in the Select component set into the documented grid.
 * Run this after building or restructuring variants.
 *
 * Grid structure:
 *   Rows    → Size (md first, then xs sm lg xl)
 *   Columns → State group (default / hover / focused / disabled / error)
 *               × Filled (false / true)
 *
 * Select has no Variant (intent) axis — it is a single visual style with no
 * action/* tokens. The major column axis is therefore State, with Filled as
 * the sub-column (false shows the muted placeholder, true shows the
 * primary-coloured selected value).
 *
 * Density is not a grid dimension — it is controlled by the containing frame's
 * Context variable mode override. The set shows variants at Compact (default).
 *
 * Property names and values match the live set exactly:
 *   Size   = md | xs | sm | lg | xl
 *   State  = default | hover | focused | disabled | error
 *   Filled = false | true
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *  1. Select the Select component set on the canvas.
 *  2. Open the developer console: Plugins → Development → Open console.
 *  3. Click in the console input, type  allow pasting  and press Enter.
 *  4. Paste this script and press Enter.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(async function () {

  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  const PROP = { size: "Size", state: "State", filled: "Filled" };

  const SIZE_ORDER   = ["md", "xs", "sm", "lg", "xl"];
  const STATE_ORDER  = ["default", "hover", "focused", "disabled", "error"];
  const FILLED_ORDER = ["false", "true"];

  const GAP_FILLED = 16;
  const GAP_STATE  = 48;
  const GAP_SIZE   = 20;
  const EDGE_PAD   = 24;

  const componentSet = figma.currentPage.selection.find(n => n.type === "COMPONENT_SET");
  if (!componentSet) {
    console.error("Nothing selected. Select the Select component set and re-run.");
    return;
  }

  const all   = componentSet.children.filter(n => n.type === "COMPONENT");
  const valid = all.filter(c => {
    const p = c.variantProperties ?? {};
    return p[PROP.size] && p[PROP.state] && p[PROP.filled] !== undefined;
  });
  console.log(`Found ${valid.length} valid components in "${componentSet.name}".`);

  // Measure max dimensions
  const colMaxWidth  = {};
  const rowMaxHeight = {};
  for (const c of valid) {
    const p   = c.variantProperties;
    const col = `${p[PROP.state]}_${p[PROP.filled]}`;
    const row = p[PROP.size];
    colMaxWidth[col]  = Math.max(colMaxWidth[col]  ?? 0, c.width);
    rowMaxHeight[row] = Math.max(rowMaxHeight[row] ?? 0, c.height);
  }

  // Column x-positions
  const colX = {};
  let x = 0;
  for (let sti = 0; sti < STATE_ORDER.length; sti++) {
    if (sti > 0) x += GAP_STATE;
    for (let fi = 0; fi < FILLED_ORDER.length; fi++) {
      if (fi > 0) x += GAP_FILLED;
      const col = `${STATE_ORDER[sti]}_${FILLED_ORDER[fi]}`;
      colX[col] = x;
      x += colMaxWidth[col] ?? 0;
    }
  }

  // Row y-positions
  const rowY = {};
  let y = 0;
  for (let si = 0; si < SIZE_ORDER.length; si++) {
    if (si > 0) y += GAP_SIZE;
    rowY[SIZE_ORDER[si]] = y;
    y += rowMaxHeight[SIZE_ORDER[si]] ?? 0;
  }

  for (const k of Object.keys(colX)) colX[k] += EDGE_PAD;
  for (const k of Object.keys(rowY)) rowY[k] += EDGE_PAD;

  componentSet.resize(x + EDGE_PAD * 2, y + EDGE_PAD * 2);

  let placed = 0, skipped = 0;
  for (const c of valid) {
    const p   = c.variantProperties;
    const col = `${p[PROP.state]}_${p[PROP.filled]}`;
    const row = p[PROP.size];
    if (colX[col] !== undefined && rowY[row] !== undefined) {
      c.x = colX[col]; c.y = rowY[row]; placed++;
    } else {
      console.warn(`Could not place: ${c.name}`); skipped++;
    }
  }

  // Default instance: md / default / false
  const defaultComp = valid.find(c => {
    const p = c.variantProperties;
    return p[PROP.size] === SIZE_ORDER[0] && p[PROP.state] === STATE_ORDER[0] && p[PROP.filled] === FILLED_ORDER[0];
  });
  if (defaultComp) componentSet.insertChild(0, defaultComp);

  // Labels
  const existing = figma.currentPage.findOne(n => n.name === "Select Grid Labels");
  if (existing) existing.remove();

  const ABOVE_STATES = 48;
  const ABOVE_FILLED = 24;
  const LEFT_SIZES   = 56;
  const cx = componentSet.x;
  const cy = componentSet.y;
  const labelNodes = [];

  function makeLabel(text, canvasX, canvasY, bold) {
    const t = figma.createText();
    t.fontName = { family: "Inter", style: bold ? "Bold" : "Regular" };
    t.fontSize = bold ? 12 : 11;
    t.characters = text;
    t.x = canvasX; t.y = canvasY;
    figma.currentPage.appendChild(t);
    labelNodes.push(t);
    return t;
  }

  // State group headers + filled sub-headers
  for (const state of STATE_ORDER) {
    const firstCol   = `${state}_${FILLED_ORDER[0]}`;
    const lastCol    = `${state}_${FILLED_ORDER[FILLED_ORDER.length - 1]}`;
    const groupLeft  = colX[firstCol] ?? 0;
    const groupRight = (colX[lastCol] ?? 0) + (colMaxWidth[lastCol] ?? 0);
    const sl = makeLabel(state.toUpperCase(), 0, cy - ABOVE_STATES, true);
    sl.x = cx + groupLeft + (groupRight - groupLeft) / 2 - sl.width / 2;
    for (const filled of FILLED_ORDER) {
      const ck   = `${state}_${filled}`;
      const colW = colMaxWidth[ck] ?? 0;
      const lbl  = makeLabel(filled === "true" ? "filled" : "empty", 0, cy - ABOVE_FILLED, false);
      lbl.x = cx + (colX[ck] ?? 0) + colW / 2 - lbl.width / 2;
    }
  }

  // Size row labels
  for (const size of SIZE_ORDER) {
    const rowMidY = (rowY[size] ?? 0) + (rowMaxHeight[size] ?? 0) / 2;
    const sl = makeLabel(size, cx - LEFT_SIZES, 0, false);
    sl.y = cy + rowMidY - sl.height / 2;
  }

  const labelGroup = figma.group(labelNodes, figma.currentPage);
  labelGroup.name  = "Select Grid Labels";

  figma.viewport.scrollAndZoomIntoView([componentSet, labelGroup]);
  console.log(`Done. Placed ${placed} components${skipped ? `, skipped ${skipped}` : ""}.`);

})().catch(err => console.error("Script error:", err.message));
