// Docs Site — Landing page, rough wireframe (v1)
//
// Paste into the Figma desktop developer console (Plugins → Development →
// Open console; type "allow pasting" first). Creates / refreshes the page
// "Wireframes — Docs Site (v1 — landing)" with a single desktop landing
// frame plus a reviewer-notes panel.
//
// Wireframes the two structural decisions in docs/docs-site-planning.md that
// this pass targets:
//   §1.1  the global, persistent consumption-mode switch (Headless/Styled/Figma)
//   §1.4  the top-level nav structure (the "Documentation map" section)
// and touches the adjacent decisions the docs-site-planning skill calls out
// for the landing wireframe: §1.2 (audience fork), §1.3 (Start-Here framing),
// §1.13 ("Getting this component" block), §1.17 (missing Search/Badge).
//
// Rough boxes/text only — refinement happens by hand in Figma afterwards, so
// this deliberately does not chase exact tokens/spacing. Fonts are the design
// system faces (Khand headings/labels, Asta Sans body) per figma-wireframe-tokens.
// Numbered markers ①–⑧ map to the notes panel and the planning-doc sections.
//
// Re-running is safe: the page's contents are cleared and rebuilt.

(async function () {
  if (typeof figma.loadAllPagesAsync === "function") { try { await figma.loadAllPagesAsync(); } catch (e) {} }
  await Promise.all([
    figma.loadFontAsync({ family: "Khand", style: "SemiBold" }),
    figma.loadFontAsync({ family: "Khand", style: "Medium" }),
    figma.loadFontAsync({ family: "Khand", style: "Regular" }),
    figma.loadFontAsync({ family: "Asta Sans", style: "Regular" }),
    figma.loadFontAsync({ family: "Asta Sans", style: "Medium" }),
  ]);

  const HEAD = { family: "Khand", style: "SemiBold" };
  const HEADM = { family: "Khand", style: "Medium" };
  const BODY = { family: "Asta Sans", style: "Regular" };

  const C = {
    white: "#FFFFFF", canvas: "#F2F2F2", card: "#FFFFFF", border: "#E0E0E0",
    dark: "#1E1E1E", label: "#999999", body: "#1E1E1E", sec: "#555555",
    muted: "#AAAAAA", ph: "#F8F8F8", note: "#FFF3CD", noteBorder: "#E8C766",
    noteText: "#7A5C00", chip: "#F4F4F4",
  };

  function solid(hex, a) {
    const c = { r: parseInt(hex.slice(1,3),16)/255, g: parseInt(hex.slice(3,5),16)/255, b: parseInt(hex.slice(5,7),16)/255 };
    const p = { type: "SOLID", color: c };
    if (a != null) p.opacity = a;
    return [p];
  }
  function rect(parent, x, y, w, h, fill, o = {}) {
    const r = figma.createRectangle();
    r.x = x; r.y = y; r.resize(w, h);
    r.fills = fill ? solid(fill, o.opacity) : [];
    if (o.radius != null) r.cornerRadius = o.radius;
    if (o.stroke) { r.strokes = solid(o.stroke); r.strokeWeight = o.strokeW || 1; }
    if (o.dash) r.dashPattern = o.dash;
    parent.appendChild(r);
    return r;
  }
  function text(parent, str, x, y, size, font, color, o = {}) {
    const t = figma.createText();
    t.fontName = font; t.fontSize = size; t.fills = solid(color);
    if (o.width) { t.textAutoResize = "HEIGHT"; t.resize(o.width, size); }
    if (o.lineHeight) t.lineHeight = { value: o.lineHeight, unit: "PIXELS" };
    if (o.spacing) t.letterSpacing = { value: o.spacing, unit: "PERCENT" };
    if (o.align) t.textAlignHorizontal = o.align;
    t.characters = str;
    t.x = x; t.y = y;
    parent.appendChild(t);
    return t;
  }
  function marker(parent, n, x, y) {
    const c = figma.createEllipse();
    c.x = x; c.y = y; c.resize(20, 20); c.fills = solid(C.noteBorder);
    parent.appendChild(c);
    text(parent, String(n), x, y + 3, 11, HEADM, C.dark, { width: 20, align: "CENTER" });
  }

  const PAGE_NAME = "Wireframes — Docs Site (v1 — landing)";
  let page = figma.root.children.find(p => p.name === PAGE_NAME);
  if (page) { for (const ch of [...page.children]) ch.remove(); }
  else { page = figma.createPage(); page.name = PAGE_NAME; }

  const W = 1440, H = 1820, M = 80, CW = W - M * 2, NAV = 64;

  text(page, "Docs Site — Landing page  ·  rough wireframe v1  ·  §1.4 nav structure + §1.1 mode switch", 0, -64, 22, HEAD, C.dark);

  const F = figma.createFrame();
  F.name = "Landing (desktop)"; F.x = 0; F.y = 0; F.resize(W, H);
  F.fills = solid(C.white);
  page.appendChild(F);

  // ===== TOP NAV =====
  rect(F, 0, 0, W, NAV, C.white);
  rect(F, 0, NAV - 1, W, 1, C.border);
  rect(F, M, 20, 24, 24, C.dark, { radius: 6 });
  text(F, "Primitiv", M + 34, 19, 20, HEAD, C.dark);
  text(F, "Docs", M + 118, 22, 15, HEADM, C.muted);
  const forkX = 320;
  text(F, "Design in Figma", forkX, 22, 15, HEADM, C.muted);
  text(F, "Build with code", forkX + 150, 22, 15, HEADM, C.dark);
  rect(F, forkX + 150, 46, 116, 2, C.dark);
  marker(F, 2, forkX + 268, 8);
  const rightEnd = W - M;
  const themeW = 32, themeX = rightEnd - themeW;
  const searchW = 220, searchX = themeX - 16 - searchW;
  const modeW = 280, modeX = searchX - 16 - modeW;
  rect(F, modeX, 14, modeW, 36, C.canvas, { radius: 8, stroke: C.border });
  const segW = (modeW - 4) / 3;
  rect(F, modeX + 2, 16, segW, 32, C.dark, { radius: 6 });
  text(F, "Headless", modeX + 2, 24, 13, HEADM, C.white, { width: segW, align: "CENTER" });
  text(F, "Styled", modeX + 2 + segW, 24, 13, HEADM, C.sec, { width: segW, align: "CENTER" });
  text(F, "Figma", modeX + 2 + segW * 2, 24, 13, HEADM, C.sec, { width: segW, align: "CENTER" });
  marker(F, 1, modeX + modeW / 2 - 10, -6);
  rect(F, searchX, 14, searchW, 36, C.white, { radius: 8, stroke: C.border });
  rect(F, searchX + 12, 25, 12, 12, null, { stroke: C.muted, radius: 6 });
  text(F, "Search docs…", searchX + 34, 24, 13, BODY, C.muted);
  text(F, "⌘K", searchX + searchW - 32, 24, 12, HEADM, C.muted);
  marker(F, 3, searchX + searchW / 2 - 10, -6);
  rect(F, themeX, 14, themeW, 32, C.white, { radius: 8, stroke: C.border });
  rect(F, themeX + 9, 21, 14, 14, C.dark, { radius: 7 });

  // ===== HERO =====
  let y = NAV + 56;
  text(F, "PRIMITIV · DOCUMENTATION", M, y, 13, HEADM, C.muted, { spacing: 6 });
  y += 30;
  text(F, "One design system.\nThree ways to build.", M, y, 60, HEAD, C.dark, { width: 900, lineHeight: 62 });
  y += 148;
  text(F, "Headless behaviour, an installable styling layer, or a Figma library — pick the surface that fits how you work. The same accessible components sit underneath every mode.", M, y, 18, BODY, C.sec, { width: 680, lineHeight: 27 });
  y += 92;
  rect(F, M, y, 150, 48, C.dark, { radius: 8 });
  text(F, "Start Here", M, y + 15, 15, HEAD, C.white, { width: 150, align: "CENTER" });
  rect(F, M + 166, y, 200, 48, C.white, { radius: 8, stroke: C.dark, strokeW: 1.5 });
  text(F, "Browse Components", M + 166, y + 15, 15, HEAD, C.dark, { width: 200, align: "CENTER" });
  text(F, "Read the concepts →", M + 390, y + 15, 15, HEADM, C.sec);

  // ===== MODE CARDS (§1.1 mirror / §1.3 Start-Here framing) =====
  y = 500;
  text(F, "CHOOSE YOUR PATH", M, y, 13, HEADM, C.muted, { spacing: 6 });
  marker(F, 4, M + 182, y - 4);
  y += 24;
  text(F, "How you consume Primitiv", M, y, 30, HEAD, C.dark);
  y += 56;
  const cardGap = 24, cardW = (CW - cardGap * 2) / 3, cardH = 232;
  const modes = [
    ["Headless", "Behaviour, props & a11y only. No CSS — you own the styling. Ships as an npm package.", "npm i @primitiv-ui/react", "Headless docs →"],
    ["Styled (registry)", "Headless props plus the style-layer contract & CSS variables. Copied into your app.", "primitiv add <name>", "Styled docs →"],
    ["Figma", "Spec & redline content — the design library for building in Figma, powered by Harmoni.", "Figma library", "Design in Figma →"],
  ];
  modes.forEach((m, i) => {
    const cx = M + i * (cardW + cardGap);
    rect(F, cx, y, cardW, cardH, C.card, { radius: 12, stroke: C.border });
    rect(F, cx + 24, y + 24, 40, 40, C.canvas, { radius: 8, stroke: C.border });
    text(F, m[0], cx + 24, y + 78, 22, HEAD, C.dark);
    text(F, m[1], cx + 24, y + 112, 14, BODY, C.sec, { width: cardW - 48, lineHeight: 21 });
    rect(F, cx + 24, y + cardH - 66, cardW - 48, 32, C.chip, { radius: 6, stroke: C.border });
    text(F, m[2], cx + 36, y + cardH - 58, 13, HEADM, C.dark);
    text(F, m[3], cx + 24, y + cardH - 24, 14, HEADM, C.dark);
  });

  // ===== DOCUMENTATION MAP (§1.4 top-level structure) =====
  y = 500 + 24 + 56 + cardH + 72;
  text(F, "DOCUMENTATION MAP", M, y, 13, HEADM, C.muted, { spacing: 6 });
  marker(F, 5, M + 202, y - 4);
  y += 24;
  text(F, "Everything in the docs", M, y, 30, HEAD, C.dark);
  y += 52;
  const mapH = 340;
  rect(F, M, y, CW, mapH, C.ph, { radius: 12, stroke: C.border });
  const colX = [M + 40, M + 40 + 620];
  const mapY = y;
  function tree(col, rows) {
    let ry = mapY + 36;
    rows.forEach(r => {
      const [lbl, lvl, badge] = r;
      const x = colX[col] + (lvl === 1 ? 24 : 0);
      if (lvl === 0) rect(F, colX[col], ry + 6, 8, 8, C.dark, { radius: 2 });
      text(F, lbl, x + 18, ry, lvl === 0 ? 16 : 14, lvl === 0 ? HEADM : BODY, lvl === 0 ? C.dark : C.sec);
      if (badge) {
        const bx = x + 18 + lbl.length * 8 + 12;
        rect(F, bx, ry + 1, 104, 20, C.note, { radius: 10, stroke: C.noteBorder });
        text(F, "mode-scoped", bx, ry + 3, 11, HEADM, C.noteText, { width: 104, align: "CENTER" });
        marker(F, 6, bx + 116, ry - 1);
      }
      ry += lvl === 0 ? 32 : 28;
    });
  }
  tree(0, [
    ["Start Here", 0], ["Concepts", 0],
    ["What Primitiv is", 1], ["Tokens & theming model", 1],
    ["Density & the Context system", 1], ["Composition patterns", 1],
    ["Accessibility commitments", 1], ["Components", 0, "mode-scoped"],
  ]);
  tree(1, [
    ["Registry & CLI", 0], ["Design in Figma", 0], ["Harmoni", 1],
    ["Recipes / Guides", 0], ["Changelog / Releases", 0],
  ]);

  // ===== COMPONENT-PAGE TEASER (§1.13 "Getting this component") =====
  y = y + mapH + 72;
  text(F, "ON EVERY COMPONENT PAGE", M, y, 13, HEADM, C.muted, { spacing: 6 });
  marker(F, 7, M + 244, y - 4);
  y += 24;
  text(F, "“Getting this component” block", M, y, 30, HEAD, C.dark);
  y += 52;
  const tH = 250;
  rect(F, M, y, CW, tH, C.card, { radius: 12, stroke: C.border });
  text(F, "Button", M + 32, y + 26, 26, HEAD, C.dark);
  rect(F, M + 128, y + 32, 64, 22, "#E6F4EA", { radius: 11, stroke: "#9BD3AE" });
  text(F, "Stable", M + 128, y + 35, 12, HEADM, "#2F7A45", { width: 64, align: "CENTER" });
  marker(F, 8, M + 204, y + 30);
  text(F, "Reflects the global mode switch — currently Headless:", M + 32, y + 72, 14, BODY, C.sec);
  rect(F, M + 32, y + 98, 420, 40, C.dark, { radius: 8 });
  text(F, "$  npm i @primitiv-ui/react", M + 48, y + 110, 14, HEADM, C.white);
  text(F, "import path · @primitiv-ui/react/button", M + 32, y + 150, 13, BODY, C.muted);
  text(F, "PROPS", M + 500, y + 34, 12, HEADM, C.muted, { spacing: 4 });
  ["Prop", "Type", "Default"].forEach((c, i) => text(F, c, M + 500 + i * 200, y + 60, 13, HEADM, C.dark));
  rect(F, M + 500, y + 82, CW - 500 - 32, 1, C.border);
  [["asChild", "boolean", "false"], ["variant", "\"solid\" | …", "\"solid\""], ["+ extends", "HTMLButtonElement", "—"]].forEach((r, ri) => {
    r.forEach((cell, ci) => text(F, cell, M + 500 + ci * 200, y + 96 + ri * 30, 13, ci === 0 ? HEADM : BODY, ci === 0 ? C.dark : C.sec));
  });

  // ===== FOOTER =====
  y = y + tH + 56;
  rect(F, M, y, CW, 1, C.border);
  y += 28;
  text(F, "Primitiv", M, y, 20, HEAD, C.dark);
  text(F, "Headless components · registry styling · Figma library", M, y + 30, 13, BODY, C.muted);
  const fcols = [["Docs", "Start Here", "Concepts", "Components"], ["Build", "Registry & CLI", "Recipes", "Changelog"], ["Design", "Design in Figma", "Harmoni", "GitHub"]];
  fcols.forEach((col, i) => {
    const fx = M + 700 + i * 190;
    text(F, col[0], fx, y, 13, HEADM, C.dark, { spacing: 4 });
    col.slice(1).forEach((l, li) => text(F, l, fx, y + 26 + li * 24, 13, BODY, C.sec));
  });

  // ===== NOTES PANEL =====
  const NP = figma.createFrame();
  NP.name = "Wireframe notes"; NP.x = W + 80; NP.y = 0; NP.resize(500, 520);
  NP.fills = solid(C.note); NP.cornerRadius = 12;
  NP.strokes = solid(C.noteBorder); NP.strokeWeight = 1;
  page.appendChild(NP);
  text(NP, "Wireframe notes — Landing (v1)", 28, 28, 20, HEAD, C.dark);
  text(NP, "Boxes/text only. Refine by hand in Figma next.", 28, 58, 13, BODY, C.noteText);
  const notes = [
    ["1", "Global, persistent consumption-mode switch (§1.1) — Headless / Styled / Figma. localStorage + URL param; colours every page."],
    ["2", "Audience fork (§1.2) — designer vs engineer reading path, forked at the top nav."],
    ["3", "Search / command palette (§1.17) — biggest missing component; not built yet."],
    ["4", "Three path cards mirror the mode switch + the one-paragraph Start-Here framing (§1.3)."],
    ["5", "Documentation map = the §1.4 top-level structure (Concepts children expanded)."],
    ["6", "Components section is mode-scoped — the switch lives here (§1.4)."],
    ["7", "Per-component “Getting this component” install block (§1.4 / §1.13)."],
    ["8", "Status Badge — flagged missing in §1.17 (Callout/admonition also absent)."],
  ];
  let ny = 96;
  notes.forEach(n => {
    const c = figma.createEllipse();
    c.x = 28; c.y = ny; c.resize(20, 20); c.fills = solid(C.dark); NP.appendChild(c);
    text(NP, n[0], 28, ny + 3, 11, HEADM, C.white, { width: 20, align: "CENTER" });
    text(NP, n[1], 60, ny - 1, 13, BODY, C.dark, { width: 410, lineHeight: 18 });
    ny += 50;
  });

  await figma.setCurrentPageAsync(page);
  figma.viewport.scrollAndZoomIntoView([F]);
  return { page: page.name, frame: F.id, notes: NP.id };
})().catch(e => ({ error: e.message, stack: e.stack }));
