/**
 * arrange-slider-component-set.js
 *
 * Positions all variants in the Slider component set into the documented grid.
 *
 * Grid structure:
 *   Four stacked sections: H-Single / H-Range / V-Single / V-Range
 *   Within each section:
 *     Rows    → Size (md first, then xs sm lg xl)
 *     Columns → State (default / hover / focus / disabled)
 *
 * Density is controlled by the containing frame's Context variable mode override.
 *
 * Property names and values match the live set exactly:
 *   Orientation = Horizontal | Vertical
 *   Variant     = Single | Range
 *   Size        = md | xs | sm | lg | xl
 *   State       = default | hover | focus | disabled
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *  1. Select the Slider component set on the canvas.
 *  2. Open the developer console: Plugins → Development → Open console (⌘⌥I).
 *  3. Click in the console input, type  allow pasting  and press Enter.
 *  4. Paste this script and press Enter.
 *  Re-run is safe; it deletes the existing "Slider Grid Labels" group first.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(async function () {

  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  const SECTION_ORDER = [
    { orient: "Horizontal", variant: "Single" },
    { orient: "Horizontal", variant: "Range"  },
    { orient: "Vertical",   variant: "Single" },
    { orient: "Vertical",   variant: "Range"  },
  ];
  const SIZE_ORDER  = ["md", "xs", "sm", "lg", "xl"];
  const STATE_ORDER = ["default", "hover", "focus", "disabled"];

  const GAP_STATE   = 32;   // gap between state columns within a section
  const GAP_SIZE    = 20;   // gap between size rows within a section
  const GAP_SECTION = 56;   // gap between sections
  const EDGE_PAD    = 24;   // inset so ring overflow never clips the set frame

  const componentSet = figma.currentPage.selection.find(n => n.type === "COMPONENT_SET");
  if (!componentSet) {
    console.error("Nothing selected. Select the Slider component set and re-run.");
    return;
  }

  const valid = componentSet.children.filter(n => n.type === "COMPONENT");
  console.log(`Found ${valid.length} variants in "${componentSet.name}".`);

  function parseProps(name) {
    return {
      orient:  name.match(/Orientation=(\w+)/)?.[1],
      variant: name.match(/Variant=(\w+)/)?.[1],
      size:    name.match(/Size=(\w+)/)?.[1],
      state:   name.match(/State=(\w+)/)?.[1],
    };
  }

  // ── Per-section layout: compute column widths and row heights independently ──
  // (H sliders are ~240 px wide; V sliders are ring-size wide — separate tables
  //  prevent the V sections from having giant empty columns.)

  const sectionData = SECTION_ORDER.map(({ orient, variant }) => {
    const comps = valid.filter(c => {
      const p = parseProps(c.name);
      return p.orient === orient && p.variant === variant;
    });

    const colW = {};   // state → max component width
    const rowH = {};   // size  → max component height
    for (const c of comps) {
      const p = parseProps(c.name);
      colW[p.state] = Math.max(colW[p.state] ?? 0, c.width);
      rowH[p.size]  = Math.max(rowH[p.size]  ?? 0, c.height);
    }

    // Column X positions (relative to section left)
    const colX = {};
    let x = 0;
    for (let i = 0; i < STATE_ORDER.length; i++) {
      if (i > 0) x += GAP_STATE;
      const s = STATE_ORDER[i];
      colX[s] = x;
      x += colW[s] ?? 0;
    }
    const sectionW = x;

    // Row Y positions (relative to section top)
    const rowY = {};
    let y = 0;
    for (let i = 0; i < SIZE_ORDER.length; i++) {
      if (i > 0) y += GAP_SIZE;
      const s = SIZE_ORDER[i];
      rowY[s] = y;
      y += rowH[s] ?? 0;
    }
    const sectionH = y;

    return { orient, variant, comps, colX, rowY, colW, rowH, sectionW, sectionH };
  });

  // ── Assign absolute Y offsets per section ──────────────────────────────────
  const HEADER_H  = 28;   // section header text height (reserved above each section)
  const LABEL_Y   = 20;   // state label Y offset above section content

  let globalY = 0;
  const sectionTopY = sectionData.map(sd => {
    const topY = globalY;
    globalY += HEADER_H + sd.sectionH + GAP_SECTION;
    return topY;
  });

  // Total width = widest section + 2 × EDGE_PAD + row label gutter
  const LEFT_GUTTER = 40;
  const totalW = Math.max(...sectionData.map(sd => sd.sectionW)) + EDGE_PAD + LEFT_GUTTER + EDGE_PAD;
  const totalH = globalY - GAP_SECTION + EDGE_PAD * 2;
  componentSet.resize(totalW, totalH);

  // ── Place variants ──────────────────────────────────────────────────────────
  let placed = 0, skipped = 0;
  for (let si = 0; si < sectionData.length; si++) {
    const sd   = sectionData[si];
    const secY = EDGE_PAD + sectionTopY[si] + HEADER_H;
    for (const c of sd.comps) {
      const p = parseProps(c.name);
      const cx = sd.colX[p.state];
      const cy = sd.rowY[p.size];
      if (cx !== undefined && cy !== undefined) {
        c.x = EDGE_PAD + LEFT_GUTTER + cx;
        c.y = secY + cy;
        placed++;
      } else {
        console.warn(`Could not place: ${c.name}`);
        skipped++;
      }
    }
  }

  // ── Default instance: H / Single / md / default (top-left) ────────────────
  const defaultComp = valid.find(c => {
    const p = parseProps(c.name);
    return p.orient === "Horizontal" && p.variant === "Single" && p.size === "md" && p.state === "default";
  });
  if (defaultComp) componentSet.insertChild(0, defaultComp);

  // ── Labels ─────────────────────────────────────────────────────────────────
  const stale = figma.currentPage.findOne(n => n.name === "Slider Grid Labels");
  if (stale) stale.remove();

  const cx = componentSet.x;
  const cy = componentSet.y;
  const labelNodes = [];

  function makeLabel(text, lx, ly, bold) {
    const t = figma.createText();
    t.fontName = { family: "Inter", style: bold ? "Bold" : "Regular" };
    t.fontSize = bold ? 12 : 11;
    t.characters = text;
    t.x = cx + lx;
    t.y = cy + ly;
    figma.currentPage.appendChild(t);
    labelNodes.push(t);
    return t;
  }

  for (let si = 0; si < sectionData.length; si++) {
    const sd   = sectionData[si];
    const secY = EDGE_PAD + sectionTopY[si];
    const contentX = EDGE_PAD + LEFT_GUTTER;
    const contentY = secY + HEADER_H;

    // Section header
    const headerText = `${sd.orient.toUpperCase()} / ${sd.variant.toUpperCase()}`;
    makeLabel(headerText, contentX, secY + 6, true);

    // State column labels
    for (const state of STATE_ORDER) {
      const colW = sd.colW[state] ?? 0;
      const lbl  = makeLabel(state, 0, contentY - LABEL_Y, false);
      lbl.x = cx + contentX + (sd.colX[state] ?? 0) + colW / 2 - lbl.width / 2;
    }

    // Size row labels
    for (const size of SIZE_ORDER) {
      const rH  = sd.rowH[size] ?? 0;
      const mid = contentY + (sd.rowY[size] ?? 0) + rH / 2;
      const lbl = makeLabel(size, 0, 0, false);
      lbl.x = cx + EDGE_PAD;
      lbl.y = cy + mid - lbl.height / 2;
    }
  }

  const labelGroup = figma.group(labelNodes, figma.currentPage);
  labelGroup.name  = "Slider Grid Labels";

  figma.viewport.scrollAndZoomIntoView([componentSet, labelGroup]);
  console.log(`Done. Placed ${placed}${skipped ? `, skipped ${skipped}` : ""}.`);

})().catch(err => console.error("Script error:", err.message));
