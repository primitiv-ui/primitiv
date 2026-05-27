/**
 * arrange-button-component-set.js
 *
 * Positions all variants in the Button component set into the documented grid.
 * Run this once, after all 300 variants are built.
 *
 * Grid structure:
 *   Rows    → Density section (Compact / Comfortable / Spacious)
 *               × Size row (md first, then xs sm lg xl)
 *   Columns → Variant group (Primary / Secondary / Link / Danger)
 *               × State (Default / Hover / Active / Focus / Disabled)
 *
 * md is placed first in each density section so that Compact + md + Primary + Default
 * lands at the top-left — Figma picks the top-left component as the default instance.
 *
 * Icon slots (leading + trailing) are boolean properties within each component,
 * not a grid dimension, so they do not affect positioning.
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *  1. Select the Button component set on the canvas.
 *  2. Open the developer console: Plugins → Development → Open console (⌘⌥I / Ctrl+Alt+I).
 *  3. Click in the console input, type  allow pasting  and press Enter.
 *  4. Paste this script and press Enter.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(async function () {

  // ─── Property names ───────────────────────────────────────────────────────
  // These must match the exact property names defined in your Figma component set.
  const PROP = {
    density: "Density",
    size:    "Size",
    variant: "Variant",
    state:   "State",
  };

  // ─── Value ordering ───────────────────────────────────────────────────────
  // Controls the visual sequence of rows and columns.
  // md is SIZE_ORDER[0] so it occupies the top row of every density section.
  const DENSITY_ORDER = ["Compact",  "Comfortable", "Spacious"];
  const SIZE_ORDER    = ["md", "xs", "sm", "lg", "xl"];
  const VARIANT_ORDER = ["Primary",  "Secondary",   "Link",    "Danger"];
  const STATE_ORDER   = ["Default",  "Hover",       "Active",  "Focus", "Disabled"];

  // ─── Gaps (px) ────────────────────────────────────────────────────────────
  const GAP_STATE   =  8;   // between state columns within a variant group
  const GAP_VARIANT = 32;   // between variant column groups
  const GAP_SIZE    = 12;   // between size rows within a density section
  const GAP_DENSITY = 64;   // between density sections

  // ─── Find the component set ───────────────────────────────────────────────
  const componentSet = figma.currentPage.selection
    .find(n => n.type === "COMPONENT_SET");

  if (!componentSet) {
    console.error("Nothing selected. Select the Button component set and re-run.");
    return;
  }

  const all = componentSet.children.filter(n => n.type === "COMPONENT");
  console.log(`Found ${all.length} components in "${componentSet.name}".`);

  // ─── Validate properties ──────────────────────────────────────────────────
  const invalid = all.filter(c => {
    const p = c.variantProperties ?? {};
    return !p[PROP.density] || !p[PROP.size] || !p[PROP.variant] || !p[PROP.state];
  });

  if (invalid.length) {
    console.warn(`${invalid.length} component(s) are missing expected properties and will be skipped:`);
    invalid.forEach(c => console.warn("  skipped:", c.name, JSON.stringify(c.variantProperties)));
  }

  const valid = all.filter(c => {
    const p = c.variantProperties ?? {};
    return p[PROP.density] && p[PROP.size] && p[PROP.variant] && p[PROP.state];
  });

  // ─── Measure maximum dimensions ───────────────────────────────────────────
  // colMaxWidth  keyed by "Variant_State"  — max width  across all densities and sizes
  // rowMaxHeight keyed by "Density_Size"   — max height across all variants and states
  //
  // Using the maximum ensures every column is wide enough for the largest button
  // at that variant/state (typically xl), and every row is tall enough for the
  // tallest button at that density/size.
  const colMaxWidth  = {};
  const rowMaxHeight = {};

  for (const c of valid) {
    const p   = c.variantProperties;
    const col = `${p[PROP.variant]}_${p[PROP.state]}`;
    const row = `${p[PROP.density]}_${p[PROP.size]}`;
    colMaxWidth[col]  = Math.max(colMaxWidth[col]  ?? 0, c.width);
    rowMaxHeight[row] = Math.max(rowMaxHeight[row] ?? 0, c.height);
  }

  // ─── Calculate column x-positions ─────────────────────────────────────────
  // Walk left → right: Primary(5 states) | gap | Secondary(5 states) | gap | …
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

  // ─── Calculate row y-positions ────────────────────────────────────────────
  // Walk top → bottom: Compact(md xs sm lg xl) | gap | Comfortable(…) | gap | Spacious(…)
  const rowY = {};
  let y = 0;

  for (let di = 0; di < DENSITY_ORDER.length; di++) {
    if (di > 0) y += GAP_DENSITY;
    for (let si = 0; si < SIZE_ORDER.length; si++) {
      if (si > 0) y += GAP_SIZE;
      const row = `${DENSITY_ORDER[di]}_${SIZE_ORDER[si]}`;
      rowY[row] = y;
      y += rowMaxHeight[row] ?? 0;
    }
  }

  // ─── Resize the component set frame first ────────────────────────────────
  // x = right edge of the last column (total width needed).
  // y = bottom edge of the last row   (total height needed).
  // Expanding the frame before repositioning ensures no component is ever moved
  // to a coordinate outside the container bounds mid-operation.
  componentSet.resize(x, y);

  // ─── Position every component ─────────────────────────────────────────────
  // colMaxWidth guarantees every column is wide enough for the widest component
  // in that variant+state pair (across all densities and sizes), so no component
  // overflows into the next column. rowMaxHeight gives the same guarantee per row.
  let placed  = 0;
  let skipped = 0;

  for (const c of valid) {
    const p   = c.variantProperties;
    const col = `${p[PROP.variant]}_${p[PROP.state]}`;
    const row = `${p[PROP.density]}_${p[PROP.size]}`;

    if (colX[col] !== undefined && rowY[row] !== undefined) {
      c.x = colX[col];
      c.y = rowY[row];
      placed++;
    } else {
      console.warn(`Could not place: ${c.name} (col="${col}", row="${row}")`);
      skipped++;
    }
  }

  // ─── Zoom to result ───────────────────────────────────────────────────────
  figma.viewport.scrollAndZoomIntoView([componentSet]);

  console.log(`Done. Placed ${placed} components${skipped ? `, skipped ${skipped}` : ""}.`);
  console.log(`Component set resized to ${Math.round(x)} × ${Math.round(y)} px.`);

})().catch(err => console.error("Script error:", err.message));
