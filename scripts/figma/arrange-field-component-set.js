/**
 * arrange-field-component-set.js
 *
 * Positions all variants in the Field component set into the documented grid.
 * Run this after building or restructuring variants.
 *
 * Grid structure:
 *   Rows    → Size (md first, then xs sm lg xl)
 *   Columns → State (default / invalid / disabled)
 *
 * Field is a vertical composition (label + nested Input + helper text), not a
 * framed control. It has no Filled / interaction sub-axis — State is the only
 * column dimension. Density is controlled by the containing frame's Context
 * variable mode override, not a grid dimension.
 *
 * Property names and values are lowercase and match the live set exactly:
 *   Size  = md | xs | sm | lg | xl
 *   State = default | invalid | disabled
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *  1. Select the Field component set on the canvas.
 *  2. Open the developer console: Plugins → Development → Open console (⌘⌥I / Ctrl+Alt+I).
 *  3. Click in the console input, type  allow pasting  and press Enter.
 *  4. Paste this script and press Enter.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(async function () {

  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  const PROP = { size: "Size", state: "State" };

  const SIZE_ORDER  = ["md", "xs", "sm", "lg", "xl"];
  const STATE_ORDER = ["default", "invalid", "disabled"];

  const GAP_STATE = 48;
  const GAP_SIZE  = 32;
  const EDGE_PAD  = 24;

  const componentSet = figma.currentPage.selection.find(n => n.type === "COMPONENT_SET");
  if (!componentSet) {
    console.error("Nothing selected. Select the Field component set and re-run.");
    return;
  }

  const valid = componentSet.children.filter(c => {
    const p = c.variantProperties ?? {};
    return p[PROP.size] && p[PROP.state];
  });
  console.log(`Found ${valid.length} valid components in "${componentSet.name}".`);

  const colMaxWidth  = {};
  const rowMaxHeight = {};
  for (const c of valid) {
    const p = c.variantProperties;
    colMaxWidth[p[PROP.state]]  = Math.max(colMaxWidth[p[PROP.state]]  ?? 0, c.width);
    rowMaxHeight[p[PROP.size]]  = Math.max(rowMaxHeight[p[PROP.size]]  ?? 0, c.height);
  }

  const colX = {};
  let x = 0;
  for (let si = 0; si < STATE_ORDER.length; si++) {
    if (si > 0) x += GAP_STATE;
    colX[STATE_ORDER[si]] = x;
    x += colMaxWidth[STATE_ORDER[si]] ?? 0;
  }

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
    const p = c.variantProperties;
    if (colX[p[PROP.state]] !== undefined && rowY[p[PROP.size]] !== undefined) {
      c.x = colX[p[PROP.state]]; c.y = rowY[p[PROP.size]]; placed++;
    } else { console.warn(`Could not place: ${c.name}`); skipped++; }
  }

  // Default instance: md / default
  const defaultComp = valid.find(c => {
    const p = c.variantProperties;
    return p[PROP.size] === SIZE_ORDER[0] && p[PROP.state] === STATE_ORDER[0];
  });
  if (defaultComp) componentSet.insertChild(0, defaultComp);

  // Labels
  const existing = figma.currentPage.findOne(n => n.name === "Field Grid Labels");
  if (existing) existing.remove();

  const ABOVE_STATES = 24;
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

  for (const state of STATE_ORDER) {
    const colW = colMaxWidth[state] ?? 0;
    const lbl  = makeLabel(state.toUpperCase(), 0, cy - ABOVE_STATES, true);
    lbl.x = cx + (colX[state] ?? 0) + colW / 2 - lbl.width / 2;
  }

  for (const size of SIZE_ORDER) {
    const rowMidY = (rowY[size] ?? 0) + (rowMaxHeight[size] ?? 0) / 2;
    const sl = makeLabel(size, cx - LEFT_SIZES, 0, false);
    sl.y = cy + rowMidY - sl.height / 2;
  }

  const labelGroup = figma.group(labelNodes, figma.currentPage);
  labelGroup.name  = "Field Grid Labels";

  figma.viewport.scrollAndZoomIntoView([componentSet, labelGroup]);
  console.log(`Done. Placed ${placed} components${skipped ? `, skipped ${skipped}` : ""}.`);

})().catch(err => console.error("Script error:", err.message));
