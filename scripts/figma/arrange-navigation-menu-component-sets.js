/**
 * arrange-navigation-menu-component-sets.js
 *
 * Positions every variant of the five NavigationMenu component sets (RFC 0019)
 * into their documented grids, and regenerates the row/column label groups.
 *
 * Sets handled (all on the "Navigation Menu" page):
 *   Navigation Menu / Trigger      Size × State closed|open      × Interaction default|hover|active|focus|disabled
 *   Navigation Menu / Bar Link     Size × State inactive|active  × Interaction default|hover|focus|disabled
 *   Navigation Menu / Panel Link   Size × State inactive|active  × Interaction default|hover|focus|disabled
 *   Navigation Menu / Indicator    Size × Style arrow|underline
 *   Navigation Menu                Size × Variant closed|open
 *
 * Grid structure (all sets):
 *   Rows    → Size (md first, then xs sm lg xl)
 *   Columns → the set's grouping axis, sub-grouped by Interaction where it has one
 *
 * Density is controlled by the containing frame's Context variable mode override —
 * there is no Context dimension in any of these sets.
 *
 * Two deliberate departures from the older arrange scripts:
 *   • Labels use Khand (Medium/SemiBold), not Inter. Inter is not in the design
 *     system (see the figma-wireframe-tokens skill); the older scripts predate
 *     that rule.
 *   • The Indicator set keeps a light grey frame fill, and so does the composed
 *     set: their arrow and panel are surface-coloured (white), so on a white
 *     canvas the silhouette and its shadow are invisible. Instances are
 *     unaffected — this is canvas chrome only.
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *  1. Open the "Navigation Menu" page.
 *  2. Open the developer console: Plugins → Development → Open console (⌘⌥I).
 *  3. Click in the console input, type  allow pasting  and press Enter.
 *  4. Paste this script and press Enter.
 *  (Or run via figma_execute as-is — it looks sets up by name on the current
 *   page rather than relying on selection.)
 * ─────────────────────────────────────────────────────────────────────────────
 */
(async function () {

  await figma.loadFontAsync({ family: "Khand", style: "Medium" });
  await figma.loadFontAsync({ family: "Khand", style: "SemiBold" });

  const SIZE_ORDER = ["md", "xs", "sm", "lg", "xl"];
  const EDGE_PAD_DEFAULT = 24;

  /**
   * One entry per set. `groups` is the outer column axis, `interactions` the
   * inner one (omit for sets with a single column axis). `tint` fills the set
   * frame so surface-coloured content stays visible on canvas.
   */
  const CONFIG = [
    {
      name: "Navigation Menu / Trigger",
      groupProp: "State", groups: ["closed", "open"],
      interactionProp: "Interaction", interactions: ["default", "hover", "active", "focus", "disabled"],
      colGap: 32, rowGap: 40, edgePad: 24, labelGap: 28,
    },
    {
      name: "Navigation Menu / Bar Link",
      groupProp: "State", groups: ["inactive", "active"],
      interactionProp: "Interaction", interactions: ["default", "hover", "focus", "disabled"],
      colGap: 32, rowGap: 40, edgePad: 24, labelGap: 28,
    },
    {
      name: "Navigation Menu / Panel Link",
      groupProp: "State", groups: ["inactive", "active"],
      interactionProp: "Interaction", interactions: ["default", "hover", "focus", "disabled"],
      colGap: 32, rowGap: 40, edgePad: 24, labelGap: 28,
    },
    {
      name: "Navigation Menu / Indicator",
      groupProp: "Style", groups: ["arrow", "underline"],
      colGap: 64, rowGap: 40, edgePad: 24, labelGap: 28,
      centreInColumn: true,
      tint: { r: 0.93, g: 0.94, b: 0.95 },
    },
    {
      name: "Navigation Menu",
      groupProp: "Variant", groups: ["closed", "open"],
      colGap: 80, rowGap: 64, edgePad: 48, labelGap: 32,
      tint: { r: 0.93, g: 0.94, b: 0.95 },
    },
  ];

  const ROW_LABEL_GUTTER = 64;

  function columnKeys(cfg) {
    const keys = [];
    for (const g of cfg.groups) {
      if (cfg.interactions) for (const i of cfg.interactions) keys.push({ key: `${g}_${i}`, group: g, interaction: i });
      else keys.push({ key: g, group: g, interaction: null });
    }
    return keys;
  }

  function variantFor(set, cfg, size, col) {
    return set.children.find(c => {
      const p = c.variantProperties;
      if (!p || p.Size !== size) return false;
      if (p[cfg.groupProp] !== col.group) return false;
      if (cfg.interactionProp && p[cfg.interactionProp] !== col.interaction) return false;
      return true;
    });
  }

  let arranged = 0;

  for (const cfg of CONFIG) {
    const set = figma.currentPage.findOne(
      n => n.type === "COMPONENT_SET" && n.name === cfg.name
    );
    if (!set) { console.warn(`Set not found, skipping: ${cfg.name}`); continue; }

    // absolute positioning — these grids are hand-laid, not auto-layout
    set.layoutMode = "NONE";

    const cols = columnKeys(cfg);
    const colW = cols.map(col =>
      Math.max(0, ...SIZE_ORDER.map(s => (variantFor(set, cfg, s, col) || { width: 0 }).width)));
    const rowH = SIZE_ORDER.map(s =>
      Math.max(0, ...cols.map(col => (variantFor(set, cfg, s, col) || { height: 0 }).height)));

    const pad = cfg.edgePad ?? EDGE_PAD_DEFAULT;
    let placed = 0, missing = 0;
    let y = pad + cfg.labelGap;
    SIZE_ORDER.forEach((size, ri) => {
      let x = pad + ROW_LABEL_GUTTER;
      cols.forEach((col, ci) => {
        const c = variantFor(set, cfg, size, col);
        if (c) {
          // centreInColumn keeps narrow markers (the arrow) optically centred
          c.x = cfg.centreInColumn ? x + (colW[ci] - c.width) / 2 : x;
          c.y = y + (rowH[ri] - c.height) / 2;
          placed++;
        } else missing++;
        x += colW[ci] + cfg.colGap;
      });
      y += rowH[ri] + cfg.rowGap;
    });

    set.resizeWithoutConstraints(
      pad * 2 + ROW_LABEL_GUTTER + colW.reduce((a, b) => a + b, 0) + cfg.colGap * (cols.length - 1),
      pad * 2 + cfg.labelGap + rowH.reduce((a, b) => a + b, 0) + cfg.rowGap * (SIZE_ORDER.length - 1)
    );
    if (cfg.tint) set.fills = [{ type: "SOLID", color: cfg.tint }];

    // default instance = md + first group + first interaction (top-left cell)
    const first = cols[0];
    const def = variantFor(set, cfg, "md", first);
    if (def) set.insertChild(0, def);

    // labels — re-run safe
    const groupName = `${cfg.name} Grid Labels`;
    const old = figma.currentPage.findOne(n => n.name === groupName);
    if (old) old.remove();

    const labels = [];
    const mk = (text, x, yy, style, size) => {
      const t = figma.createText();
      t.fontName = { family: "Khand", style };
      t.characters = text;
      t.fontSize = size;
      t.fills = [{ type: "SOLID", color: { r: 0.42, g: 0.42, b: 0.42 } }];
      figma.currentPage.appendChild(t);
      t.x = set.x + x;
      t.y = set.y + yy;
      labels.push(t);
    };

    let cx = pad + ROW_LABEL_GUTTER;
    cols.forEach((col, ci) => {
      mk(col.interaction ? `${col.group} · ${col.interaction}` : col.group, cx, pad, "Medium", 12);
      cx += colW[ci] + cfg.colGap;
    });
    let ry = pad + cfg.labelGap;
    SIZE_ORDER.forEach((size, ri) => {
      mk(size, pad, ry + rowH[ri] / 2 - 8, "SemiBold", 14);
      ry += rowH[ri] + cfg.rowGap;
    });

    const group = figma.group(labels, figma.currentPage);
    group.name = groupName;

    arranged++;
    console.log(`${cfg.name}: placed ${placed}${missing ? `, ${missing} missing` : ""} (${cols.length} cols × ${SIZE_ORDER.length} rows)`);
  }

  console.log(`Done. Arranged ${arranged}/${CONFIG.length} sets.`);

})().catch(err => console.error("Script error:", err.message));
