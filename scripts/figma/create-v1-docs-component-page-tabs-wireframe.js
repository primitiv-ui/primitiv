// Docs Site — Component page (Tabs), rough wireframe (v1) — COMPOUND-component stress test
//
// Paste into the Figma desktop developer console (Plugins → Development →
// Open console; type "allow pasting" first). Creates / refreshes the page
// "Wireframes — Docs Site (v1 — component page · Tabs)" with:
//   • "Component page — Tabs (desktop)" — 1440-wide, full docs shell
//   • "Component page — Tabs (mobile)"  — 390-wide, stacked
//   • "Tabs findings"                   — what the stress test exposed
//
// Repeats the Button component-page exercise on a *compound* component (4
// sub-components) to see what it exposes design/layout-wise. Shown in STYLED
// mode. Props/types/defaults/extends laid out FROM generated docs-data
// (scripts/docs-data/tabs.docs.json, `node scripts/docs-data/extract-docs-data.mjs
// tabs`). The `D` snapshot below embeds that generated data (types/defaults/
// names verbatim; long descriptions trimmed for table display; the
// controlled/uncontrolled tags + keyboard table are hand-authored — see the
// findings panel and planning §1.20 for why). New layout elements vs Button:
// Anatomy, per-sub-component prop tables, controlled/uncontrolled callout,
// a keyboard-interactions table, per-sub data-attributes, and a nested TOC.

return (async function () {
  if (typeof figma.loadAllPagesAsync === "function") { try { await figma.loadAllPagesAsync(); } catch (e) {} }
  await Promise.all([
    figma.loadFontAsync({ family: "Khand", style: "SemiBold" }), figma.loadFontAsync({ family: "Khand", style: "Medium" }),
    figma.loadFontAsync({ family: "Asta Sans", style: "Regular" }), figma.loadFontAsync({ family: "Asta Sans", style: "Medium" }),
  ]);
  const HEAD = { family: "Khand", style: "SemiBold" }, HEADM = { family: "Khand", style: "Medium" };
  const BODY = { family: "Asta Sans", style: "Regular" }, BODYM = { family: "Asta Sans", style: "Medium" };
  const C = { white: "#FFFFFF", border: "#E0E0E0", dark: "#1E1E1E", muted: "#AAAAAA", sec: "#555555", ph: "#F8F8F8", sbBg: "#FBFBFC", active: "#ECECEF", codeBg: "#F5F5F7", styledTint: "#F1F6FF", styledTag: "#3B6FD4", styledBorder: "#CFE0FA", ctlTint: "#FFF6EC", ctlTag: "#B4741A", ctlBorder: "#EED9BE", note: "#FFF3CD", noteBorder: "#E8C766", noteText: "#7A5C00" };

  // ---- GENERATED DATA (snapshot of scripts/docs-data/tabs.docs.json) ----
  const D = {
    name: "Tabs", status: "Stable",
    description: "An accessible tabbed interface — a tablist of triggers that switch between panels (WAI-ARIA Tabs pattern).",
    styledInstall: "primitiv add tabs", rootClass: "primitiv-tabs", cssVarCount: 22,
    subs: [
      { name: "Tabs.Root", ext: "HTMLDivElement", props: [
        { n: "value", t: "string", d: "—", desc: "Active tab value (controlled).", tag: "controlled" },
        { n: "onValueChange", t: "(value: string) => void", d: "—", desc: "Called with the requested value on activation.", tag: "controlled" },
        { n: "defaultValue", t: "string", d: "—", desc: "Value active on first render.", tag: "uncontrolled" },
        { n: "orientation", t: '"horizontal" | "vertical"', d: '"horizontal"', desc: "Layout axis; binds the arrow keys." },
        { n: "activationMode", t: '"automatic" | "manual"', d: '"automatic"', desc: "Focus activates a tab, or Enter/Space is required." },
        { n: "dir", t: '"ltr" | "rtl"', d: "—", desc: "Reading direction; mirrors the horizontal arrows." },
        { n: "lazyMount", t: "boolean", d: "—", desc: "Defer a panel's children until first activated." },
        { n: "onChange", t: "(m: TabMetadata) => void", d: "—", desc: "Fires on activation with { index, name }." },
      ], contract: [{ n: "size", t: '"xs" … "xl"', d: "md", desc: "Control size; data-density scales each." }] },
      { name: "Tabs.List", ext: "HTMLDivElement", props: [
        { n: "label", t: "string", d: "—", desc: "Accessible name (aria-label). One of label / ariaLabelledBy required." },
        { n: "ariaLabelledBy", t: "string", d: "—", desc: "Id of existing label text (aria-labelledby)." },
      ], contract: [{ n: "justify", t: '"start" | "center" | "end"', d: "start", desc: "Alignment of triggers along the list." }] },
      { name: "Tabs.Trigger", ext: "HTMLButtonElement", props: [
        { n: "value", t: "string", d: "—", req: true, desc: "Links the trigger to its Content of the same value." },
        { n: "disabled", t: "boolean", d: "false", desc: "Skips the trigger in roving focus; aria-disabled." },
        { n: "asChild", t: "boolean", d: "—", desc: "Render a child element (e.g. a link) with tab semantics." },
        { n: "ref", t: "Ref<T>", d: "—", desc: "Ref to the element; defaults to HTMLButtonElement." },
      ], contract: [] },
      { name: "Tabs.Content", ext: "HTMLDivElement", props: [
        { n: "value", t: "string", d: "—", req: true, desc: "Links the panel to its Trigger of the same value." },
      ], contract: [] },
    ],
    keyboard: [
      ["Tab", "Move focus into the tablist (the active trigger), then out to the panel."],
      ["→  ←", "Focus next / previous trigger (horizontal); activates it in automatic mode."],
      ["↓  ↑", "Same, when orientation is \"vertical\"."],
      ["Home / End", "Focus the first / last trigger."],
      ["Enter / Space", "Activate the focused trigger (required in manual mode)."],
    ],
    dataAttrs: ["data-state", "data-orientation", "data-disabled"],
    cssVars: ["--primitiv-tabs-trigger-fg", "--primitiv-tabs-trigger-fg-active", "--primitiv-tabs-indicator-color-active", "--primitiv-tabs-baseline-color", "--primitiv-tabs-panel-padding-inline", "--primitiv-tabs-trigger-height"],
    anatomy: ['<Tabs.Root defaultValue="account">', '  <Tabs.List label="Account settings">', '    <Tabs.Trigger value="account">Account</Tabs.Trigger>', '    <Tabs.Trigger value="password">Password</Tabs.Trigger>', '  </Tabs.List>', '  <Tabs.Content value="account">…</Tabs.Content>', '  <Tabs.Content value="password">…</Tabs.Content>', '</Tabs.Root>'],
  };

  const solid = (hex, a) => { const c = { r: parseInt(hex.slice(1,3),16)/255, g: parseInt(hex.slice(3,5),16)/255, b: parseInt(hex.slice(5,7),16)/255 }; const p = { type: "SOLID", color: c }; if (a != null) p.opacity = a; return [p]; };
  function rect(F, x, y, w, h, fill, o = {}) { const r = figma.createRectangle(); r.x = x; r.y = y; r.resize(w, h); r.fills = fill ? solid(fill, o.opacity) : []; if (o.radius != null) r.cornerRadius = o.radius; if (o.stroke) { r.strokes = solid(o.stroke); r.strokeWeight = o.strokeW || 1; } F.appendChild(r); return r; }
  function text(F, str, x, y, size, font, color, o = {}) { const t = figma.createText(); t.fontName = font; t.fontSize = size; t.fills = solid(color); if (o.width) { t.textAutoResize = "HEIGHT"; t.resize(o.width, size); } if (o.lineHeight) t.lineHeight = { value: o.lineHeight, unit: "PIXELS" }; if (o.spacing) t.letterSpacing = { value: o.spacing, unit: "PERCENT" }; if (o.align) t.textAlignHorizontal = o.align; t.characters = (str == null ? "" : String(str)); t.x = x; t.y = y; F.appendChild(t); return t; }
  function marker(F, n, x, y, d = 20) { const c = figma.createEllipse(); c.x = x; c.y = y; c.resize(d, d); c.fills = solid(C.noteBorder); F.appendChild(c); text(F, String(n), x, y + (d - 14) / 2 + 1, d > 18 ? 11 : 10, HEADM, C.dark, { width: d, align: "CENTER" }); }
  const RSVG = (col) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="22" viewBox="-12 -11 24 22"><circle r="2" fill="${col}"/><g fill="none" stroke="${col}" stroke-width="1.3"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg>`;
  function frameworkSwitch(F, x, y, w, h) { rect(F, x, y, w, h, C.white, { radius: 8, stroke: C.border }); const seg = (w - 4) / 3; rect(F, x + 2, y + 2, seg, h - 4, C.dark, { radius: 6 }); const items = [{ svg: RSVG("#FFFFFF"), l: "React", c: C.white }, { l: "Vue", c: C.muted }, { l: "Svelte", c: C.muted }]; items.forEach((it, i) => { const sx = x + 2 + i * seg; if (it.svg) { const lg = figma.createNodeFromSvg(it.svg); lg.rescale(15 / lg.height); const t = text(F, it.l, 0, y + (h - 16) / 2, 13, HEADM, it.c); const cl = sx + (seg - (lg.width + 5 + t.width)) / 2; lg.x = cl; lg.y = y + (h - lg.height) / 2; F.appendChild(lg); t.x = cl + lg.width + 5; } else text(F, it.l, sx, y + (h - 16) / 2, 13, HEADM, it.c, { width: seg, align: "CENTER" }); }); }
  function pmCodeBlock(F, x, y, w, cmd, o = {}) { const copy = o.copy !== false; rect(F, x, y, w, 84, C.dark, { radius: 8 }); let tx = x + (copy ? 16 : 14); ["npm", "pnpm", "yarn", "bun"].forEach((p, i) => { const a = i === 0; const tn = text(F, p, tx, y + 12, 13, HEADM, a ? C.white : "#8A8A93"); if (a) rect(F, tx, y + 31, tn.width, 2, C.white); tx += tn.width + (copy ? 20 : 18); }); if (copy) { rect(F, x + w - 64, y + 10, 48, 22, null, { radius: 6, stroke: "#4A4A52" }); text(F, "Copy", x + w - 64, y + 13, 12, HEADM, "#B8B8C0", { width: 48, align: "CENTER" }); } rect(F, x, y + 42, w, 1, "#33333B"); text(F, "$  " + cmd, x + (copy ? 16 : 14), y + 56, copy ? 14 : 13, HEADM, C.white); }
  function controlField(F, x, y, w, label, value) { text(F, label, x, y, 10, HEADM, C.muted, { spacing: 4 }); rect(F, x, y + 14, w, 36, C.white, { radius: 8, stroke: C.border }); text(F, value, x + 12, y + 24, 13, HEADM, C.dark); text(F, "▾", x + w - 24, y + 25, 12, HEADM, C.muted, { width: 12, align: "CENTER" }); }
  function dropdownField(F, x, y, w, h, label, value) { rect(F, x, y, w, h, C.white, { radius: 8, stroke: C.border }); text(F, label, x + 14, y + (h - 16) / 2, 15, HEADM, C.sec); text(F, "▾", x + w - 26, y + (h - 15) / 2, 13, HEADM, C.muted, { width: 14, align: "CENTER" }); const vt = text(F, value, 0, y + (h - 15) / 2, 14, HEADM, C.dark); vt.x = x + w - 32 - vt.width; }

  const PAGE = "Wireframes — Docs Site (v1 — component page · Tabs)";
  let page = figma.root.children.find(p => p.name === PAGE);
  if (page) { for (const ch of [...page.children]) ch.remove(); } else { page = figma.createPage(); page.name = PAGE; }

  // ============================================================ DESKTOP
  {
    const W = 1440, NAV = 64, SB_W = 272, MAIN_X = 320, MAIN_W = 740, TOC_X = 1140;
    let FH = 2600;
    text(page, "Docs Site — Component page (Tabs) · desktop · a COMPOUND component (4 sub-components) to stress-test the layout · props LAID OUT FROM generated docs-data", 0, -64, 22, HEAD, C.dark);
    const F = figma.createFrame(); F.name = "Component page — Tabs (desktop)"; F.x = 0; F.y = 0; F.resize(W, FH); F.fills = solid(C.white); F.clipsContent = true; page.appendChild(F);
    const sbBg = rect(F, 0, NAV, SB_W, FH - NAV, C.sbBg); const sbBorder = rect(F, SB_W - 1, NAV, 1, FH - NAV, C.border);
    rect(F, 0, 0, W, NAV, C.white); rect(F, 0, NAV - 1, W, 1, C.border);
    rect(F, 24, 20, 24, 24, C.dark, { radius: 6 }); text(F, "Primitiv", 58, 19, 20, HEAD, C.dark); text(F, "Docs", 142, 22, 15, HEADM, C.muted);
    text(F, "Design in Figma", 300, 22, 15, HEADM, C.muted); text(F, "Build with code", 450, 22, 15, HEADM, C.dark); rect(F, 450, 46, 116, 2, C.dark);
    const themeX = W - 24 - 32, searchX = themeX - 16 - 190, modeX = searchX - 16 - 220, fwX = modeX - 16 - 216;
    frameworkSwitch(F, fwX, 14, 216, 36);
    rect(F, modeX, 14, 220, 36, C.white, { radius: 8, stroke: C.border }); const mseg = (220 - 4) / 3; rect(F, modeX + 2 + mseg, 16, mseg, 32, C.dark, { radius: 6 });
    text(F, "Headless", modeX + 2, 24, 13, HEADM, C.sec, { width: mseg, align: "CENTER" }); text(F, "Styled", modeX + 2 + mseg, 24, 13, HEADM, C.white, { width: mseg, align: "CENTER" }); text(F, "Figma", modeX + 2 + mseg * 2, 24, 13, HEADM, C.sec, { width: mseg, align: "CENTER" });
    rect(F, searchX, 14, 190, 36, C.white, { radius: 8, stroke: C.border }); text(F, "Search docs…", searchX + 16, 24, 13, BODY, C.muted);
    rect(F, themeX, 14, 32, 32, C.white, { radius: 8, stroke: C.border }); rect(F, themeX + 9, 21, 14, 14, C.dark, { radius: 7 });
    marker(F, 1, W / 2 - 10, -6); marker(F, 4, modeX + 110 - 10, 54);
    const nav = [{ t: "Start Here" }, { t: "Concepts", caret: "▸" }, { t: "Components", caret: "▾" }, { t: "Button", lvl: 1 }, { t: "Checkbox", lvl: 1 }, { t: "Input", lvl: 1 }, { t: "Select", lvl: 1 }, { t: "Switch", lvl: 1 }, { t: "Tabs", lvl: 1, active: true }, { t: "Accordion", lvl: 1 }, { t: "Dropdown", lvl: 1 }, { t: "Modal", lvl: 1 }, { t: "… 41 total", lvl: 1, muted: true }, { t: "Registry & CLI" }, { t: "Design in Figma", caret: "▾" }, { t: "Harmoni", lvl: 1 }, { t: "Recipes / Guides" }, { t: "Changelog / Releases" }];
    let sy = NAV + 22;
    nav.forEach(it => { const lvl = it.lvl || 0, rh = lvl ? 30 : 34, x = 24 + (lvl ? 20 : 0); if (it.active) { rect(F, 0, sy - 4, SB_W, rh, C.active); rect(F, 0, sy - 4, 3, rh, C.dark); } if (it.caret) text(F, it.caret, 24, sy + (lvl ? 0 : 1), lvl ? 11 : 12, HEADM, C.muted); const col = it.muted ? C.muted : (it.active ? C.dark : (lvl ? C.sec : C.dark)); text(F, it.t, x + (it.caret ? 16 : 0), sy, lvl ? 14 : 15, (lvl && !it.active) ? BODY : HEADM, col); sy += rh; });
    marker(F, 2, SB_W - 30, NAV + 8 * 30 + 22 - 26);

    let y = NAV + 40;
    text(F, "Docs", MAIN_X, y, 13, BODY, C.muted); text(F, "/", MAIN_X + 40, y, 13, BODY, C.muted); text(F, "Components", MAIN_X + 54, y, 13, BODY, C.muted); text(F, "/", MAIN_X + 138, y, 13, BODY, C.muted); text(F, "Tabs", MAIN_X + 152, y, 13, BODYM, C.dark);
    marker(F, 3, MAIN_X + 196, y - 4, 18);
    y += 30;
    text(F, D.name, MAIN_X, y, 40, HEAD, C.dark);
    rect(F, MAIN_X + 86, y + 12, 66, 24, "#E6F4EA", { radius: 12, stroke: "#9BD3AE" }); text(F, D.status, MAIN_X + 86, y + 16, 12, HEADM, "#2F7A45", { width: 66, align: "CENTER" });
    text(F, "GitHub ↗", MAIN_X + MAIN_W - 170, y + 14, 14, HEADM, C.sec); text(F, "Figma ↗", MAIN_X + MAIN_W - 80, y + 14, 14, HEADM, C.sec);
    y += 52;
    text(F, D.description, MAIN_X, y, 17, BODY, C.sec, { width: 640, lineHeight: 25 });
    y += 66;
    const heading = (label, mk) => { text(F, label, MAIN_X, y, 24, HEAD, C.dark); if (mk) marker(F, mk, MAIN_X + label.length * 12 + 16, y + 2, 18); y += 38; };

    heading("Playground", 5);
    const pgH = 250; rect(F, MAIN_X, y, MAIN_W, pgH, C.white, { radius: 12, stroke: C.border });
    text(F, "PREVIEW", MAIN_X + 16, y + 14, 10, HEADM, C.muted, { spacing: 4 });
    const tabsY = y + 40; ["Account", "Password", "Team"].forEach((t, i) => { const tx = MAIN_X + 24 + i * 96; text(F, t, tx, tabsY, 14, HEADM, i === 0 ? C.dark : C.muted, { width: 84, align: "CENTER" }); if (i === 0) rect(F, tx, tabsY + 26, 84, 2, C.dark); });
    rect(F, MAIN_X + 24, tabsY + 27, MAIN_W - 48, 1, C.border);
    rect(F, MAIN_X + 24, tabsY + 44, MAIN_W - 48, 54, C.ph, { radius: 6 }); text(F, "Panel content for the active tab…", MAIN_X + 36, tabsY + 62, 13, BODY, C.muted);
    rect(F, MAIN_X, y + 170, MAIN_W, 1, C.border);
    const cfw = (MAIN_W - 32 - 3 * 12) / 4;
    controlField(F, MAIN_X + 16, y + 186, cfw, "ORIENTATION", "horizontal");
    controlField(F, MAIN_X + 16 + (cfw + 12), y + 186, cfw, "SIZE", "md");
    controlField(F, MAIN_X + 16 + 2 * (cfw + 12), y + 186, cfw, "JUSTIFY", "start");
    controlField(F, MAIN_X + 16 + 3 * (cfw + 12), y + 186, cfw, "DENSITY", "Comfortable");
    y += pgH + 10;
    text(F, "Orientation is a headless prop (binds the arrow keys); size & justify are contract props; density is the Context system.", MAIN_X, y, 12, BODY, C.muted, { width: MAIN_W });
    y += 40;

    heading("Anatomy", 6);
    text(F, "A compound component — compose the parts yourself.", MAIN_X, y - 8, 13, BODY, C.muted); y += 22;
    const anaH = D.anatomy.length * 22 + 24; rect(F, MAIN_X, y, MAIN_W, anaH, C.codeBg, { radius: 10, stroke: C.border });
    D.anatomy.forEach((ln, i) => text(F, ln, MAIN_X + 18, y + 14 + i * 22, 13, BODY, C.sec));
    y += anaH + 34;

    heading("Installation", 7);
    pmCodeBlock(F, MAIN_X, y, 470, "npx " + D.styledInstall);
    text(F, 'import { Tabs } from "@/components/ui/tabs"', MAIN_X + 490, y + 14, 13, BODY, C.sec, { width: 250, lineHeight: 18 });
    text(F, "Headless → npm i @primitiv-ui/react", MAIN_X + 490, y + 48, 12, BODY, C.muted, { width: 250, lineHeight: 16 });
    y += 108;

    heading("Props", 8);
    text(F, "One table per sub-component. Each extends its own element.", MAIN_X, y - 8, 13, BODY, C.muted); y += 24;
    const propRow = (p, kind) => {
      const rh = 46, tinted = kind === "contract" ? C.styledTint : (kind === "controlled" || kind === "uncontrolled") ? C.ctlTint : null;
      if (tinted) rect(F, MAIN_X - 8, y - 2, MAIN_W + 16, rh, tinted, { radius: 6 });
      text(F, p.n, MAIN_X, y + 5, 14, HEADM, C.dark);
      let tagX = MAIN_X + p.n.length * 8 + 12;
      if (p.req) { text(F, "required", tagX, y + 7, 10, HEADM, "#B23B3B"); tagX += 52; }
      if (kind) { const tg = kind === "contract" ? "contract" : kind; const col = kind === "contract" ? C.styledTag : C.ctlTag; const bd = kind === "contract" ? C.styledBorder : C.ctlBorder; const wdt = tg.length * 6 + 14; rect(F, tagX, y + 6, wdt, 16, C.white, { radius: 8, stroke: bd }); text(F, tg, tagX, y + 7, 9, HEADM, col, { width: wdt, align: "CENTER" }); }
      text(F, p.t, MAIN_X + 200, y + 5, 12, BODY, C.sec, { width: 235, lineHeight: 16 });
      text(F, p.d, MAIN_X + 440, y + 5, 13, HEADM, p.d === "—" ? C.muted : C.dark);
      text(F, p.desc || "", MAIN_X + 500, y + 3, 12, BODY, C.muted, { width: 240, lineHeight: 15 });
      y += rh; rect(F, MAIN_X, y - 1, MAIN_W, 1, C.border);
    };
    D.subs.forEach((sub, si) => {
      text(F, sub.name, MAIN_X, y, 18, HEAD, C.dark);
      text(F, "extends " + sub.ext, MAIN_X + sub.name.length * 10 + 14, y + 4, 12, BODY, C.muted);
      if (si === 0) marker(F, 8, MAIN_X + sub.name.length * 10 + 130, y - 2, 18);
      y += 30;
      if (sub.name === "Tabs.Root") {
        rect(F, MAIN_X, y, MAIN_W, 44, C.ctlTint, { radius: 8, stroke: C.ctlBorder });
        text(F, "Controlled vs uncontrolled — pass value + onValueChange, OR defaultValue. Mutually exclusive.", MAIN_X + 14, y + 14, 13, BODYM, C.ctlTag, { width: MAIN_W - 28 });
        marker(F, 9, MAIN_X + MAIN_W - 24, y - 4, 18);
        y += 56;
      }
      [["Prop", 0], ["Type", 200], ["Default", 440], ["Description", 500]].forEach(c => text(F, c[0], MAIN_X + c[1], y, 11, HEADM, C.muted, { spacing: 3 }));
      y += 20; rect(F, MAIN_X, y, MAIN_W, 1, C.border); y += 8;
      sub.props.forEach(p => propRow(p, p.tag));
      sub.contract.forEach(p => propRow(p, "contract"));
      y += 26;
    });

    heading("Keyboard interactions", 10);
    [["Key", 0], ["Behaviour", 180]].forEach(c => text(F, c[0], MAIN_X + c[1], y, 11, HEADM, C.muted, { spacing: 3 }));
    y += 20; rect(F, MAIN_X, y, MAIN_W, 1, C.border); y += 10;
    D.keyboard.forEach(k => { rect(F, MAIN_X, y - 2, 150, 26, C.ph, { radius: 6, stroke: C.border }); text(F, k[0], MAIN_X + 12, y + 3, 13, HEADM, C.dark); text(F, k[1], MAIN_X + 180, y + 3, 13, BODY, C.sec, { width: MAIN_W - 180 }); y += 38; });
    y += 20;

    heading("Styling contract", 11);
    text(F, "CSS variables + data attributes — mode-agnostic styling hooks (§1.5/§1.6)", MAIN_X, y - 8, 13, BODY, C.muted); y += 22;
    D.cssVars.forEach((v, i) => text(F, v, MAIN_X + (i % 2) * 370, y + Math.floor(i / 2) * 28, 12, BODY, C.dark));
    y += Math.ceil(D.cssVars.length / 2) * 28 + 6;
    text(F, "… " + D.cssVarCount + " CSS vars", MAIN_X, y, 13, BODYM, C.muted);
    text(F, "data-attributes:  " + D.dataAttrs.join("   "), MAIN_X + 160, y, 12, BODY, C.sec);
    y += 44;

    heading("Examples");
    const exW = (MAIN_W - 20) / 2;
    [["Controlled", "value + onValueChange"], ["Vertical, manual", 'orientation="vertical"']].forEach((e, i) => { const ex = MAIN_X + i * (exW + 20); rect(F, ex, y, exW, 110, C.white, { radius: 10, stroke: C.border }); text(F, e[0], ex + 16, y + 14, 15, HEAD, C.dark); rect(F, ex + 16, y + 44, exW - 32, 50, C.ph, { radius: 6 }); text(F, e[1], ex + 28, y + 62, 12, BODY, C.muted); });
    y += 110 + 40;
    const contentBottom = y;

    let ty = NAV + 40;
    text(F, "ON THIS PAGE", TOC_X, ty, 11, HEADM, C.muted, { spacing: 5 }); marker(F, 12, TOC_X + 132, ty - 4, 18); ty += 26;
    const tocItems = [["Playground", 0, true], ["Anatomy", 0], ["Installation", 0], ["Props", 0], ["Tabs.Root", 1], ["Tabs.List", 1], ["Tabs.Trigger", 1], ["Tabs.Content", 1], ["Keyboard", 0], ["Styling contract", 0], ["Examples", 0]];
    tocItems.forEach(([t, lvl, act]) => { if (act) rect(F, TOC_X - 12, ty - 2, 3, 18, C.dark); text(F, t, TOC_X + (lvl ? 14 : 0), ty, lvl ? 13 : 14, act ? HEADM : BODY, act ? C.dark : (lvl ? C.muted : C.sec)); ty += lvl ? 24 : 27; });

    FH = Math.max(contentBottom, ty) + 48; F.resize(W, FH); sbBg.resize(SB_W, FH - NAV); sbBorder.resize(1, FH - NAV);
  }

  // ============================================================ MOBILE
  {
    const W = 390, M = 20, CW = W - M * 2, X0 = 2140;
    text(page, "Component page — Tabs (mobile · Styled)", X0, -64, 22, HEAD, C.dark);
    const F = figma.createFrame(); F.name = "Component page — Tabs (mobile)"; F.x = X0; F.y = 0; F.resize(W, 3400); F.fills = solid(C.white); F.clipsContent = true; page.appendChild(F);
    rect(F, 0, 0, W, 56, C.white); rect(F, 0, 55, W, 1, C.border);
    rect(F, M, 16, 22, 22, C.dark, { radius: 6 }); text(F, "Primitiv", M + 30, 15, 18, HEAD, C.dark);
    for (let i = 0; i < 3; i++) rect(F, W - M - 22, 18 + i * 7, 22, 2.5, C.dark, { radius: 1 });
    dropdownField(F, M, 68, CW, 40, "Mode", "Styled");
    let y = 128;
    text(F, "Components  /  ", M, y, 12, BODY, C.muted); text(F, "Tabs", M + 88, y, 12, BODYM, C.dark);
    y += 26;
    text(F, D.name, M, y, 34, HEAD, C.dark);
    rect(F, M + 74, y + 10, 60, 22, "#E6F4EA", { radius: 11, stroke: "#9BD3AE" }); text(F, D.status, M + 74, y + 13, 12, HEADM, "#2F7A45", { width: 60, align: "CENTER" });
    y += 46;
    text(F, D.description, M, y, 15, BODY, C.sec, { width: CW, lineHeight: 22 });
    y += 60;
    const heading = (label) => { text(F, label, M, y, 24, HEAD, C.dark); y += 36; };

    heading("Playground");
    rect(F, M, y, CW, 118, C.white, { radius: 12, stroke: C.border });
    ["Account", "Password", "Team"].forEach((t, i) => { const tx = M + 14 + i * 84; text(F, t, tx, y + 16, 13, HEADM, i === 0 ? C.dark : C.muted, { width: 76, align: "CENTER" }); if (i === 0) rect(F, tx, y + 38, 76, 2, C.dark); });
    rect(F, M + 14, y + 39, CW - 28, 1, C.border); rect(F, M + 14, y + 54, CW - 28, 48, C.ph, { radius: 6 }); text(F, "Panel content…", M + 26, y + 70, 12, BODY, C.muted);
    y += 130;
    dropdownField(F, M, y, CW, 42, "Orientation", "horizontal"); y += 50;
    dropdownField(F, M, y, CW, 42, "Size", "md"); y += 50;
    dropdownField(F, M, y, CW, 42, "Justify", "start"); y += 50;
    dropdownField(F, M, y, CW, 42, "Density", "Comfortable"); y += 58;

    heading("Anatomy");
    const anaH = D.anatomy.length * 18 + 20; rect(F, M, y, CW, anaH, C.codeBg, { radius: 10, stroke: C.border });
    D.anatomy.forEach((ln, i) => text(F, ln, M + 12, y + 12 + i * 18, 10.5, BODY, C.sec));
    y += anaH + 30;

    heading("Installation");
    pmCodeBlock(F, M, y, CW, "npx " + D.styledInstall, { copy: false }); y += 96;
    text(F, 'import { Tabs } from "@/components/ui/tabs"', M, y, 12, BODY, C.sec, { width: CW }); y += 36;

    heading("Props");
    const propCard = (p, kind) => {
      const ch = 92, tint = kind === "contract" ? C.styledTint : (kind === "controlled" || kind === "uncontrolled") ? C.ctlTint : C.white, bd = kind === "contract" ? C.styledBorder : (kind ? C.ctlBorder : C.border);
      rect(F, M, y, CW, ch, tint, { radius: 10, stroke: bd });
      text(F, p.n, M + 14, y + 11, 15, HEADM, C.dark);
      let tagX = M + 14 + p.n.length * 8 + 10;
      if (p.req) { text(F, "required", tagX, y + 13, 9, HEADM, "#B23B3B"); tagX += 44; }
      if (kind) { const tg = kind === "contract" ? "contract" : kind, col = kind === "contract" ? C.styledTag : C.ctlTag, b2 = kind === "contract" ? C.styledBorder : C.ctlBorder, wd = tg.length * 6 + 12; rect(F, tagX, y + 12, wd, 15, C.white, { radius: 7, stroke: b2 }); text(F, tg, tagX, y + 13, 8.5, HEADM, col, { width: wd, align: "CENTER" }); }
      text(F, "default " + p.d, M + 14, y + 12, 11, BODY, C.muted, { width: CW - 28, align: "RIGHT" });
      text(F, p.t, M + 14, y + 34, 11, BODY, C.sec, { width: CW - 28, lineHeight: 15 });
      text(F, p.desc || "", M + 14, y + 54, 11, BODY, C.muted, { width: CW - 28, lineHeight: 14 });
      y += ch + 8;
    };
    D.subs.forEach(sub => {
      text(F, sub.name, M, y, 17, HEAD, C.dark); text(F, "extends " + sub.ext, M + sub.name.length * 9 + 12, y + 4, 11, BODY, C.muted); y += 28;
      if (sub.name === "Tabs.Root") { rect(F, M, y, CW, 52, C.ctlTint, { radius: 8, stroke: C.ctlBorder }); text(F, "Controlled vs uncontrolled — value + onValueChange, OR defaultValue. Mutually exclusive.", M + 12, y + 10, 12, BODYM, C.ctlTag, { width: CW - 24, lineHeight: 15 }); y += 64; }
      sub.props.forEach(p => propCard(p, p.tag)); sub.contract.forEach(p => propCard(p, "contract"));
      y += 16;
    });

    heading("Keyboard");
    D.keyboard.forEach(k => { rect(F, M, y, 96, 24, C.ph, { radius: 6, stroke: C.border }); text(F, k[0], M + 8, y + 4, 12, HEADM, C.dark, { width: 80 }); text(F, k[1], M + 108, y + 4, 12, BODY, C.sec, { width: CW - 108, lineHeight: 15 }); y += 36; });
    y += 16;

    heading("Styling contract");
    D.cssVars.slice(0, 4).forEach(v => { text(F, v, M, y, 12, BODY, C.dark); y += 24; });
    text(F, "… " + D.cssVarCount + " CSS vars · data-attrs: " + D.dataAttrs.join(" "), M, y, 11, BODY, C.muted, { width: CW }); y += 40;
    F.resize(W, y + 24);
  }

  // ============================================================ FINDINGS
  {
    const NP = figma.createFrame(); NP.name = "Tabs findings"; NP.x = 1520; NP.y = 0; NP.resize(560, 700);
    NP.fills = solid(C.note); NP.cornerRadius = 12; NP.strokes = solid(C.noteBorder); NP.strokeWeight = 1; page.appendChild(NP);
    text(NP, "Findings — Tabs stress test", 28, 28, 22, HEAD, C.dark);
    const intro = "What a compound component exposed that Button didn't. Data still generated by the extractor (scripts/docs-data/tabs.docs.json): 4 sub-components, 15 headless props, 2 contract props, 22 CSS vars.";
    text(NP, intro, 28, 60, 13, BODY, C.noteText, { width: 500, lineHeight: 18 });
    const findings = [
      ["Multiple prop tables", "One table per sub-component (Root/List/Trigger/Content). The single Props section fans out and the page grows to ~3000px. TOC now nests (Props → the four parts). Collapsible sub-sections may be worth it."],
      ["Controlled/uncontrolled isn't extractable", "The flat prop list loses the value+onValueChange XOR defaultValue mutual-exclusivity. Needs a hand-authored callout (added, amber) or a schema 'prop group' concept — a §1.7 gap for stateful components."],
      ["Source bug found — 2 new §1.16 instances", "TabsRootProps.defaultValue and TabsTriggerProps.value narrow a native attr WITHOUT Omit-ting it, so extraction saw 'string | (readonly string[] & string)'. The extractor cleans it; the source should add the Omit (lint candidate)."],
      ["Aliased/complex types need resolving", "String-literal aliases (TabsOrientation…) must expand to their values — the extractor now does. Non-literal aliases still leak the name (TabMetadata, Ref<T>) → need a linked types glossary."],
      ["Generics leak a type param", "Tabs.Trigger<T> shows ref: Ref<T>. Generic sub-components need a display rule (show the default element)."],
      ["Interactive ⇒ real a11y + data-attrs", "A Keyboard-interactions table (not bullets) and per-sub-component data-attributes appear. Hand-authored (§1.7) — the a11y burden scales with complexity."],
      ["New sections for compound", "Anatomy (composition) is essential and Button never needed it. Playground controls now come from 3 sources — a headless enum prop (orientation), contract props (size/justify) and the Context system (density) — labelled by origin."],
    ];
    let ny = 60 + Math.ceil(intro.length / 62) * 18 + 24;
    findings.forEach((f, i) => {
      const c = figma.createEllipse(); c.x = 28; c.y = ny; c.resize(20, 20); c.fills = solid(C.dark); NP.appendChild(c);
      text(NP, String(i + 1), 28, ny + 3, 11, HEADM, C.white, { width: 20, align: "CENTER" });
      text(NP, f[0], 60, ny - 1, 14, HEADM, C.dark, { width: 470 });
      text(NP, f[1], 60, ny + 21, 12.5, BODY, C.dark, { width: 470, lineHeight: 17 });
      ny += 21 + Math.ceil(f[1].length / 58) * 17 + 22;
    });
    NP.resize(560, ny + 12);
  }

  const FD = page.children.find(c => c.name === "Component page — Tabs (desktop)");
  await figma.setCurrentPageAsync(page); figma.viewport.scrollAndZoomIntoView([FD]);
  return { page: PAGE, frames: page.children.map(c => c.name) };
})();
