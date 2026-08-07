/**
 * arrange-tree-component-sets.js
 *
 * Positions the two Tree component sets added after the original three
 * (Tree/Item, Tree/Branch Control, Tree/Connector) into the documented grid,
 * and regenerates their row/column labels.
 *
 * Grid structure:
 *   Tree / Selection Path
 *     Rows    → Size (md first, then xs sm lg xl)
 *     Columns → State (filled / empty)
 *
 *   Tree  (the composed specimen)
 *     Rows    → none, a single row
 *     Columns → Size (md first, then xs sm lg xl)
 *
 * Tree is the only set on the page whose *columns* are the Size axis rather
 * than its rows: every variant is a full 14-row file tree, so stacking them
 * vertically would make the set several thousand pixels tall. Laying the
 * sizes out side by side also puts the ramp on one screen, which is the whole
 * point of a specimen.
 *
 * Neither set has a focus ring, so EDGE_PAD is not strictly required here —
 * it is kept at 24 so both sets sit on the same inner margin as Tree/Item,
 * Tree/Branch Control and Tree/Connector directly above them.
 *
 * Property names and values are lowercase and match the live sets exactly:
 *   Tree / Selection Path : Size = md | xs | sm | lg | xl
 *                           State = filled | empty
 *   Tree                  : Size = md | xs | sm | lg | xl
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *  1. Open the Tree page.
 *  2. Open the developer console: Plugins → Development → Open console (⌘⌥I / Ctrl+Alt+I).
 *  3. Click in the console input, type  allow pasting  and press Enter.
 *  4. Paste this script and press Enter.
 *
 *  Nothing needs to be selected — both sets are looked up by name.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(async function () {
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  const SIZE_ORDER = ["md", "xs", "sm", "lg", "xl"];
  const STATE_ORDER = ["filled", "empty"];

  const GAP_STATE = 48;
  const GAP_SIZE = 20;
  const EDGE_PAD = 24;

  const ABOVE_HEADER = 48;
  const ABOVE_COLS = 20;
  const LEFT_SIZES = 34;

  const page = figma.currentPage;

  function parseProps(name) {
    return {
      sz: (name.match(/Size=(\w+)/) || [])[1],
      st: (name.match(/State=(\w+)/) || [])[1],
    };
  }

  /** Shared label factory — Inter, matching the three sets above on the page. */
  function labelFactory(bucket) {
    return function makeLabel(text, x, y, bold) {
      const t = figma.createText();
      t.fontName = { family: "Inter", style: bold ? "Bold" : "Regular" };
      t.fontSize = bold ? 14 : 12;
      t.characters = text;
      t.x = x;
      t.y = y;
      page.appendChild(t);
      bucket.push(t);
      return t;
    };
  }

  // ── Tree / Selection Path ──────────────────────────────────────────────────
  {
    const set = page.findOne(
      (n) => n.type === "COMPONENT_SET" && n.name === "Tree / Selection Path",
    );
    if (!set) {
      console.warn('No "Tree / Selection Path" set on this page — skipping.');
    } else {
      // Capture the anchor BEFORE any resize. Resizing a COMPONENT_SET while
      // its children are still at their old coordinates makes Figma re-fit the
      // frame, which silently moves set.x/set.y — the labels then get generated
      // against a drifted origin. Restore the anchor after placement.
      const ax = set.x;
      const ay = set.y;

      const valid = set.children.filter((c) => {
        const p = parseProps(c.name);
        return p.sz && p.st;
      });

      const colMaxWidth = {};
      const rowMaxHeight = {};
      for (const c of valid) {
        const p = parseProps(c.name);
        colMaxWidth[p.st] = Math.max(colMaxWidth[p.st] || 0, c.width);
        rowMaxHeight[p.sz] = Math.max(rowMaxHeight[p.sz] || 0, c.height);
      }

      const colX = {};
      let x = 0;
      for (let i = 0; i < STATE_ORDER.length; i++) {
        if (i > 0) x += GAP_STATE;
        colX[STATE_ORDER[i]] = x;
        x += colMaxWidth[STATE_ORDER[i]] || 0;
      }

      const rowY = {};
      let y = 0;
      for (let i = 0; i < SIZE_ORDER.length; i++) {
        if (i > 0) y += GAP_SIZE;
        rowY[SIZE_ORDER[i]] = y;
        y += rowMaxHeight[SIZE_ORDER[i]] || 0;
      }

      for (const k of Object.keys(colX)) colX[k] += EDGE_PAD;
      for (const k of Object.keys(rowY)) rowY[k] += EDGE_PAD;

      set.resize(x + EDGE_PAD * 2, y + EDGE_PAD * 2);

      for (const c of valid) {
        const p = parseProps(c.name);
        c.x = colX[p.st];
        c.y = rowY[p.sz];
      }

      // Default instance: md / filled
      const def = valid.find((c) => {
        const p = parseProps(c.name);
        return p.sz === SIZE_ORDER[0] && p.st === STATE_ORDER[0];
      });
      if (def) set.insertChild(0, def);

      const existing = page.findOne(
        (n) => n.name === "Tree Selection Path Grid Labels",
      );
      if (existing) existing.remove();

      const nodes = [];
      const makeLabel = labelFactory(nodes);
      set.x = ax;
      set.y = ay;
      const cx = set.x;
      const cy = set.y;

      makeLabel("Tree / Selection Path", cx, cy - ABOVE_HEADER, true);

      for (const st of STATE_ORDER) {
        const w = colMaxWidth[st] || 0;
        const l = makeLabel(st, 0, cy - ABOVE_COLS, false);
        l.x = cx + (colX[st] || 0) + w / 2 - l.width / 2;
      }

      for (const sz of SIZE_ORDER) {
        const mid = (rowY[sz] || 0) + (rowMaxHeight[sz] || 0) / 2;
        const l = makeLabel(sz, 0, 0, false);
        l.x = cx - LEFT_SIZES - l.width;
        l.y = cy + mid - l.height / 2;
      }

      const group = figma.group(nodes, page);
      group.name = "Tree Selection Path Grid Labels";
      console.log(`Tree / Selection Path: placed ${valid.length} variants.`);
    }
  }

  // ── Tree (composed specimen) ───────────────────────────────────────────────
  {
    const set = page.findOne(
      (n) => n.type === "COMPONENT_SET" && n.name === "Tree",
    );
    if (!set) {
      console.warn('No "Tree" composed set on this page — skipping.');
    } else {
      // See the note above — capture the anchor before resizing.
      const ax = set.x;
      const ay = set.y;

      const valid = set.children.filter((c) => parseProps(c.name).sz);

      const colMaxWidth = {};
      let rowH = 0;
      for (const c of valid) {
        const p = parseProps(c.name);
        colMaxWidth[p.sz] = Math.max(colMaxWidth[p.sz] || 0, c.width);
        rowH = Math.max(rowH, c.height);
      }

      const colX = {};
      let x = 0;
      for (let i = 0; i < SIZE_ORDER.length; i++) {
        if (i > 0) x += GAP_STATE;
        colX[SIZE_ORDER[i]] = x;
        x += colMaxWidth[SIZE_ORDER[i]] || 0;
      }
      for (const k of Object.keys(colX)) colX[k] += EDGE_PAD;

      set.resize(x + EDGE_PAD * 2, rowH + EDGE_PAD * 2);

      for (const c of valid) {
        const p = parseProps(c.name);
        c.x = colX[p.sz];
        c.y = EDGE_PAD;
      }

      // Default instance: md
      const def = valid.find((c) => parseProps(c.name).sz === SIZE_ORDER[0]);
      if (def) set.insertChild(0, def);

      // NB: "Tree Grid Labels" is the pre-existing group labelling Tree/Item
      // and Tree/Branch Control further up the page — do not match on that
      // name here or this script deletes their labels.
      const existing = page.findOne(
        (n) => n.name === "Tree Composed Grid Labels",
      );
      if (existing) existing.remove();

      const nodes = [];
      const makeLabel = labelFactory(nodes);
      set.x = ax;
      set.y = ay;
      const cx = set.x;
      const cy = set.y;

      makeLabel("Tree — composed", cx, cy - ABOVE_HEADER, true);

      for (const sz of SIZE_ORDER) {
        const w = colMaxWidth[sz] || 0;
        const l = makeLabel(sz, 0, cy - ABOVE_COLS, false);
        l.x = cx + (colX[sz] || 0) + w / 2 - l.width / 2;
      }

      const group = figma.group(nodes, page);
      group.name = "Tree Composed Grid Labels";
      console.log(`Tree: placed ${valid.length} variants.`);
    }
  }

  // ── Tree / Connector ───────────────────────────────────────────────────────
  // Rows → Size · major columns → Style · sub-columns → Target.
  // Target=branch/leaf is only meaningful for passthrough and elbow (the two
  // styles that draw a stub); Style=rail has no stub, so its two Target
  // variants are visually identical and are laid out side by side anyway to
  // keep the grid rectangular.
  {
    const set = page.findOne(
      (n) => n.type === "COMPONENT_SET" && n.name === "Tree / Connector",
    );
    if (!set) {
      console.warn('No "Tree / Connector" set on this page — skipping.');
    } else {
      const STYLE_ORDER = ["rail", "passthrough", "elbow"];
      const TARGET_ORDER = ["branch", "leaf"];
      const GAP_TARGET = 16;

      const parse = (name) => ({
        sz: (name.match(/Size=(\w+)/) || [])[1],
        style: (name.match(/Style=(\w+)/) || [])[1],
        target: (name.match(/Target=(\w+)/) || [])[1],
      });

      // See the note above — capture the anchor before resizing.
      const ax = set.x;
      const ay = set.y;

      const valid = set.children.filter((c) => {
        const p = parse(c.name);
        return p.sz && p.style && p.target;
      });

      const colMaxWidth = {};
      const rowMaxHeight = {};
      for (const c of valid) {
        const p = parse(c.name);
        const key = `${p.style}/${p.target}`;
        colMaxWidth[key] = Math.max(colMaxWidth[key] || 0, c.width);
        rowMaxHeight[p.sz] = Math.max(rowMaxHeight[p.sz] || 0, c.height);
      }

      const colX = {};
      const groupSpan = {};
      let x = 0;
      for (let si = 0; si < STYLE_ORDER.length; si++) {
        if (si > 0) x += GAP_STATE;
        const groupStart = x;
        for (let ti = 0; ti < TARGET_ORDER.length; ti++) {
          if (ti > 0) x += GAP_TARGET;
          const key = `${STYLE_ORDER[si]}/${TARGET_ORDER[ti]}`;
          colX[key] = x;
          x += colMaxWidth[key] || 0;
        }
        groupSpan[STYLE_ORDER[si]] = { start: groupStart, end: x };
      }

      const rowY = {};
      let y = 0;
      for (let i = 0; i < SIZE_ORDER.length; i++) {
        if (i > 0) y += GAP_SIZE;
        rowY[SIZE_ORDER[i]] = y;
        y += rowMaxHeight[SIZE_ORDER[i]] || 0;
      }

      for (const k of Object.keys(colX)) colX[k] += EDGE_PAD;
      for (const k of Object.keys(groupSpan)) {
        groupSpan[k].start += EDGE_PAD;
        groupSpan[k].end += EDGE_PAD;
      }
      for (const k of Object.keys(rowY)) rowY[k] += EDGE_PAD;

      set.resize(x + EDGE_PAD * 2, y + EDGE_PAD * 2);

      for (const c of valid) {
        const p = parse(c.name);
        c.x = colX[`${p.style}/${p.target}`];
        c.y = rowY[p.sz];
      }

      const existing = page.findOne(
        (n) => n.name === "Tree Connector Grid Labels",
      );
      if (existing) existing.remove();

      const nodes = [];
      const makeLabel = labelFactory(nodes);
      set.x = ax;
      set.y = ay;
      const cx = set.x;
      const cy = set.y;

      makeLabel("Tree / Connector", cx, cy - ABOVE_HEADER - 24, true);

      for (const style of STYLE_ORDER) {
        const g = groupSpan[style];
        const l = makeLabel(style, 0, cy - ABOVE_HEADER, true);
        l.x = cx + g.start + (g.end - g.start) / 2 - l.width / 2;
      }
      for (const style of STYLE_ORDER) {
        for (const target of TARGET_ORDER) {
          const key = `${style}/${target}`;
          const w = colMaxWidth[key] || 0;
          const l = makeLabel(target, 0, cy - ABOVE_COLS, false);
          l.x = cx + (colX[key] || 0) + w / 2 - l.width / 2;
        }
      }
      for (const sz of SIZE_ORDER) {
        const mid = (rowY[sz] || 0) + (rowMaxHeight[sz] || 0) / 2;
        const l = makeLabel(sz, 0, 0, false);
        l.x = cx - LEFT_SIZES - l.width;
        l.y = cy + mid - l.height / 2;
      }

      const group = figma.group(nodes, page);
      group.name = "Tree Connector Grid Labels";
      console.log(`Tree / Connector: placed ${valid.length} variants.`);
    }
  }

  console.log("Done.");
})().catch((err) => console.error("Script error:", err.message));
