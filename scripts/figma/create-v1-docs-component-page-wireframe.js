// Docs Site — Component page (Button), rough wireframe (v1)
//
// Paste into the Figma desktop developer console (Plugins → Development →
// Open console; type "allow pasting" first). Creates / refreshes the page
// "Wireframes — Docs Site (v1 — component page)" with:
//   • "Component page — Button (desktop)" — 1440-wide, full docs shell
//     (sidebar §1.4 nav + content + on-this-page TOC)
//   • "Component page — Button (mobile)"  — 390-wide, stacked
//   • "Component page notes"               — reviewer notes
//
// POC of the generated docs-data pipeline (docs/docs-site-planning.md §1.5–1.8):
// the props table, types, defaults, `extends` note and CSS-variable list are
// laid out FROM generated data, not hand-typed. The `D` object below is a
// snapshot of scripts/docs-data/button.docs.json, produced by
//   node scripts/docs-data/extract-docs-data.mjs button
// (TS compiler API over packages/react for the headless half — applying the
// §1.14 propFilter so native DOM attributes drop out — merged with
// registry/components/button/contract.json for the styled half). Regenerate
// that file and re-sync D when the source changes; a real docs build would
// import the JSON directly at build time.
//
// Rough boxes/text; design-system fonts (Khand headings/labels, Asta Sans
// body). Numbered markers ①–⑨ map to the notes panel.

return (async function () {
  if (typeof figma.loadAllPagesAsync === "function") { try { await figma.loadAllPagesAsync(); } catch (e) {} }
  await Promise.all([
    figma.loadFontAsync({ family: "Khand", style: "SemiBold" }),
    figma.loadFontAsync({ family: "Khand", style: "Medium" }),
    figma.loadFontAsync({ family: "Asta Sans", style: "Regular" }),
    figma.loadFontAsync({ family: "Asta Sans", style: "Medium" }),
  ]);
  const HEAD = { family: "Khand", style: "SemiBold" };
  const HEADM = { family: "Khand", style: "Medium" };
  const BODY = { family: "Asta Sans", style: "Regular" };
  const BODYM = { family: "Asta Sans", style: "Medium" };
  const C = {
    white: "#FFFFFF", canvas: "#F2F2F2", border: "#E0E0E0", dark: "#1E1E1E",
    muted: "#AAAAAA", sec: "#555555", ph: "#F8F8F8", sbBg: "#FBFBFC",
    active: "#ECECEF", note: "#FFF3CD", noteBorder: "#E8C766", noteText: "#7A5C00",
    codeBg: "#F5F5F7", styledTint: "#F1F6FF", styledTag: "#3B6FD4", styledBorder: "#CFE0FA",
  };

  // ---- GENERATED DATA (snapshot of scripts/docs-data/button.docs.json) ----
  const D = {
    name: "Button", status: "Stable",
    description: "A clickable action — a button, or a link styled as one via asChild.",
    importPath: "@primitiv-ui/react", extends: "HTMLButtonElement",
    headless: [
      { n: "asChild", t: "boolean", d: "false", desc: "Render the child element instead of a native <button>, merging props via Slot." },
      { n: "children", t: "ReactNode", d: "—", desc: "Button content. Under asChild, the child Slot merges props onto." },
      { n: "ref", t: "Ref<HTMLButtonElement>", d: "—", desc: "Forwarded to the button, or merged onto the child under asChild." },
      { n: "type", t: '"button" | "submit" | "reset"', d: '"button"', desc: "Native type; defaults to button (not the DOM's submit)." },
    ],
    styledInstall: "primitiv add button",
    contract: [
      { n: "variant", t: '"primary" | "secondary" | "danger" | "ghost" | "link"', d: "primary", desc: "Visual intent / emphasis." },
      { n: "size", t: '"xs" | "sm" | "md" | "lg" | "xl"', d: "md", desc: "Control size; data-density scales each." },
    ],
    cssVars: ["--primitiv-button-bg", "--primitiv-button-fg", "--primitiv-button-radius", "--primitiv-button-height", "--primitiv-button-padding-inline", "--primitiv-button-shadow"],
    cssVarCount: 14,
  };

  const solid = (hex, a) => { const c = { r: parseInt(hex.slice(1,3),16)/255, g: parseInt(hex.slice(3,5),16)/255, b: parseInt(hex.slice(5,7),16)/255 }; const p = { type: "SOLID", color: c }; if (a != null) p.opacity = a; return [p]; };
  function rect(parent, x, y, w, h, fill, o = {}) {
    const r = figma.createRectangle(); r.x = x; r.y = y; r.resize(w, h);
    r.fills = fill ? solid(fill, o.opacity) : [];
    if (o.radius != null) r.cornerRadius = o.radius;
    if (o.stroke) { r.strokes = solid(o.stroke); r.strokeWeight = o.strokeW || 1; }
    parent.appendChild(r); return r;
  }
  function text(parent, str, x, y, size, font, color, o = {}) {
    const t = figma.createText(); t.fontName = font; t.fontSize = size; t.fills = solid(color);
    if (o.width) { t.textAutoResize = "HEIGHT"; t.resize(o.width, size); }
    if (o.lineHeight) t.lineHeight = { value: o.lineHeight, unit: "PIXELS" };
    if (o.spacing) t.letterSpacing = { value: o.spacing, unit: "PERCENT" };
    if (o.align) t.textAlignHorizontal = o.align;
    t.characters = str; t.x = x; t.y = y; parent.appendChild(t); return t;
  }
  function marker(parent, n, x, y, d = 20) {
    const c = figma.createEllipse(); c.x = x; c.y = y; c.resize(d, d); c.fills = solid(C.noteBorder); parent.appendChild(c);
    text(parent, String(n), x, y + (d - 14) / 2 + 1, d > 18 ? 11 : 10, HEADM, C.dark, { width: d, align: "CENTER" });
  }
  const RSVG = (col) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="22" viewBox="-12 -11 24 22"><circle r="2" fill="${col}"/><g fill="none" stroke="${col}" stroke-width="1.3"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg>`;
  function frameworkSwitch(parent, x, y, w, h) {
    rect(parent, x, y, w, h, C.white, { radius: 8, stroke: C.border });
    const seg = (w - 4) / 3;
    rect(parent, x + 2, y + 2, seg, h - 4, C.dark, { radius: 6 });
    const items = [{ svg: RSVG("#FFFFFF"), l: "React", c: C.white }, { l: "Vue", c: C.muted }, { l: "Svelte", c: C.muted }];
    items.forEach((it, i) => {
      const sx = x + 2 + i * seg;
      if (it.svg) { const lg = figma.createNodeFromSvg(it.svg); lg.rescale(15 / lg.height); const t = text(parent, it.l, 0, y + (h - 16) / 2, 13, HEADM, it.c); const cl = sx + (seg - (lg.width + 5 + t.width)) / 2; lg.x = cl; lg.y = y + (h - lg.height) / 2; parent.appendChild(lg); t.x = cl + lg.width + 5; }
      else text(parent, it.l, sx, y + (h - 16) / 2, 13, HEADM, it.c, { width: seg, align: "CENTER" });
    });
  }
  function dropdownRow(parent, x, y, w, h, label, value) {
    text(parent, label, x + 14, y + (h - 16) / 2, 15, HEADM, C.dark);
    text(parent, "▾", x + w - 28, y + (h - 15) / 2, 14, HEADM, C.muted, { width: 16, align: "CENTER" });
    const vt = text(parent, value, 0, y + (h - 15) / 2, 14, HEADM, C.dark); vt.x = x + w - 34 - vt.width;
  }
  function pmCodeBlock(parent, x, y, w, cmd, o = {}) {
    const gap = o.copy === false ? 18 : 20;
    rect(parent, x, y, w, 84, C.dark, { radius: 8 });
    let tx = x + (o.copy === false ? 14 : 16);
    ["npm", "pnpm", "yarn", "bun"].forEach((p, i) => {
      const a = i === 0; const tn = text(parent, p, tx, y + 12, 13, HEADM, a ? C.white : "#8A8A93");
      if (a) rect(parent, tx, y + 31, tn.width, 2, C.white); tx += tn.width + gap;
    });
    if (o.copy !== false) {
      rect(parent, x + w - 64, y + 10, 48, 22, null, { radius: 6, stroke: "#4A4A52" });
      text(parent, "Copy", x + w - 64, y + 13, 12, HEADM, "#B8B8C0", { width: 48, align: "CENTER" });
    }
    rect(parent, x, y + 42, w, 1, "#33333B");
    text(parent, "$  " + cmd, x + (o.copy === false ? 14 : 16), y + 56, o.copy === false ? 13 : 14, HEADM, C.white);
  }

  const PAGE = "Wireframes — Docs Site (v1 — component page)";
  let page = figma.root.children.find(p => p.name === PAGE);
  if (page) { for (const ch of [...page.children]) ch.remove(); } else { page = figma.createPage(); page.name = PAGE; }

  // ============================================================ DESKTOP
  {
    const W = 1440, NAV = 64, SB_W = 272, MAIN_X = 320, MAIN_W = 740, TOC_X = 1140;
    let FH = 1780;
    text(page, "Docs Site — Component page (Button) · desktop · props/types/defaults LAID OUT FROM generated docs-data (react extractor + contract.json)", 0, -64, 22, HEAD, C.dark);

    const F = figma.createFrame();
    F.name = "Component page — Button (desktop)"; F.x = 0; F.y = 0; F.resize(W, FH);
    F.fills = solid(C.white); F.clipsContent = true; page.appendChild(F);
    const sbBg = rect(F, 0, NAV, SB_W, FH - NAV, C.sbBg);
    const sbBorder = rect(F, SB_W - 1, NAV, 1, FH - NAV, C.border);

    // top nav (shell)
    rect(F, 0, 0, W, NAV, C.white);
    rect(F, 0, NAV - 1, W, 1, C.border);
    rect(F, 24, 20, 24, 24, C.dark, { radius: 6 });
    text(F, "Primitiv", 58, 19, 20, HEAD, C.dark);
    text(F, "Docs", 142, 22, 15, HEADM, C.muted);
    text(F, "Design in Figma", 300, 22, 15, HEADM, C.muted);
    text(F, "Build with code", 450, 22, 15, HEADM, C.dark);
    rect(F, 450, 46, 116, 2, C.dark);
    const rEnd = W - 24, themeX = rEnd - 32, searchX = themeX - 16 - 190, modeX = searchX - 16 - 220, fwX = modeX - 16 - 216;
    frameworkSwitch(F, fwX, 14, 216, 36);
    rect(F, modeX, 14, 220, 36, C.white, { radius: 8, stroke: C.border });
    const seg = (220 - 4) / 3;
    rect(F, modeX + 2, 16, seg, 32, C.dark, { radius: 6 });
    text(F, "Headless", modeX + 2, 24, 13, HEADM, C.white, { width: seg, align: "CENTER" });
    text(F, "Styled", modeX + 2 + seg, 24, 13, HEADM, C.sec, { width: seg, align: "CENTER" });
    text(F, "Figma", modeX + 2 + seg * 2, 24, 13, HEADM, C.sec, { width: seg, align: "CENTER" });
    rect(F, searchX, 14, 190, 36, C.white, { radius: 8, stroke: C.border });
    text(F, "Search docs…", searchX + 16, 24, 13, BODY, C.muted);
    rect(F, themeX, 14, 32, 32, C.white, { radius: 8, stroke: C.border });
    rect(F, themeX + 9, 21, 14, 14, C.dark, { radius: 7 });
    marker(F, 1, W / 2 - 10, -6);
    marker(F, 4, modeX + 110 - 10, 54);

    // sidebar §1.4 tree
    const nav = [
      { t: "Start Here" }, { t: "Concepts", caret: "▸" }, { t: "Components", caret: "▾", bold: true },
      { t: "Button", lvl: 1, active: true }, { t: "Checkbox", lvl: 1 }, { t: "Input", lvl: 1 },
      { t: "Select", lvl: 1 }, { t: "Switch", lvl: 1 }, { t: "Tabs", lvl: 1 }, { t: "Accordion", lvl: 1 },
      { t: "Dropdown", lvl: 1 }, { t: "Modal", lvl: 1 }, { t: "… 41 total", lvl: 1, muted: true },
      { t: "Registry & CLI" }, { t: "Design in Figma", caret: "▾" }, { t: "Harmoni", lvl: 1 },
      { t: "Recipes / Guides" }, { t: "Changelog / Releases" },
    ];
    let sy = NAV + 22;
    nav.forEach(it => {
      const lvl = it.lvl || 0, rh = lvl ? 30 : 34, x = 24 + (lvl ? 20 : 0);
      if (it.active) { rect(F, 0, sy - 4, SB_W, rh, C.active); rect(F, 0, sy - 4, 3, rh, C.dark); }
      if (it.caret) text(F, it.caret, 24, sy + (lvl ? 0 : 1), lvl ? 11 : 12, HEADM, C.muted);
      const col = it.muted ? C.muted : (it.active ? C.dark : (lvl ? C.sec : C.dark));
      text(F, it.t, x + (it.caret ? 16 : 0), sy, lvl ? 14 : 15, (lvl && !it.active) ? BODY : HEADM, col);
      sy += rh;
    });
    marker(F, 2, SB_W - 30, NAV + 92);

    // main content
    let y = NAV + 40;
    text(F, "Docs", MAIN_X, y, 13, BODY, C.muted);
    text(F, "/", MAIN_X + 40, y, 13, BODY, C.muted);
    text(F, "Components", MAIN_X + 54, y, 13, BODY, C.muted);
    text(F, "/", MAIN_X + 138, y, 13, BODY, C.muted);
    text(F, "Button", MAIN_X + 152, y, 13, BODYM, C.dark);
    marker(F, 3, MAIN_X + 210, y - 4, 18);
    y += 30;
    text(F, D.name, MAIN_X, y, 40, HEAD, C.dark);
    rect(F, MAIN_X + 108, y + 12, 66, 24, "#E6F4EA", { radius: 12, stroke: "#9BD3AE" });
    text(F, D.status, MAIN_X + 108, y + 16, 12, HEADM, "#2F7A45", { width: 66, align: "CENTER" });
    text(F, "GitHub ↗", MAIN_X + MAIN_W - 170, y + 14, 14, HEADM, C.sec);
    text(F, "Figma ↗", MAIN_X + MAIN_W - 80, y + 14, 14, HEADM, C.sec);
    y += 54;
    text(F, D.description, MAIN_X, y, 17, BODY, C.sec, { width: 600, lineHeight: 25 });
    y += 44;

    const heading = (label, mk) => { text(F, label, MAIN_X, y, 24, HEAD, C.dark); if (mk) marker(F, mk, MAIN_X + label.length * 12 + 16, y + 2, 18); y += 40; };

    heading("Installation", 5);
    pmCodeBlock(F, MAIN_X, y, 470, "npm i " + D.importPath);
    text(F, 'import { Button } from "' + D.importPath + '"', MAIN_X + 490, y + 8, 13, BODY, C.sec, { width: 250, lineHeight: 18 });
    text(F, "Extends " + D.extends, MAIN_X + 490, y + 46, 13, BODYM, C.dark);
    text(F, "Styled mode → " + D.styledInstall, MAIN_X + 490, y + 66, 12, BODY, C.muted);
    y += 108;

    heading("Usage");
    const pvH = 150;
    rect(F, MAIN_X, y, MAIN_W, pvH, C.ph, { radius: 12, stroke: C.border });
    text(F, "Preview", MAIN_X + 16, y + 12, 11, HEADM, C.muted, { spacing: 4 });
    rect(F, MAIN_X + MAIN_W / 2 - 52, y + 58, 104, 40, C.dark, { radius: 8 });
    text(F, "Button", MAIN_X + MAIN_W / 2 - 52, y + 69, 14, HEAD, C.white, { width: 104, align: "CENTER" });
    rect(F, MAIN_X, y + pvH, MAIN_W, 40, C.codeBg, { stroke: C.border });
    text(F, "<Button>Button</Button>", MAIN_X + 16, y + pvH + 12, 13, BODY, C.sec);
    y += pvH + 40 + 32;

    heading("Props", 6);
    text(F, "Extends " + D.extends + "  ·  " + D.headless.length + " own props  ·  native DOM attributes filtered out", MAIN_X, y - 8, 13, BODY, C.muted);
    y += 20;
    [["Prop", 0], ["Type", 150], ["Default", 440], ["Description", 540]].forEach(c => text(F, c[0], MAIN_X + c[1], y, 12, HEADM, C.muted, { spacing: 3 }));
    y += 22;
    rect(F, MAIN_X, y, MAIN_W, 1, C.border);
    y += 8;
    const propRow = (p, styled) => {
      const rh = 50;
      if (styled) rect(F, MAIN_X - 8, y - 2, MAIN_W + 16, rh, C.styledTint, { radius: 6 });
      text(F, p.n, MAIN_X, y + 6, 14, HEADM, C.dark);
      if (styled) { rect(F, MAIN_X + p.n.length * 8 + 12, y + 7, 46, 16, C.white, { radius: 8, stroke: C.styledBorder }); text(F, "styled", MAIN_X + p.n.length * 8 + 12, y + 8, 9, HEADM, C.styledTag, { width: 46, align: "CENTER" }); }
      text(F, p.t, MAIN_X + 150, y + 6, 12, BODY, C.sec, { width: 285, lineHeight: 16 });
      text(F, p.d, MAIN_X + 440, y + 6, 13, HEADM, p.d === "—" ? C.muted : C.dark);
      text(F, p.desc, MAIN_X + 540, y + 4, 12, BODY, C.muted, { width: 200, lineHeight: 15 });
      y += rh;
      rect(F, MAIN_X, y - 1, MAIN_W, 1, C.border);
    };
    D.headless.forEach(p => propRow(p, false));
    y += 6;
    text(F, "＋ In Styled mode  (" + D.styledInstall + ")", MAIN_X, y, 13, HEADM, C.styledTag);
    y += 26;
    D.contract.forEach(p => propRow(p, true));
    y += 16;

    heading("Styling contract", 7);
    text(F, "CSS custom properties — mode-agnostic; shown regardless of the switch (§1.5)", MAIN_X, y - 8, 13, BODY, C.muted);
    y += 22;
    D.cssVars.forEach((v, i) => text(F, v, MAIN_X + (i % 2) * 370, y + Math.floor(i / 2) * 30, 13, BODY, C.dark));
    y += Math.ceil(D.cssVars.length / 2) * 30 + 4;
    text(F, "… " + D.cssVarCount + " total", MAIN_X, y, 13, BODYM, C.muted);
    y += 40;

    heading("Accessibility", 8);
    ["Space / Enter activates the button.", "Visible focus ring via :focus-visible.", "disabled exposes data-disabled + native disabled semantics.", "asChild keeps a11y wiring when rendering a link."].forEach(b => {
      rect(F, MAIN_X, y + 7, 5, 5, C.dark, { radius: 3 });
      text(F, b, MAIN_X + 16, y, 14, BODY, C.sec, { width: MAIN_W - 16 });
      y += 28;
    });
    y += 24;

    heading("Examples");
    const exW = (MAIN_W - 20) / 2;
    [["As a link (asChild)", "<Button asChild>…</Button>"], ["Variants (styled)", "primary · secondary · ghost"]].forEach((e, i) => {
      const ex = MAIN_X + i * (exW + 20);
      rect(F, ex, y, exW, 120, C.white, { radius: 10, stroke: C.border });
      text(F, e[0], ex + 16, y + 14, 15, HEAD, C.dark);
      rect(F, ex + 16, y + 44, exW - 32, 58, C.ph, { radius: 6 });
      text(F, e[1], ex + 28, y + 66, 12, BODY, C.muted);
    });
    y += 120 + 40;
    const contentBottom = y;

    // TOC
    let ty = NAV + 40;
    text(F, "ON THIS PAGE", TOC_X, ty, 11, HEADM, C.muted, { spacing: 5 });
    marker(F, 9, TOC_X + 132, ty - 4, 18);
    ty += 26;
    ["Installation", "Usage", "Props", "Styling contract", "Accessibility", "Examples"].forEach((t, i) => {
      if (i === 0) rect(F, TOC_X - 12, ty - 2, 3, 18, C.dark);
      text(F, t, TOC_X, ty, 14, i === 0 ? HEADM : BODY, i === 0 ? C.dark : C.muted);
      ty += 28;
    });

    FH = Math.max(contentBottom, ty) + 48;
    F.resize(W, FH);
    sbBg.resize(SB_W, FH - NAV); sbBorder.resize(1, FH - NAV);
  }

  // ============================================================ MOBILE
  {
    const W = 390, M = 20, CW = W - M * 2, X0 = 1560;
    text(page, "Component page — Button (mobile)", X0, -64, 22, HEAD, C.dark);
    const F = figma.createFrame();
    F.name = "Component page — Button (mobile)"; F.x = X0; F.y = 0; F.resize(W, 2400);
    F.fills = solid(C.white); F.clipsContent = true; page.appendChild(F);
    rect(F, 0, 0, W, 56, C.white); rect(F, 0, 55, W, 1, C.border);
    rect(F, M, 16, 22, 22, C.dark, { radius: 6 });
    text(F, "Primitiv", M + 30, 15, 18, HEAD, C.dark);
    for (let i = 0; i < 3; i++) rect(F, W - M - 22, 18 + i * 7, 22, 2.5, C.dark, { radius: 1 });
    rect(F, M, 68, CW, 40, C.white, { radius: 8, stroke: C.border });
    dropdownRow(F, M, 68, CW, 40, "Mode", "Headless");
    marker(F, 4, W - M - 12, 62, 18);
    let y = 128;
    text(F, "Components  /  ", M, y, 12, BODY, C.muted);
    text(F, "Button", M + 88, y, 12, BODYM, C.dark);
    marker(F, 3, M + 132, y - 3, 18);
    y += 26;
    text(F, D.name, M, y, 34, HEAD, C.dark);
    rect(F, M + 92, y + 10, 60, 22, "#E6F4EA", { radius: 11, stroke: "#9BD3AE" });
    text(F, D.status, M + 92, y + 13, 12, HEADM, "#2F7A45", { width: 60, align: "CENTER" });
    y += 46;
    text(F, D.description, M, y, 15, BODY, C.sec, { width: CW, lineHeight: 22 });
    y += 54;
    const heading = (label, mk) => { text(F, label, M, y, 24, HEAD, C.dark); if (mk) marker(F, mk, M + label.length * 12 + 14, y + 2, 18); y += 38; };

    heading("Installation", 5);
    pmCodeBlock(F, M, y, CW, "npm i " + D.importPath, { copy: false });
    y += 96;
    text(F, 'import { Button } from "' + D.importPath + '"', M, y, 12, BODY, C.sec, { width: CW });
    y += 22;
    text(F, "Extends " + D.extends + "  ·  Styled → " + D.styledInstall, M, y, 12, BODY, C.muted, { width: CW });
    y += 40;

    heading("Usage");
    rect(F, M, y, CW, 130, C.ph, { radius: 12, stroke: C.border });
    text(F, "Preview", M + 14, y + 12, 11, HEADM, C.muted, { spacing: 4 });
    rect(F, M + CW / 2 - 48, y + 52, 96, 38, C.dark, { radius: 8 });
    text(F, "Button", M + CW / 2 - 48, y + 62, 14, HEAD, C.white, { width: 96, align: "CENTER" });
    y += 130 + 30;

    heading("Props", 6);
    text(F, "Extends " + D.extends + "  ·  " + D.headless.length + " own props", M, y - 6, 12, BODY, C.muted, { width: CW });
    y += 20;
    const propCard = (p, styled) => {
      const ch = 104;
      rect(F, M, y, CW, ch, styled ? C.styledTint : C.white, { radius: 10, stroke: styled ? C.styledBorder : C.border });
      text(F, p.n, M + 14, y + 12, 16, HEADM, C.dark);
      if (styled) { rect(F, M + 14 + p.n.length * 9 + 8, y + 13, 46, 16, C.white, { radius: 8, stroke: C.styledBorder }); text(F, "styled", M + 14 + p.n.length * 9 + 8, y + 14, 9, HEADM, C.styledTag, { width: 46, align: "CENTER" }); }
      text(F, "default " + p.d, M + 14, y + 14, 12, BODY, C.muted, { width: CW - 28, align: "RIGHT" });
      text(F, p.t, M + 14, y + 38, 12, BODY, C.sec, { width: CW - 28, lineHeight: 16 });
      text(F, p.desc, M + 14, y + 62, 12, BODY, C.muted, { width: CW - 28, lineHeight: 15 });
      y += ch + 10;
    };
    D.headless.forEach(p => propCard(p, false));
    y += 4;
    text(F, "＋ In Styled mode (" + D.styledInstall + ")", M, y, 13, HEADM, C.styledTag);
    y += 26;
    D.contract.forEach(p => propCard(p, true));
    y += 12;

    heading("Styling contract", 7);
    text(F, "CSS variables — mode-agnostic (§1.5)", M, y - 6, 12, BODY, C.muted);
    y += 18;
    D.cssVars.slice(0, 4).forEach(v => { text(F, v, M, y, 13, BODY, C.dark); y += 26; });
    text(F, "… " + D.cssVarCount + " total", M, y, 13, HEADM, C.muted);
    y += 42;

    heading("Accessibility", 8);
    ["Space / Enter activates the button.", "Visible focus ring via :focus-visible.", "disabled exposes data-disabled semantics.", "asChild keeps a11y wiring for a link."].forEach(b => {
      rect(F, M, y + 7, 5, 5, C.dark, { radius: 3 });
      text(F, b, M + 14, y, 14, BODY, C.sec, { width: CW - 14, lineHeight: 20 });
      y += 30;
    });
    y += 20;

    heading("Examples");
    [["As a link (asChild)", "<Button asChild>…</Button>"], ["Variants (styled)", "primary · secondary · ghost"]].forEach(e => {
      rect(F, M, y, CW, 96, C.white, { radius: 10, stroke: C.border });
      text(F, e[0], M + 14, y + 12, 15, HEAD, C.dark);
      rect(F, M + 14, y + 40, CW - 28, 44, C.ph, { radius: 6 });
      text(F, e[1], M + 24, y + 56, 12, BODY, C.muted);
      y += 96 + 12;
    });
    y += 20;
    F.resize(W, y + 20);
  }

  // ============================================================ NOTES
  {
    const NP = figma.createFrame();
    NP.name = "Component page notes"; NP.x = 2020; NP.y = 0; NP.resize(500, 620);
    NP.fills = solid(C.note); NP.cornerRadius = 12; NP.strokes = solid(C.noteBorder); NP.strokeWeight = 1;
    page.appendChild(NP);
    text(NP, "Component page — Button (v1)", 28, 28, 20, HEAD, C.dark);
    text(NP, "Props/types/defaults/extends + CSS vars are LAID OUT FROM generated docs-data (scripts/docs-data/button.docs.json) — TS extractor for headless props, contract.json for the styled half. Not hand-typed.", 28, 58, 12.5, BODY, C.noteText, { width: 445, lineHeight: 17 });
    const notes = [
      ["1", "Persistent docs shell — same top nav as the landing (audience fork, framework + mode switches, search, theme)."],
      ["2", "Left sidebar = the §1.4 nav tree; Components expanded, Button active. How you move between component pages."],
      ["3", "Breadcrumb Docs / Components / Button — the connection back up. Reached from landing via 'Browse Components' → Components → Button."],
      ["4", "Mode switch changes page CONTENT: Headless shown here; Styled appends contract props + swaps install to 'primitiv add button'; Figma → spec/redline (§1.1)."],
      ["5", "Install block — mode-aware + package-manager tabbed (npm/pnpm/yarn/bun)."],
      ["6", "Props table GENERATED: 4 headless props (extractor, native DOM attrs filtered) + variant/size appended in Styled mode (contract.json). Blue-tinted = styled-only (§1.7)."],
      ["7", "Styling contract = the 14 --primitiv-button-* CSS vars; mode-agnostic, shown regardless of the switch (§1.5/§1.6)."],
      ["8", "Accessibility — hand-authored (not extractable; §1.7 a11y)."],
      ["9", "On-this-page TOC (desktop right rail). Mobile: sidebar → hamburger, TOC dropped, props table → stacked cards."],
    ];
    let ny = 118;
    notes.forEach(n => {
      const c = figma.createEllipse(); c.x = 28; c.y = ny; c.resize(20, 20); c.fills = solid(C.dark); NP.appendChild(c);
      text(NP, n[0], 28, ny + 3, 11, HEADM, C.white, { width: 20, align: "CENTER" });
      const t = text(NP, n[1], 60, ny - 1, 13, BODY, C.dark, { width: 410, lineHeight: 18 });
      ny += Math.max(52, t.height + 14);
    });
    NP.resize(500, ny + 12);
  }

  const FD = page.children.find(c => c.name === "Component page — Button (desktop)");
  await figma.setCurrentPageAsync(page);
  figma.viewport.scrollAndZoomIntoView([FD]);
  return { page: PAGE, frames: page.children.map(c => c.name) };
})();
