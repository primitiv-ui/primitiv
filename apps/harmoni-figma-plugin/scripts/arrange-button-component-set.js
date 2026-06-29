/**
 * arrange-button-component-set.js
 *
 * Positions all variants in the Button component set into the documented grid.
 * Run this after building or restructuring variants.
 *
 * Grid structure:
 *   Rows    → Size (md first, then xs sm lg xl)
 *   Columns → Variant group (primary / secondary / ghost / link / danger)
 *               × State (default / hover / active / focus / disabled)
 *
 * Density is no longer a grid dimension — it is controlled by the containing
 * frame's Context variable mode override in the design. The component set shows
 * variants at whatever density the canvas default mode resolves to (Comfortable).
 *
 * Property names and values are lowercase and match the live set exactly:
 *   Variant = primary | secondary | ghost | link | danger
 *   Size    = md | xs | sm | lg | xl
 *   State   = default | hover | active | focus | disabled
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *  1. Select the Button component set on the canvas.
 *  2. Open the developer console: Plugins → Development → Open console (⌘⌥I / Ctrl+Alt+I).
 *  3. Click in the console input, type  allow pasting  and press Enter.
 *  4. Paste this script and press Enter.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(async function () {

  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  const PROP = { size: "Size", variant: "Variant", state: "State" };

  const SIZE_ORDER    = ["md", "xs", "sm", "lg", "xl"];
  const VARIANT_ORDER = ["primary", "secondary", "ghost", "link", "danger"];
  const STATE_ORDER   = ["default", "hover", "active", "focus", "disabled"];

  const GAP_STATE   = 16;
  const GAP_VARIANT = 48;
  const GAP_SIZE    = 20;
  const EDGE_PAD    = 24;

  const componentSet = figma.currentPage.selection.find(n => n.type === "COMPONENT_SET");
  if (!componentSet) {
    console.error("Nothing selected. Select the Button component set and re-run.");
    return;
  }

  const all   = componentSet.children.filter(n => n.type === "COMPONENT");
  const valid = all.filter(c => {
    const p = c.variantProperties ?? {};
    return p[PROP.size] && p[PROP.variant] && p[PROP.state];
  });
  console.log(`Found ${valid.length} valid components in "${componentSet.name}".`);

  // Measure max dimensions
  const colMaxWidth  = {};
  const rowMaxHeight = {};
  for (const c of valid) {
    const p   = c.variantProperties;
    const col = `${p[PROP.variant]}_${p[PROP.state]}`;
    const row = p[PROP.size];
    colMaxWidth[col]  = Math.max(colMaxWidth[col]  ?? 0, c.width);
    rowMaxHeight[row] = Math.max(rowMaxHeight[row] ?? 0, c.height);
  }

  // Column x-positions
  const colX = {};
  let x = 0;
  for (let vi = 0; vi < VARIANT_ORDER.length; vi++) {
    if (vi > 0) x += GAP_VARIANT;
    for (let si = 0; si < STATE_ORDER.length; si++) {
      if (si > 0) x += GAP_STATE;
      const col = `${VARIANT_ORDER[vi]}_${STATE_ORDER[si]}`;
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
    const col = `${p[PROP.variant]}_${p[PROP.state]}`;
    const row = p[PROP.size];
    if (colX[col] !== undefined && rowY[row] !== undefined) {
      c.x = colX[col]; c.y = rowY[row]; placed++;
    } else {
      console.warn(`Could not place: ${c.name}`); skipped++;
    }
  }

  // Default instance: md / primary / default
  const defaultComp = valid.find(c => {
    const p = c.variantProperties;
    return p[PROP.size] === SIZE_ORDER[0] && p[PROP.variant] === VARIANT_ORDER[0] && p[PROP.state] === STATE_ORDER[0];
  });
  if (defaultComp) componentSet.insertChild(0, defaultComp);

  // Labels
  const existing = figma.currentPage.findOne(n => n.name === "Button Grid Labels");
  if (existing) existing.remove();

  const ABOVE_VARIANTS = 48;
  const ABOVE_STATES   = 24;
  const LEFT_SIZES     = 56;
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

  // Variant group headers + state sub-headers
  for (const variant of VARIANT_ORDER) {
    const firstCol    = `${variant}_${STATE_ORDER[0]}`;
    const lastCol     = `${variant}_${STATE_ORDER[STATE_ORDER.length - 1]}`;
    const groupLeft   = colX[firstCol] ?? 0;
    const groupRight  = (colX[lastCol] ?? 0) + (colMaxWidth[lastCol] ?? 0);
    const vl = makeLabel(variant.toUpperCase(), 0, cy - ABOVE_VARIANTS, true);
    vl.x = cx + groupLeft + (groupRight - groupLeft) / 2 - vl.width / 2;
    for (const state of STATE_ORDER) {
      const ck   = `${variant}_${state}`;
      const colW = colMaxWidth[ck] ?? 0;
      const lbl  = makeLabel(state, 0, cy - ABOVE_STATES, false);
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
  labelGroup.name  = "Button Grid Labels";

  figma.viewport.scrollAndZoomIntoView([componentSet, labelGroup]);
  console.log(`Done. Placed ${placed} components${skipped ? `, skipped ${skipped}` : ""}.`);

})().catch(err => console.error("Script error:", err.message));
