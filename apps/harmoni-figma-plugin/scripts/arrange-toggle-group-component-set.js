/**
 * arrange-toggle-group-component-set.js
 *
 * Positions all variants in the Toggle Group component set into the documented grid.
 *
 * Grid structure:
 *   Rows    → Size (md first, then xs sm lg xl)
 *   Columns → Count (2 / 3 / 4 / 5 items)
 *
 * Property names and values match the live set exactly:
 *   Count = 2 | 3 | 4 | 5
 *   Size  = md | xs | sm | lg | xl
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *  1. Select the Toggle Group component set on the canvas.
 *  2. Open the developer console: Plugins → Development → Open console (⌘⌥I).
 *  3. Click in the console input, type  allow pasting  and press Enter.
 *  4. Paste this script and press Enter.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(async function () {

  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  const COUNT_ORDER = ["2", "3", "4", "5"];
  const SIZE_ORDER  = ["md", "xs", "sm", "lg", "xl"];

  const GAP_COUNT = 48;
  const GAP_SIZE  = 20;
  const EDGE_PAD  = 24;

  const componentSet = figma.currentPage.selection.find(n => n.type === "COMPONENT_SET");
  if (!componentSet) {
    console.error("Nothing selected. Select the Toggle Group component set and re-run.");
    return;
  }

  const valid = componentSet.children.filter(n => n.type === "COMPONENT");
  console.log(`Found ${valid.length} valid components in "${componentSet.name}".`);

  function parseProps(name) {
    return {
      count: name.match(/Count=(\w+)/)?.[1],
      size:  name.match(/Size=(\w+)/)?.[1],
    };
  }

  const colMaxWidth  = {};
  const rowMaxHeight = {};
  for (const c of valid) {
    const p = parseProps(c.name);
    colMaxWidth[p.count]  = Math.max(colMaxWidth[p.count]  ?? 0, c.width);
    rowMaxHeight[p.size]  = Math.max(rowMaxHeight[p.size]  ?? 0, c.height);
  }

  const colX = {};
  let x = 0;
  for (let ci = 0; ci < COUNT_ORDER.length; ci++) {
    if (ci > 0) x += GAP_COUNT;
    colX[COUNT_ORDER[ci]] = x;
    x += colMaxWidth[COUNT_ORDER[ci]] ?? 0;
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
    const p = parseProps(c.name);
    if (colX[p.count] !== undefined && rowY[p.size] !== undefined) {
      c.x = colX[p.count]; c.y = rowY[p.size]; placed++;
    } else {
      console.warn(`Could not place: ${c.name}`); skipped++;
    }
  }

  // Default instance: Count=2 / Size=md
  const defaultComp = valid.find(c => {
    const p = parseProps(c.name);
    return p.count === "2" && p.size === "md";
  });
  if (defaultComp) componentSet.insertChild(0, defaultComp);

  // Labels
  const existing = figma.currentPage.findOne(n => n.name === "Toggle Group Grid Labels");
  if (existing) existing.remove();

  const ABOVE_COUNTS = 28;
  const LEFT_SIZES   = 40;
  const cx = componentSet.x, cy = componentSet.y;
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

  for (const count of COUNT_ORDER) {
    const colW = colMaxWidth[count] ?? 0;
    const lbl  = makeLabel(`${count} items`, 0, cy - ABOVE_COUNTS, true);
    lbl.x = cx + colX[count] + colW / 2 - lbl.width / 2;
  }

  for (const size of SIZE_ORDER) {
    const rowH   = rowMaxHeight[size] ?? 0;
    const rowMid = (rowY[size] ?? 0) + rowH / 2;
    const sl = makeLabel(size, cx - LEFT_SIZES, 0, false);
    sl.y = cy + rowMid - sl.height / 2;
  }

  const labelGroup = figma.group(labelNodes, figma.currentPage);
  labelGroup.name  = "Toggle Group Grid Labels";

  figma.viewport.scrollAndZoomIntoView([componentSet, labelGroup]);
  console.log(`Done. Placed ${placed}${skipped ? `, skipped ${skipped}` : ""}.`);

})().catch(err => console.error("Script error:", err.message));
