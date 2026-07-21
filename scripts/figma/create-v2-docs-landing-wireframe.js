// Docs Site — Landing page, rough wireframe (v2 — full-screen hero + mobile)
//
// Paste into the Figma desktop developer console (Plugins → Development →
// Open console; type "allow pasting" first). Creates / refreshes the page
// "Wireframes — Docs Site (v1 — landing)". Artefacts: desktop frame,
// mobile frame, mobile menu-open frame (390×844, controls as a dropdown
// group), mobile framework-dropdown open-state frame, and a notes panel.
// Also adds a framework selector (React active + logo; Vue/Svelte greyed
// as future) and package-manager-tabbed install blocks (npm/pnpm/yarn/bun).
// Legacy list below:
//   • "Landing (desktop)" — 1440-wide frame
//   • "Landing (mobile)"  — 390-wide frame
//   • "Wireframe notes"    — reviewer notes panel keyed to the markers
//
// v2 adds (feedback pass):
//   • a full-screen hero: the real Primitiv Stacked lockup (component
//     441:405) centered on a light dot-grid texture, headline beneath,
//     CTAs + scroll cue; the nav sits transparent over the texture.
//   • a mobile breakpoint of the whole page.
//
// Wireframes the two structural decisions in docs/docs-site-planning.md this
// pass targets — §1.1 (global consumption-mode switch) and §1.4 (top-level
// nav structure / "Documentation map") — plus the adjacent §1.2 audience
// fork, §1.3 Start-Here framing, §1.13 "Getting this component" block, and
// §1.17 missing Search/Badge. Rough boxes/text only; refinement happens by
// hand in Figma afterwards. Fonts are the design-system faces (Khand
// headings/labels, Asta Sans body). Numbered markers ①–⑨ map to the notes.
//
// Re-running is safe: the page contents are cleared and rebuilt.

return (async function () {
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
    dark: "#1E1E1E", muted: "#AAAAAA", sec: "#555555", ph: "#F8F8F8",
    note: "#FFF3CD", noteBorder: "#E8C766", noteText: "#7A5C00", chip: "#F4F4F4",
    heroBg: "#FAFAFB", dot: "#E4E4EA",
  };
  const LOCKUP_ID = "441:405"; // Lockup / Brand=Primitiv, Layout=Stacked, Theme=Light

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
  async function lockup(parent, targetH, x, y) {
    const comp = await figma.getNodeByIdAsync(LOCKUP_ID);
    const inst = comp.createInstance();
    inst.rescale(targetH / inst.height);
    inst.x = x != null ? x : 0; inst.y = y; parent.appendChild(inst); return inst;
  }
  function dotGrid(parent, w, h, sp, ds) {
    for (let gx = sp / 2; gx < w; gx += sp) for (let gy = sp / 2; gy < h; gy += sp) {
      const d = figma.createEllipse(); d.x = gx; d.y = gy; d.resize(ds, ds); d.fills = solid(C.dot); parent.appendChild(d);
    }
  }
  const REACT_SVG = (col) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="22" viewBox="-12 -11 24 22"><circle r="2" fill="${col}"/><g fill="none" stroke="${col}" stroke-width="1.3"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg>`;
  // Vue / Svelte logo marks in greyed tones (the options are disabled/future).
  const VUE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M24 1.61h-9.94L12 5.16 9.94 1.61H0l12 20.78z" fill="#B7B7BD"/><path d="M14.06 1.61 12 5.16 9.94 1.61H5.16L12 13.42 18.84 1.61z" fill="#87878F"/></svg>';
  const SVELTE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#9A9AA0" d="M10.354 21.125a4.44 4.44 0 0 1-4.765-1.767 4.109 4.109 0 0 1-.703-3.107 3.898 3.898 0 0 1 .134-.522l.105-.321.287.21a7.21 7.21 0 0 0 2.186 1.092l.208.063-.02.208a1.253 1.253 0 0 0 .226.83 1.337 1.337 0 0 0 1.435.533 1.231 1.231 0 0 0 .343-.15l5.59-3.562a1.164 1.164 0 0 0 .524-.778 1.242 1.242 0 0 0-.211-.937 1.338 1.338 0 0 0-1.435-.533 1.231 1.231 0 0 0-.343.15l-2.133 1.36a4.078 4.078 0 0 1-1.135.499 4.44 4.44 0 0 1-4.765-1.766 4.108 4.108 0 0 1-.702-3.108 3.855 3.855 0 0 1 1.742-2.582l5.589-3.563a4.072 4.072 0 0 1 1.135-.499 4.44 4.44 0 0 1 4.765 1.767 4.109 4.109 0 0 1 .703 3.107 3.943 3.943 0 0 1-.134.522l-.105.321-.286-.21a7.204 7.204 0 0 0-2.187-1.093l-.208-.063.02-.207a1.255 1.255 0 0 0-.226-.831 1.337 1.337 0 0 0-1.435-.532 1.231 1.231 0 0 0-.343.15L8.62 9.368a1.162 1.162 0 0 0-.524.778 1.24 1.24 0 0 0 .211.937 1.338 1.338 0 0 0 1.435.533 1.235 1.235 0 0 0 .344-.151l2.132-1.36a4.067 4.067 0 0 1 1.135-.498 4.44 4.44 0 0 1 4.765 1.766 4.108 4.108 0 0 1 .702 3.108 3.857 3.857 0 0 1-1.742 2.583l-5.589 3.562a4.072 4.072 0 0 1-1.135.499m10.358-17.95C18.484-.015 14.082-.96 10.9 1.068L5.31 4.63a6.412 6.412 0 0 0-2.896 4.295 6.753 6.753 0 0 0 .666 4.336 6.43 6.43 0 0 0-.96 2.396 6.833 6.833 0 0 0 1.168 5.167c2.229 3.19 6.63 4.135 9.812 2.108l5.59-3.562a6.41 6.41 0 0 0 2.896-4.295 6.756 6.756 0 0 0-.665-4.336 6.429 6.429 0 0 0 .958-2.396 6.831 6.831 0 0 0-1.167-5.168Z"/></svg>';
  // Framework radio group — each option carries its logo mark. React active
  // (white logo on dark); Vue/Svelte greyed (future, v1 is React-only).
  function frameworkSwitch(parent, x, y, w, h) {
    rect(parent, x, y, w, h, C.white, { radius: 8, stroke: C.border });
    const seg = (w - 4) / 3;
    rect(parent, x + 2, y + 2, seg, h - 4, C.dark, { radius: 6 }); // React active
    const items = [
      { svg: REACT_SVG("#FFFFFF"), label: "React", color: C.white },
      { svg: VUE_SVG, label: "Vue", color: C.muted },
      { svg: SVELTE_SVG, label: "Svelte", color: C.muted },
    ];
    items.forEach((it, i) => {
      const sx = x + 2 + i * seg;
      const logo = figma.createNodeFromSvg(it.svg);
      logo.rescale(15 / logo.height);
      const t = text(parent, it.label, 0, y + (h - 16) / 2, 13, HEADM, it.color);
      const cLeft = sx + (seg - (logo.width + 5 + t.width)) / 2;
      logo.x = cLeft; logo.y = y + (h - logo.height) / 2; parent.appendChild(logo);
      t.x = cLeft + logo.width + 5;
    });
  }
  // Install code block with package-manager tabs (npm active).
  function pmCodeBlock(parent, x, y, w, cmd, cmdSize) {
    const bh = 84;
    rect(parent, x, y, w, bh, C.dark, { radius: 8 });
    let tx = x + 16;
    ["npm", "pnpm", "yarn", "bun"].forEach((p, i) => {
      const active = i === 0;
      const tn = text(parent, p, tx, y + 12, 13, HEADM, active ? C.white : "#8A8A93");
      if (active) rect(parent, tx, y + 31, tn.width, 2, C.white);
      tx += tn.width + 20;
    });
    rect(parent, x + w - 64, y + 10, 48, 22, null, { radius: 6, stroke: "#4A4A52" });
    text(parent, "Copy", x + w - 64, y + 13, 12, HEADM, "#B8B8C0", { width: 48, align: "CENTER" });
    rect(parent, x, y + 42, w, 1, "#33333B");
    text(parent, "$  " + cmd, x + 16, y + 56, cmdSize || 14, HEADM, C.white);
  }
  // Compact settings dropdown row: inline label + current value (+ optional logo) + chevron.
  // Used on mobile where three stacked segmented controls are too heavy.
  function dropdownRow(parent, x, y, w, h, label, value, o = {}) {
    const lt = text(parent, label, x + 16, y + (h - 16) / 2, 15, HEADM, C.dark);
    if (o.marker != null) marker(parent, o.marker, x + 16 + lt.width + 8, y + (h - 18) / 2, 18);
    text(parent, "▾", x + w - 30, y + (h - 15) / 2, 14, HEADM, C.muted, { width: 16, align: "CENTER" });
    const vt = text(parent, value, 0, y + (h - 15) / 2, 14, HEADM, C.dark);
    vt.x = x + w - 36 - vt.width;
    if (o.svg) {
      const lg = figma.createNodeFromSvg(o.svg); lg.rescale(15 / lg.height);
      lg.x = vt.x - 6 - lg.width; lg.y = y + (h - lg.height) / 2; parent.appendChild(lg);
    }
  }

  const PAGE_NAME = "Wireframes — Docs Site (v1 — landing)";
  let page = figma.root.children.find(p => p.name === PAGE_NAME);
  if (page) { for (const ch of [...page.children]) ch.remove(); }
  else { page = figma.createPage(); page.name = PAGE_NAME; }

  // ============================================================ DESKTOP
  {
    const W = 1440, M = 80, CW = W - M * 2, HERO = 900;
    text(page, "Docs Site — Landing page  ·  rough wireframe v2  ·  full-screen hero + §1.4 nav + §1.1 mode switch", 0, -64, 22, HEAD, C.dark);

    const F = figma.createFrame();
    F.name = "Landing (desktop)"; F.x = 0; F.y = 0; F.resize(W, 2340);
    F.fills = solid(C.white); F.clipsContent = true; page.appendChild(F);

    const tex = figma.createFrame();
    tex.name = "hero-texture"; tex.x = 0; tex.y = 0; tex.resize(W, HERO);
    tex.fills = solid(C.heroBg); tex.clipsContent = true; F.appendChild(tex);
    dotGrid(tex, W, HERO, 72, 3);

    // nav (transparent over texture)
    rect(F, M, 20, 24, 24, C.dark, { radius: 6 });
    text(F, "Primitiv", M + 34, 19, 20, HEAD, C.dark);
    text(F, "Docs", M + 118, 22, 15, HEADM, C.muted);
    const forkX = 320;
    text(F, "Design in Figma", forkX, 22, 15, HEADM, C.muted);
    text(F, "Build with code", forkX + 150, 22, 15, HEADM, C.dark);
    rect(F, forkX + 150, 46, 116, 2, C.dark);
    marker(F, 2, forkX + 268, 8);
    const rightEnd = W - M, themeW = 32, themeX = rightEnd - themeW;
    const searchW = 190, searchX = themeX - 16 - searchW;
    const modeW = 220, modeX = searchX - 16 - modeW;
    const fwW = 216, fwX = modeX - 16 - fwW;
    // framework selector — React-only for v1; Vue/Svelte greyed as future
    frameworkSwitch(F, fwX, 14, fwW, 36);
    marker(F, 10, fwX + fwW / 2 - 10, -6);
    // mode switch (§1.1)
    rect(F, modeX, 14, modeW, 36, C.white, { radius: 8, stroke: C.border });
    const segW = (modeW - 4) / 3;
    rect(F, modeX + 2, 16, segW, 32, C.dark, { radius: 6 });
    text(F, "Headless", modeX + 2, 24, 13, HEADM, C.white, { width: segW, align: "CENTER" });
    text(F, "Styled", modeX + 2 + segW, 24, 13, HEADM, C.sec, { width: segW, align: "CENTER" });
    text(F, "Figma", modeX + 2 + segW * 2, 24, 13, HEADM, C.sec, { width: segW, align: "CENTER" });
    marker(F, 1, modeX + modeW / 2 - 10, -6);
    // search (§1.17)
    rect(F, searchX, 14, searchW, 36, C.white, { radius: 8, stroke: C.border });
    rect(F, searchX + 12, 25, 12, 12, null, { stroke: C.muted, radius: 6 });
    text(F, "Search docs…", searchX + 34, 24, 13, BODY, C.muted);
    marker(F, 3, searchX + searchW / 2 - 10, -6);
    // theme
    rect(F, themeX, 14, themeW, 32, C.white, { radius: 8, stroke: C.border });
    rect(F, themeX + 9, 21, 14, 14, C.dark, { radius: 7 });

    // hero content
    const inst = await lockup(F, 200, null, 176); inst.x = (W - inst.width) / 2;
    marker(F, 9, W / 2 + inst.width / 2 + 24, 176);
    text(F, "One design system.\nThree ways to build.", 0, 404, 60, HEAD, C.dark, { width: W, align: "CENTER", lineHeight: 62 });
    text(F, "Headless behaviour, an installable styling layer, or a Figma library — pick the surface that fits how you work. The same accessible components sit underneath every mode.", (W - 640) / 2, 556, 18, BODY, C.sec, { width: 640, align: "CENTER", lineHeight: 27 });
    const ctaW = 366, ctaX = (W - ctaW) / 2, ctaY = 656;
    rect(F, ctaX, ctaY, 150, 48, C.dark, { radius: 8 });
    text(F, "Start Here", ctaX, ctaY + 15, 15, HEAD, C.white, { width: 150, align: "CENTER" });
    rect(F, ctaX + 166, ctaY, 200, 48, C.white, { radius: 8, stroke: C.dark, strokeW: 1.5 });
    text(F, "Browse Components", ctaX + 166, ctaY + 15, 15, HEAD, C.dark, { width: 200, align: "CENTER" });
    text(F, "Scroll to explore  ↓", 0, 846, 13, HEADM, C.muted, { width: W, align: "CENTER", spacing: 4 });

    // below the fold
    let y = HERO + 40;
    text(F, "CHOOSE YOUR PATH", M, y, 13, HEADM, C.muted, { spacing: 6 });
    marker(F, 4, M + 182, y - 4);
    y += 24;
    text(F, "How you consume Primitiv", M, y, 30, HEAD, C.dark);
    y += 56;
    const cardGap = 24, cardW = (CW - cardGap * 2) / 3, cardH = 232;
    [
      ["Headless", "Behaviour, props & a11y only. No CSS — you own the styling. Ships as an npm package.", "npm i @primitiv-ui/react", "Headless docs →"],
      ["Styled (registry)", "Headless props plus the style-layer contract & CSS variables. Copied into your app.", "primitiv add <name>", "Styled docs →"],
      ["Figma", "Spec & redline content — the design library for building in Figma, powered by Harmoni.", "Figma library", "Design in Figma →"],
    ].forEach((m, i) => {
      const cx = M + i * (cardW + cardGap);
      rect(F, cx, y, cardW, cardH, C.card, { radius: 12, stroke: C.border });
      rect(F, cx + 24, y + 24, 40, 40, C.canvas, { radius: 8, stroke: C.border });
      text(F, m[0], cx + 24, y + 78, 22, HEAD, C.dark);
      text(F, m[1], cx + 24, y + 112, 14, BODY, C.sec, { width: cardW - 48, lineHeight: 21 });
      rect(F, cx + 24, y + cardH - 66, cardW - 48, 32, C.chip, { radius: 6, stroke: C.border });
      text(F, m[2], cx + 36, y + cardH - 58, 13, HEADM, C.dark);
      text(F, m[3], cx + 24, y + cardH - 24, 14, HEADM, C.dark);
    });

    y = y + cardH + 72;
    text(F, "DOCUMENTATION MAP", M, y, 13, HEADM, C.muted, { spacing: 6 });
    marker(F, 5, M + 202, y - 4);
    y += 24;
    text(F, "Everything in the docs", M, y, 30, HEAD, C.dark);
    y += 52;
    const mapH = 340, mapY = y;
    rect(F, M, y, CW, mapH, C.ph, { radius: 12, stroke: C.border });
    const colX = [M + 40, M + 40 + 620];
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
    tree(0, [["Start Here", 0], ["Concepts", 0], ["What Primitiv is", 1], ["Tokens & theming model", 1], ["Density & the Context system", 1], ["Composition patterns", 1], ["Accessibility commitments", 1], ["Components", 0, "mode-scoped"]]);
    tree(1, [["Registry & CLI", 0], ["Design in Figma", 0], ["Harmoni", 1], ["Recipes / Guides", 0], ["Changelog / Releases", 0]]);

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
    pmCodeBlock(F, M + 32, y + 96, 460, "npm i @primitiv-ui/react");
    text(F, "import path · @primitiv-ui/react/button", M + 32, y + 192, 13, BODY, C.muted);
    text(F, "PROPS", M + 500, y + 34, 12, HEADM, C.muted, { spacing: 4 });
    ["Prop", "Type", "Default"].forEach((c, i) => text(F, c, M + 500 + i * 200, y + 60, 13, HEADM, C.dark));
    rect(F, M + 500, y + 82, CW - 500 - 32, 1, C.border);
    [["asChild", "boolean", "false"], ["variant", "\"solid\" | …", "\"solid\""], ["+ extends", "HTMLButtonElement", "—"]].forEach((r, ri) => {
      r.forEach((cell, ci) => text(F, cell, M + 500 + ci * 200, y + 96 + ri * 30, 13, ci === 0 ? HEADM : BODY, ci === 0 ? C.dark : C.sec));
    });

    y = y + tH + 56;
    rect(F, M, y, CW, 1, C.border);
    y += 28;
    text(F, "Primitiv", M, y, 20, HEAD, C.dark);
    text(F, "Headless components · registry styling · Figma library", M, y + 30, 13, BODY, C.muted);
    [["Docs", "Start Here", "Concepts", "Components"], ["Build", "Registry & CLI", "Recipes", "Changelog"], ["Design", "Design in Figma", "Harmoni", "GitHub"]].forEach((col, i) => {
      const fx = M + 700 + i * 190;
      text(F, col[0], fx, y, 13, HEADM, C.dark, { spacing: 4 });
      col.slice(1).forEach((l, li) => text(F, l, fx, y + 26 + li * 24, 13, BODY, C.sec));
    });
    F.resize(W, y + 130);
  }

  // ============================================================ MOBILE
  {
    const W = 390, M = 20, CW = W - M * 2, HERO = 760, X0 = 2100;
    text(page, "Landing — mobile (390w)", X0, -64, 22, HEAD, C.dark);

    const F = figma.createFrame();
    F.name = "Landing (mobile)"; F.x = X0; F.y = 0; F.resize(W, 2600);
    F.fills = solid(C.white); F.clipsContent = true; page.appendChild(F);

    const tex = figma.createFrame();
    tex.name = "m-hero-texture"; tex.x = 0; tex.y = 0; tex.resize(W, HERO);
    tex.fills = solid(C.heroBg); tex.clipsContent = true; F.appendChild(tex);
    dotGrid(tex, W, HERO, 40, 2.5);

    // nav: logo + hamburger
    rect(F, M, 16, 22, 22, C.dark, { radius: 6 });
    text(F, "Primitiv", M + 30, 15, 18, HEAD, C.dark);
    for (let i = 0; i < 3; i++) rect(F, W - M - 22, 18 + i * 7, 22, 2.5, C.dark, { radius: 1 });

    // global mode switch — full-width sub-bar (§1.1)
    const mbY = 60;
    rect(F, M, mbY, CW, 36, C.white, { radius: 8, stroke: C.border });
    const segW = (CW - 4) / 3;
    rect(F, M + 2, mbY + 2, segW, 32, C.dark, { radius: 6 });
    text(F, "Headless", M + 2, mbY + 9, 13, HEADM, C.white, { width: segW, align: "CENTER" });
    text(F, "Styled", M + 2 + segW, mbY + 9, 13, HEADM, C.sec, { width: segW, align: "CENTER" });
    text(F, "Figma", M + 2 + segW * 2, mbY + 9, 13, HEADM, C.sec, { width: segW, align: "CENTER" });
    marker(F, 1, W - M - 14, mbY - 6, 18);

    // hero content
    const inst = await lockup(F, 130, null, 160); inst.x = (W - inst.width) / 2;
    marker(F, 9, W / 2 + inst.width / 2 + 14, 160, 18);
    text(F, "One design system.\nThree ways to build.", 0, 316, 34, HEAD, C.dark, { width: W, align: "CENTER", lineHeight: 37 });
    text(F, "Headless behaviour, an installable styling layer, or a Figma library — the same accessible components underneath every mode.", M, 404, 15, BODY, C.sec, { width: CW, align: "CENTER", lineHeight: 22 });
    rect(F, M, 494, CW, 48, C.dark, { radius: 8 });
    text(F, "Start Here", M, 509, 15, HEAD, C.white, { width: CW, align: "CENTER" });
    rect(F, M, 550, CW, 48, C.white, { radius: 8, stroke: C.dark, strokeW: 1.5 });
    text(F, "Browse Components", M, 565, 15, HEAD, C.dark, { width: CW, align: "CENTER" });
    text(F, "Scroll to explore  ↓", 0, 706, 13, HEADM, C.muted, { width: W, align: "CENTER", spacing: 4 });

    let y = HERO + 32;
    text(F, "CHOOSE YOUR PATH", M, y, 12, HEADM, C.muted, { spacing: 6 });
    marker(F, 4, M + 168, y - 4, 18);
    y += 22;
    text(F, "How you consume Primitiv", M, y, 26, HEAD, C.dark);
    y += 46;
    const cardH = 150;
    [
      ["Headless", "Behaviour, props & a11y only. No CSS — you own the styling. npm package.", "npm i @primitiv-ui/react"],
      ["Styled (registry)", "Headless props plus the style-layer contract & CSS variables.", "primitiv add <name>"],
      ["Figma", "Spec & redline content — the design library, powered by Harmoni.", "Figma library"],
    ].forEach(m => {
      rect(F, M, y, CW, cardH, C.card, { radius: 12, stroke: C.border });
      rect(F, M + 16, y + 16, 32, 32, C.canvas, { radius: 8, stroke: C.border });
      text(F, m[0], M + 58, y + 20, 18, HEAD, C.dark);
      text(F, m[1], M + 16, y + 58, 13, BODY, C.sec, { width: CW - 32, lineHeight: 19 });
      rect(F, M + 16, y + cardH - 46, CW - 32, 30, C.chip, { radius: 6, stroke: C.border });
      text(F, m[2], M + 28, y + cardH - 39, 12, HEADM, C.dark);
      y += cardH + 16;
    });

    y += 40;
    text(F, "DOCUMENTATION MAP", M, y, 12, HEADM, C.muted, { spacing: 6 });
    marker(F, 5, M + 176, y - 4, 18);
    y += 22;
    text(F, "Everything in the docs", M, y, 26, HEAD, C.dark);
    y += 44;
    const rows = [
      ["Start Here", 0], ["Concepts", 0], ["What Primitiv is", 1], ["Tokens & theming model", 1],
      ["Density & the Context system", 1], ["Composition patterns", 1], ["Accessibility commitments", 1],
      ["Components", 0, "mode-scoped"], ["Registry & CLI", 0], ["Design in Figma", 0], ["Harmoni", 1],
      ["Recipes / Guides", 0], ["Changelog / Releases", 0],
    ];
    const mapTop = y, mapPad = 20, mapH = mapPad * 2 + rows.length * 28;
    rect(F, M, y, CW, mapH, C.ph, { radius: 12, stroke: C.border });
    let ry = mapTop + mapPad;
    rows.forEach(r => {
      const [lbl, lvl, badge] = r;
      const x = M + 20 + (lvl === 1 ? 22 : 0);
      if (lvl === 0) rect(F, M + 20, ry + 6, 8, 8, C.dark, { radius: 2 });
      text(F, lbl, x + 16, ry, lvl === 0 ? 15 : 13, lvl === 0 ? HEADM : BODY, lvl === 0 ? C.dark : C.sec);
      if (badge) {
        const bx = x + 16 + lbl.length * 8 + 10;
        rect(F, bx, ry + 1, 96, 18, C.note, { radius: 9, stroke: C.noteBorder });
        text(F, "mode-scoped", bx, ry + 3, 10, HEADM, C.noteText, { width: 96, align: "CENTER" });
        marker(F, 6, bx + 106, ry - 1, 18);
      }
      ry += 28;
    });
    y += mapH + 40;

    text(F, "ON EVERY COMPONENT PAGE", M, y, 12, HEADM, C.muted, { spacing: 6 });
    marker(F, 7, M + 208, y - 4, 18);
    y += 22;
    text(F, "“Getting this component”", M, y, 26, HEAD, C.dark);
    y += 44;
    const tH = 300;
    rect(F, M, y, CW, tH, C.card, { radius: 12, stroke: C.border });
    text(F, "Button", M + 20, y + 20, 24, HEAD, C.dark);
    rect(F, M + 110, y + 26, 60, 22, "#E6F4EA", { radius: 11, stroke: "#9BD3AE" });
    text(F, "Stable", M + 110, y + 29, 12, HEADM, "#2F7A45", { width: 60, align: "CENTER" });
    marker(F, 8, M + 182, y + 24, 18);
    text(F, "Reflects the global mode switch — Headless:", M + 20, y + 60, 13, BODY, C.sec);
    pmCodeBlock(F, M + 20, y + 82, CW - 40, "npm i @primitiv-ui/react", 13);
    text(F, "PROPS", M + 20, y + 180, 11, HEADM, C.muted, { spacing: 4 });
    rect(F, M + 20, y + 200, CW - 40, 1, C.border);
    [["asChild", "boolean"], ["variant", "\"solid\" | …"], ["+ extends", "HTMLButtonElement"]].forEach((r, ri) => {
      text(F, r[0], M + 20, y + 212 + ri * 26, 13, HEADM, C.dark);
      text(F, r[1], M + 150, y + 212 + ri * 26, 13, BODY, C.sec);
    });
    y += tH + 44;

    rect(F, M, y, CW, 1, C.border);
    y += 24;
    text(F, "Primitiv", M, y, 20, HEAD, C.dark);
    text(F, "Headless · registry styling · Figma library", M, y + 30, 12, BODY, C.muted);
    ["Docs", "Registry & CLI", "Design in Figma", "Changelog", "GitHub"].forEach((l, i) => text(F, l, M, y + 64 + i * 24, 13, BODY, C.sec));
    y += 64 + 5 * 24;
    F.resize(W, y + 40);
  }

  // ============================================== MOBILE — MENU OPEN
  // Device-height (390×844) frame showing the hero with the hamburger
  // expanded into a full-screen menu: audience fork + mode switch + the
  // §1.4 nav links + search + theme toggle.
  {
    const W = 390, H = 844, M = 20, CW = W - M * 2, X0 = 2570;
    text(page, "Landing — mobile, menu open (390×844)", X0, -64, 22, HEAD, C.dark);

    const F = figma.createFrame();
    F.name = "Landing (mobile — menu open)"; F.x = X0; F.y = 0; F.resize(W, H);
    F.fills = solid(C.heroBg); F.clipsContent = true; page.appendChild(F);

    // faint hero texture underneath — the menu overlays the hero
    const tex = figma.createFrame();
    tex.name = "menu-hero-texture"; tex.x = 0; tex.y = 0; tex.resize(W, H);
    tex.fills = solid(C.heroBg); tex.clipsContent = true; F.appendChild(tex);
    dotGrid(tex, W, H, 40, 2.5);
    rect(F, 0, 0, W, H, C.white, { opacity: 0.97 }); // near-opaque menu sheet

    // top bar: logo + close (×)
    rect(F, M, 16, 22, 22, C.dark, { radius: 6 });
    text(F, "Primitiv", M + 30, 15, 18, HEAD, C.dark);
    text(F, "✕", W - M - 24, 14, 22, HEADM, C.dark, { width: 24, align: "CENTER" });
    rect(F, 0, 56, W, 1, C.border);

    let y = 78;
    rect(F, M, y, CW, 44, C.white, { radius: 8, stroke: C.border });
    rect(F, M + 14, y + 15, 14, 14, null, { stroke: C.muted, radius: 7 });
    text(F, "Search docs…", M + 38, y + 12, 14, BODY, C.muted);
    marker(F, 3, W - M - 14, y - 8, 18);
    y += 64;

    // Audience / Mode / Framework as one compact dropdown group (mobile pattern).
    text(F, "VIEW & FRAMEWORK", M, y, 11, HEADM, C.muted, { spacing: 6 });
    y += 20;
    const gcH = 3 * 48;
    rect(F, M, y, CW, gcH, C.white, { radius: 10, stroke: C.border });
    dropdownRow(F, M, y, CW, 48, "Audience", "Build with code", { marker: 2 });
    rect(F, M + 16, y + 48, CW - 32, 1, C.border);
    dropdownRow(F, M, y + 48, CW, 48, "Mode", "Headless", { marker: 1 });
    rect(F, M + 16, y + 96, CW - 32, 1, C.border);
    dropdownRow(F, M, y + 96, CW, 48, "Framework", "React", { svg: REACT_SVG(C.dark), marker: 10 });
    y += gcH + 20;

    rect(F, M, y, CW, 1, C.border);
    y += 16;

    // primary nav (§1.4 top-level)
    const links = [
      ["Start Here", false], ["Concepts", false], ["Components", true],
      ["Registry & CLI", false], ["Design in Figma", false],
      ["Recipes / Guides", false], ["Changelog / Releases", false],
    ];
    const rowH = 50;
    links.forEach((lk, i) => {
      const [lbl, scoped] = lk;
      text(F, lbl, M, y + 15, 20, HEADM, C.dark);
      if (scoped) {
        const bx = M + lbl.length * 10 + 14;
        rect(F, bx, y + 16, 100, 20, C.note, { radius: 10, stroke: C.noteBorder });
        text(F, "mode-scoped", bx, y + 18, 11, HEADM, C.noteText, { width: 100, align: "CENTER" });
        marker(F, 6, bx + 110, y + 15, 18);
      }
      text(F, "›", W - M - 16, y + 8, 24, HEADM, C.muted, { width: 16, align: "CENTER" });
      if (i < links.length - 1) rect(F, M, y + rowH, CW, 1, C.border);
      y += rowH;
    });

    y += 14;
    rect(F, M, y, CW, 1, C.border);
    y += 16;
    text(F, "Theme", M, y + 4, 16, HEADM, C.dark);
    rect(F, W - M - 88, y, 88, 32, C.canvas, { radius: 8, stroke: C.border });
    rect(F, W - M - 86, y + 2, 42, 28, C.dark, { radius: 6 });
    text(F, "Light", W - M - 86, y + 8, 12, HEADM, C.white, { width: 42, align: "CENTER" });
    text(F, "Dark", W - M - 44, y + 8, 12, HEADM, C.sec, { width: 42, align: "CENTER" });
  }

  // ============================== MOBILE — FRAMEWORK MENU (OPEN)
  // The framework dropdown expanded — React selected, Vue/Svelte greyed with
  // "Soon" tags (retains the future-options info the segmented control showed).
  {
    const W = 390, M = 20, CW = W - M * 2, X0 = 2570, Y0 = 904;
    text(page, "Landing — mobile, framework dropdown (open)", X0, Y0 - 40, 22, HEAD, C.dark);
    const F = figma.createFrame();
    F.name = "Landing (mobile — framework menu open)"; F.x = X0; F.y = Y0; F.resize(W, 300);
    F.fills = solid(C.white); F.clipsContent = false; page.appendChild(F);
    text(F, "FRAMEWORK", M, 24, 11, HEADM, C.muted, { spacing: 6 });
    rect(F, M, 44, CW, 46, C.white, { radius: 8, stroke: C.dark, strokeW: 1.5 });
    const lg0 = figma.createNodeFromSvg(REACT_SVG(C.dark)); lg0.rescale(16 / lg0.height);
    lg0.x = M + 14; lg0.y = 44 + (46 - lg0.height) / 2; F.appendChild(lg0);
    text(F, "React", M + 14 + lg0.width + 8, 44 + (46 - 16) / 2, 15, HEADM, C.dark);
    text(F, "▴", M + CW - 30, 44 + (46 - 15) / 2, 14, HEADM, C.sec, { width: 16, align: "CENTER" });
    const pv = rect(F, M, 98, CW, 152, C.white, { radius: 10, stroke: C.border });
    pv.effects = [{ type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.14 }, offset: { x: 0, y: 6 }, radius: 18, spread: 0, visible: true, blendMode: "NORMAL" }];
    [
      { svg: REACT_SVG(C.dark), label: "React", color: C.dark, sel: true },
      { svg: VUE_SVG, label: "Vue", color: C.muted, soon: true },
      { svg: SVELTE_SVG, label: "Svelte", color: C.muted, soon: true },
    ].forEach((o, i) => {
      const oy = 98 + 8 + i * 45;
      if (o.sel) rect(F, M + 6, oy, CW - 12, 44, C.ph, { radius: 6 });
      const lg = figma.createNodeFromSvg(o.svg); lg.rescale(16 / lg.height);
      lg.x = M + 18; lg.y = oy + (44 - lg.height) / 2; F.appendChild(lg);
      text(F, o.label, M + 18 + lg.width + 10, oy + (44 - 16) / 2, 15, HEADM, o.color);
      if (o.sel) text(F, "✓", M + CW - 34, oy + (44 - 16) / 2, 16, HEADM, C.dark);
      if (o.soon) {
        rect(F, M + CW - 68, oy + 11, 52, 22, "#F0F0F2", { radius: 11 });
        text(F, "Soon", M + CW - 68, oy + 14, 11, HEADM, C.muted, { width: 52, align: "CENTER" });
      }
    });
  }

  // ============================================================ NOTES
  {
    const NP = figma.createFrame();
    NP.name = "Wireframe notes"; NP.x = 1520; NP.y = 0; NP.resize(500, 620);
    NP.fills = solid(C.note); NP.cornerRadius = 12; NP.strokes = solid(C.noteBorder); NP.strokeWeight = 1;
    page.appendChild(NP);
    text(NP, "Wireframe notes — Landing (v2)", 28, 28, 20, HEAD, C.dark);
    text(NP, "Rough boxes/text. Desktop + mobile. Refine by hand next.", 28, 58, 13, BODY, C.noteText, { width: 440 });
    const notes = [
      ["9", "Full-screen hero (new, v2 feedback) — real Primitiv Stacked lockup centered on a light dot-grid texture, headline beneath, CTAs + scroll cue. Nav sits transparent over the texture."],
      ["1", "Global, persistent mode switch (§1.1) — Headless / Styled / Figma. Desktop: in nav. Mobile: full-width sub-bar under the nav. localStorage + URL param; colours every page."],
      ["2", "Audience fork (§1.2) — designer vs engineer reading path (desktop nav). Mobile: folds into the hamburger."],
      ["3", "Search / command palette (§1.17) — biggest missing component; not built yet."],
      ["4", "Three path cards mirror the mode switch + the one-paragraph Start-Here framing (§1.3)."],
      ["5", "Documentation map = the §1.4 top-level structure. Desktop: two columns. Mobile: single column."],
      ["6", "Components section is mode-scoped — the switch lives here (§1.4)."],
      ["7", "Per-component “Getting this component” install block — now a tabbed code block so the reader can switch package manager (npm / pnpm / yarn / bun). (§1.4 / §1.13)"],
      ["8", "Status Badge — flagged missing in §1.17 (Callout/admonition also absent)."],
      ["10", "Framework selector — React active (with logo); Vue / Svelte greyed as future (v1 is React-only). Desktop: segmented control in the nav. Mobile: a compact dropdown grouped with Audience & Mode — see the open-state frame."],
    ];
    let ny = 96;
    notes.forEach(n => {
      const c = figma.createEllipse(); c.x = 28; c.y = ny; c.resize(20, 20); c.fills = solid(C.dark); NP.appendChild(c);
      text(NP, n[0], 28, ny + 3, 11, HEADM, C.white, { width: 20, align: "CENTER" });
      const t = text(NP, n[1], 60, ny - 1, 13, BODY, C.dark, { width: 410, lineHeight: 18 });
      ny += Math.max(50, t.height + 14);
    });
    NP.resize(500, ny + 12);
  }

  const F = page.children.find(c => c.name === "Landing (desktop)");
  await figma.setCurrentPageAsync(page);
  figma.viewport.scrollAndZoomIntoView([F]);
  return { page: page.name, frames: page.children.map(c => c.name) };
})();
