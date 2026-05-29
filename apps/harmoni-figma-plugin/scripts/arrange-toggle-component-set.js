/**
 * arrange-toggle-component-set.js
 *
 * Positions all variants in the Toggle component set into the documented grid.
 *
 * Grid structure:
 *   Rows    → Position group (standalone / start / middle / end)
 *               × Size (md first, then xs sm lg xl) within each group
 *   Columns → State group (off / on)
 *               × Interaction (default / hover / active / focus / disabled)
 *
 * Density is controlled by the containing frame's Context variable mode override.
 *
 * Property names and values match the live set exactly:
 *   Size        = md | xs | sm | lg | xl
 *   State       = off | on
 *   Interaction = default | hover | active | focus | disabled
 *   Position    = standalone | start | middle | end
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *  1. Select the Toggle component set on the canvas.
 *  2. Open the developer console: Plugins → Development → Open console (⌘⌥I).
 *  3. Click in the console input, type  allow pasting  and press Enter.
 *  4. Paste this script and press Enter.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(async function () {

  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  const PROP = { size: "Size", state: "State", interaction: "Interaction", position: "Position" };

  const POSITION_ORDER    = ["standalone", "start", "middle", "end"];
  const SIZE_ORDER        = ["md", "xs", "sm", "lg", "xl"];
  const STATE_ORDER       = ["off", "on"];
  const INTERACTION_ORDER = ["default", "hover", "active", "focus", "disabled"];

  const GAP_INTERACTION = 16;
  const GAP_STATE       = 48;
  const GAP_SIZE        = 20;
  const GAP_POSITION    = 56;  // larger gap between position groups
  const EDGE_PAD        = 24;

  const componentSet = figma.currentPage.selection.find(n => n.type === "COMPONENT_SET");
  if (!componentSet) {
    console.error("Nothing selected. Select the Toggle component set and re-run.");
    return;
  }

  const valid = componentSet.children.filter(n => n.type === "COMPONENT" && n.name.includes("Position="));
  console.log(`Found ${valid.length} valid components in "${componentSet.name}".`);

  function parseProps(name) {
    return {
      size:        name.match(/Size=(\w+)/)?.[1],
      state:       name.match(/State=(\w+)/)?.[1],
      interaction: name.match(/Interaction=(\w+)/)?.[1],
      position:    name.match(/Position=(\w+)/)?.[1],
    };
  }

  // Column widths keyed by "state_interaction"
  // Row heights keyed by "position_size"
  const colMaxWidth  = {};
  const rowMaxHeight = {};

  for (const c of valid) {
    const p   = parseProps(c.name);
    const col = `${p.state}_${p.interaction}`;
    const row = `${p.position}_${p.size}`;
    colMaxWidth[col]  = Math.max(colMaxWidth[col]  ?? 0, c.width);
    rowMaxHeight[row] = Math.max(rowMaxHeight[row] ?? 0, c.height);
  }

  // Column X positions
  const colX = {};
  let x = 0;
  for (let si = 0; si < STATE_ORDER.length; si++) {
    if (si > 0) x += GAP_STATE;
    for (let ii = 0; ii < INTERACTION_ORDER.length; ii++) {
      if (ii > 0) x += GAP_INTERACTION;
      const col = `${STATE_ORDER[si]}_${INTERACTION_ORDER[ii]}`;
      colX[col] = x;
      x += colMaxWidth[col] ?? 0;
    }
  }

  // Row Y positions (position groups with larger gap between them)
  const rowY = {};
  let y = 0;
  for (let pi = 0; pi < POSITION_ORDER.length; pi++) {
    if (pi > 0) y += GAP_POSITION;
    for (let si = 0; si < SIZE_ORDER.length; si++) {
      if (si > 0) y += GAP_SIZE;
      const row = `${POSITION_ORDER[pi]}_${SIZE_ORDER[si]}`;
      rowY[row] = y;
      y += rowMaxHeight[row] ?? 0;
    }
  }

  // Apply EDGE_PAD
  for (const k of Object.keys(colX)) colX[k] += EDGE_PAD;
  for (const k of Object.keys(rowY)) rowY[k] += EDGE_PAD;

  componentSet.resize(x + EDGE_PAD * 2, y + EDGE_PAD * 2);

  let placed = 0, skipped = 0;
  for (const c of valid) {
    const p   = parseProps(c.name);
    const col = `${p.state}_${p.interaction}`;
    const row = `${p.position}_${p.size}`;
    if (colX[col] !== undefined && rowY[row] !== undefined) {
      c.x = colX[col]; c.y = rowY[row]; placed++;
    } else {
      console.warn(`Could not place: ${c.name}`); skipped++;
    }
  }

  // Default instance: standalone / md / off / default (top-left)
  const defaultComp = valid.find(c => {
    const p = parseProps(c.name);
    return p.position === "standalone" && p.size === "md" && p.state === "off" && p.interaction === "default";
  });
  if (defaultComp) componentSet.insertChild(0, defaultComp);

  // Labels
  const existing = figma.currentPage.findOne(n => n.name === "Toggle Grid Labels");
  if (existing) existing.remove();

  const ABOVE_STATES       = 48;
  const ABOVE_INTERACTIONS = 24;
  const LEFT_SIZES         = 64;   // wider to fit position+size labels
  const cx = componentSet.x;
  const cy = componentSet.y;
  const labelNodes = [];

  function makeLabel(text, lx, ly, bold) {
    const t = figma.createText();
    t.fontName = { family: "Inter", style: bold ? "Bold" : "Regular" };
    t.fontSize = bold ? 12 : 11;
    t.characters = text;
    t.x = lx; t.y = ly;
    figma.currentPage.appendChild(t);
    labelNodes.push(t);
    return t;
  }

  // Column headers (only need to render once — same for all position groups)
  for (const state of STATE_ORDER) {
    const firstCol   = `${state}_${INTERACTION_ORDER[0]}`;
    const lastCol    = `${state}_${INTERACTION_ORDER[INTERACTION_ORDER.length - 1]}`;
    const groupLeft  = colX[firstCol] ?? 0;
    const groupRight = (colX[lastCol] ?? 0) + (colMaxWidth[lastCol] ?? 0);
    const sl = makeLabel(state.toUpperCase(), 0, cy - ABOVE_STATES, true);
    sl.x = cx + groupLeft + (groupRight - groupLeft) / 2 - sl.width / 2;
    for (const interaction of INTERACTION_ORDER) {
      const ck   = `${state}_${interaction}`;
      const colW = colMaxWidth[ck] ?? 0;
      const lbl  = makeLabel(interaction, 0, cy - ABOVE_INTERACTIONS, false);
      lbl.x = cx + (colX[ck] ?? 0) + colW / 2 - lbl.width / 2;
    }
  }

  // Row labels: "position / size"
  for (const position of POSITION_ORDER) {
    for (const size of SIZE_ORDER) {
      const row    = `${position}_${size}`;
      const rowH   = rowMaxHeight[row] ?? 0;
      const rowMid = (rowY[row] ?? 0) + rowH / 2;
      const label  = position === "standalone" ? size : `${position} / ${size}`;
      const sl = makeLabel(label, cx - LEFT_SIZES, 0, false);
      sl.y = cy + rowMid - sl.height / 2;
    }
  }

  const labelGroup = figma.group(labelNodes, figma.currentPage);
  labelGroup.name  = "Toggle Grid Labels";

  figma.viewport.scrollAndZoomIntoView([componentSet, labelGroup]);
  console.log(`Done. Placed ${placed}${skipped ? `, skipped ${skipped}` : ""}.`);

})().catch(err => console.error("Script error:", err.message));
