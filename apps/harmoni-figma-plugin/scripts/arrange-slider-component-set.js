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
 * EDGE_PAD = 8 so focus-ring overflow (−4 px) never clips the component-set frame.
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
 * 1. Open Figma Desktop with the Primitiv Design System file on the Slider page.
 * 2. Paste this entire script into the developer console (Plugin → Developer tools).
 * 3. Run. Re-run is safe; it deletes the existing "Slider Grid Labels" group first.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(async () => {
  const SLIDER_SET_ID = '391:4171';
  const EDGE_PAD      = 8;
  const H_CELL_W      = 200;
  const H_CELL_H      = 32;
  const V_CELL_W      = 32;
  const V_CELL_H      = 200;
  const COL_GAP       = 24;
  const ROW_GAP       = 16;
  const SECTION_GAP   = 48;

  const ORIENTATIONS = ['Horizontal', 'Vertical'];
  const VARIANTS     = ['Single', 'Range'];
  const SIZE_ORDER   = ['md', 'xs', 'sm', 'lg', 'xl'];
  const STATE_ORDER  = ['default', 'hover', 'focus', 'disabled'];

  const sliderSet = await figma.getNodeByIdAsync(SLIDER_SET_ID);
  if (!sliderSet || sliderSet.type !== 'COMPONENT_SET') {
    console.error('Slider component set not found at', SLIDER_SET_ID);
    return;
  }

  // ── Re-run safety: remove stale label group ────────────────────────────────
  const staleLabels = figma.currentPage.findOne(n => n.name === 'Slider Grid Labels');
  if (staleLabels) staleLabels.remove();

  // ── Compute section Y offsets ──────────────────────────────────────────────
  const sectionHeight = (cellH) =>
    SIZE_ORDER.length * (cellH + ROW_GAP) - ROW_GAP + SECTION_GAP;

  const sectionOffsetY = (oIdx, vIdx) => {
    let y = EDGE_PAD;
    for (let oi = 0; oi < oIdx; oi++) {
      const cellH = oi === 0 ? H_CELL_H : V_CELL_H;
      y += VARIANTS.length * sectionHeight(cellH);
    }
    const cellH = oIdx === 0 ? H_CELL_H : V_CELL_H;
    y += vIdx * sectionHeight(cellH);
    return y;
  };

  // ── Position each variant ──────────────────────────────────────────────────
  for (const comp of sliderSet.children) {
    const o  = comp.name.match(/Orientation=(\w+)/)?.[1];
    const va = comp.name.match(/Variant=(\w+)/)?.[1];
    const si = comp.name.match(/Size=(\w+)/)?.[1];
    const st = comp.name.match(/State=(\w+)/)?.[1];
    if (!o || !va || !si || !st) continue;

    const oIdx = ORIENTATIONS.indexOf(o);
    const vIdx = VARIANTS.indexOf(va);
    const sRow = SIZE_ORDER.indexOf(si);
    const sCol = STATE_ORDER.indexOf(st);
    if (oIdx < 0 || vIdx < 0 || sRow < 0 || sCol < 0) continue;

    const isH  = o === 'Horizontal';
    const cellW = isH ? H_CELL_W : V_CELL_W;
    const cellH = isH ? H_CELL_H : V_CELL_H;

    comp.x = EDGE_PAD + sCol * (cellW + COL_GAP);
    comp.y = sectionOffsetY(oIdx, vIdx) + sRow * (cellH + ROW_GAP);
  }

  // ── Resize set to fit content ──────────────────────────────────────────────
  const totalW = EDGE_PAD + STATE_ORDER.length * (H_CELL_W + COL_GAP) - COL_GAP + EDGE_PAD;
  const totalH = EDGE_PAD
    + VARIANTS.length * sectionHeight(H_CELL_H)
    + SECTION_GAP
    + VARIANTS.length * sectionHeight(V_CELL_H);
  sliderSet.resize(totalW, totalH);

  // ── Default instance: H / Single / md / default ───────────────────────────
  const defComp = sliderSet.children.find(
    c => c.name === 'Orientation=Horizontal, Variant=Single, Size=md, State=default'
  );
  if (defComp) sliderSet.insertChild(0, defComp);

  // ── Generate row/column labels ─────────────────────────────────────────────
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

  const labelNodes = [];

  const makeLabel = (text, x, y, color = { r: 0.6, g: 0.6, b: 0.6 }) => {
    const t = figma.createText();
    t.characters = text;
    t.fontSize = 10;
    t.fills = [{ type: 'SOLID', color }];
    t.x = sliderSet.x + x;
    t.y = sliderSet.y + y;
    labelNodes.push(t);
  };

  // Column headers (state labels) — once above the first H-Single section
  STATE_ORDER.forEach((state, sCol) => {
    const isH = true;
    const cellW = H_CELL_W;
    makeLabel(
      state,
      EDGE_PAD + sCol * (cellW + COL_GAP),
      EDGE_PAD - 14
    );
  });

  // Section + row labels
  ORIENTATIONS.forEach((orientation, oIdx) => {
    VARIANTS.forEach((variant, vIdx) => {
      const isH  = orientation === 'Horizontal';
      const cellH = isH ? H_CELL_H : V_CELL_H;
      const secY  = sectionOffsetY(oIdx, vIdx);
      const secLabel = `${orientation} · ${variant}`;
      makeLabel(secLabel, EDGE_PAD, secY - 16, { r: 0.3, g: 0.3, b: 0.3 });

      SIZE_ORDER.forEach((size, sRow) => {
        makeLabel(
          size,
          EDGE_PAD - 20,
          secY + sRow * (cellH + ROW_GAP) + cellH / 2 - 5
        );
      });
    });
  });

  // Group labels
  const labelGroup = figma.group(labelNodes, figma.currentPage);
  labelGroup.name = 'Slider Grid Labels';

  console.log(`Slider component set arranged: ${sliderSet.children.length} variants.`);
})();
