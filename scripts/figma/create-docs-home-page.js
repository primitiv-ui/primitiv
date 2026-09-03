// Docs Site — Home page, system build (v1), with deliberate illustration gaps.
//
// Paste into the Figma desktop developer console (Plugins → Development →
// Open console; type "allow pasting" first), or run through the Desktop
// Bridge with figma_execute.
//
// WHAT IT BUILDS
//   Page "Docs — Home page (v1)" holding three artefacts:
//     • "Home (desktop)" — 1440 wide, the ten sections of
//       docs/docs-site-home-copy.md in order, plus a new footer.
//     • "Home (mobile)"  — 390 wide, the same sections re-stacked.
//     • "Illustration gaps" — a legend listing all ten briefs.
//
// THE GAPS ARE THE POINT. Every illustration from the copy doc is left as a
// labelled, dashed placeholder carrying its brief id, type, aspect and
// one-line job. A design model fills them later; nothing here guesses at
// artwork.
//
// COMPOSITION RULES (docs-site-planning.md §1.23)
//   Real component instances and bound variables only — no anonymous
//   scaffold frames, no hardcoded hex where a token exists. Components and
//   variables are resolved BY NAME at run time, so this script needs no
//   node ids baked in and survives the file being reorganised.
//
// THE HEADER IS CLONED, NOT REBUILT. It is lifted from the existing
// system-build landing frame so the two pages cannot drift. If that frame
// cannot be found the script says so and builds nothing rather than
// inventing a lookalike.
//
// Re-running is safe: the page's contents are cleared and rebuilt.
//
// Gotchas honoured (root CLAUDE.md, "Figma plugin-API gotchas"):
//   (22) createFrame defaults to layoutMode NONE — set it explicitly.
//   (7)  resize() silently flips primaryAxisSizingMode to FIXED — re-assert.
//   (13) append the instance FIRST, then configure it.
//   (6)  set textAutoResize before measuring a text node.
//   (28) createVector/createRectangle ship a default stroke — clear it.

return (async function () {
  if (typeof figma.loadAllPagesAsync === "function") {
    try { await figma.loadAllPagesAsync(); } catch (e) {}
  }

  /* ── fonts ──────────────────────────────────────────────────────────── */
  await Promise.all([
    figma.loadFontAsync({ family: "Khand", style: "SemiBold" }),
    figma.loadFontAsync({ family: "Khand", style: "Medium" }),
    figma.loadFontAsync({ family: "Khand", style: "Regular" }),
    figma.loadFontAsync({ family: "Asta Sans", style: "Regular" }),
    figma.loadFontAsync({ family: "Asta Sans", style: "Medium" }),
  ]);

  const DISPLAY  = { family: "Khand", style: "SemiBold" };
  const HEADING  = { family: "Khand", style: "SemiBold" };
  const LABEL    = { family: "Khand", style: "Medium" };
  const OVERLINE = { family: "Khand", style: "Medium" };
  const BODY     = { family: "Asta Sans", style: "Regular" };
  const BODYMED  = { family: "Asta Sans", style: "Medium" };
  const MONO     = { family: "Asta Sans", style: "Regular" }; // no mono face in file

  /* ── variable + component resolvers ─────────────────────────────────── */
  const varIndex = new Map();
  {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    for (const col of collections) {
      for (const id of col.variableIds) {
        const v = await figma.variables.getVariableByIdAsync(id);
        if (v) varIndex.set(v.name, v);
      }
    }
  }
  const V = (name) => varIndex.get(name) || null;

  const compIndex = new Map();
  for (const page of figma.root.children) {
    for (const child of page.children) {
      if (child.type === "COMPONENT_SET" || child.type === "COMPONENT") {
        if (!compIndex.has(child.name)) compIndex.set(child.name, child);
      }
    }
  }
  const findComp = (name) => compIndex.get(name) || null;

  const missing = [];
  function requireComp(name) {
    const c = findComp(name);
    if (!c) missing.push(name);
    return c;
  }

  /* ── paint helpers ──────────────────────────────────────────────────── */
  const HEX = {
    surface: "#FFFFFF", subtle: "#F7F8FA", raised: "#FFFFFF",
    border: "#E3E6EA", borderSubtle: "#EDEFF2", strong: "#C6CBD2",
    primary: "#16191D", secondary: "#4A5057", muted: "#8A9099",
    brand: "#236CE1", gap: "#F4F6F9", gapBorder: "#B9C0C9", gapText: "#5C636C",
  };
  const rgb = (hex) => ({
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
  });
  const solid = (hex, opacity) => {
    const p = { type: "SOLID", color: rgb(hex) };
    if (opacity != null) p.opacity = opacity;
    return [p];
  };
  /** Bind a fill to a variable when it exists, else fall back to a literal. */
  function paint(node, varName, fallbackHex) {
    const v = V(varName);
    if (v) {
      try {
        const bound = figma.variables.setBoundVariableForPaint(
          { type: "SOLID", color: rgb(fallbackHex) }, "color", v,
        );
        node.fills = [bound];
        return true;
      } catch (e) { /* fall through */ }
    }
    node.fills = solid(fallbackHex);
    return false;
  }

  /* ── layout helpers ─────────────────────────────────────────────────── */
  /**
   * An auto-layout frame. createFrame() defaults to layoutMode NONE
   * (gotcha 22), so the mode is always set here rather than assumed.
   */
  function stack(parent, name, o = {}) {
    const f = figma.createFrame();
    f.name = name;
    f.layoutMode = o.dir === "row" ? "HORIZONTAL" : "VERTICAL";
    f.itemSpacing = o.gap != null ? o.gap : 0;
    f.paddingTop = o.pt != null ? o.pt : (o.py != null ? o.py : 0);
    f.paddingBottom = o.pb != null ? o.pb : (o.py != null ? o.py : 0);
    f.paddingLeft = o.pl != null ? o.pl : (o.px != null ? o.px : 0);
    f.paddingRight = o.pr != null ? o.pr : (o.px != null ? o.px : 0);
    f.primaryAxisSizingMode = "AUTO";
    f.counterAxisSizingMode = o.width ? "FIXED" : "AUTO";
    if (o.align) f.counterAxisAlignItems = o.align;
    if (o.justify) f.primaryAxisAlignItems = o.justify;
    f.fills = o.fill ? solid(o.fill) : [];
    if (o.fillVar) paint(f, o.fillVar, o.fill || HEX.surface);
    if (o.radius != null) f.cornerRadius = o.radius;
    if (o.clip != null) f.clipsContent = o.clip;
    parent.appendChild(f);                        // append first (gotcha 13)
    if (o.width) {
      f.resize(o.width, Math.max(f.height, 1));
      f.primaryAxisSizingMode = "AUTO";           // re-assert (gotcha 7)
    }
    if (o.fillWidth) f.layoutSizingHorizontal = "FILL";
    return f;
  }

  function txt(parent, chars, o = {}) {
    const t = figma.createText();
    t.fontName = o.font || BODY;
    t.fontSize = o.size || 16;
    t.textAutoResize = "HEIGHT";                  // before measuring (gotcha 6)
    parent.appendChild(t);
    if (o.width) t.resize(o.width, t.height);
    if (o.lineHeight) t.lineHeight = { value: o.lineHeight, unit: "PIXELS" };
    if (o.tracking) t.letterSpacing = { value: o.tracking, unit: "PERCENT" };
    if (o.align) t.textAlignHorizontal = o.align;
    t.characters = chars;
    paint(t, o.colorVar || "content/primary", o.color || HEX.primary);
    if (o.fillWidth) t.layoutSizingHorizontal = "FILL";
    return t;
  }

  const overline = (parent, s) =>
    txt(parent, s.toUpperCase(), {
      font: OVERLINE, size: 12, tracking: 8,
      colorVar: "content/muted", color: HEX.muted,
    });
  const h2 = (parent, s, w) =>
    txt(parent, s, { font: HEADING, size: 40, lineHeight: 44, width: w, fillWidth: !w });
  const h4 = (parent, s, w) =>
    txt(parent, s, { font: HEADING, size: 20, lineHeight: 26, width: w, fillWidth: !w });
  const bodyLg = (parent, s, w) =>
    txt(parent, s, { size: 18, lineHeight: 28, width: w, fillWidth: !w,
                     colorVar: "content/secondary", color: HEX.secondary });
  const bodyMd = (parent, s, w) =>
    txt(parent, s, { size: 16, lineHeight: 26, width: w, fillWidth: !w,
                     colorVar: "content/secondary", color: HEX.secondary });
  const bodySm = (parent, s, w) =>
    txt(parent, s, { size: 14, lineHeight: 22, width: w, fillWidth: !w,
                     colorVar: "content/muted", color: HEX.muted });

  /* ── the illustration gap ───────────────────────────────────────────── */
  /**
   * A deliberate hole in the design, carrying everything a maker needs to
   * fill it: the brief id (which keys into docs-site-home-copy.md), what
   * kind of artwork it is, its aspect, and the one-line job. Dashed so it
   * reads as an intentional gap rather than an unfinished box.
   */
  function gap(parent, brief, width) {
    const h = Math.round(width / brief.ratio);
    const g = stack(parent, `GAP · ${brief.id}`, {
      width, gap: 8, px: 24, py: 24, align: "CENTER", justify: "CENTER",
      radius: 8, fill: HEX.gap,
    });
    g.strokes = solid(HEX.gapBorder);
    g.strokeWeight = 1.5;
    g.dashPattern = [8, 6];
    g.minHeight = h;
    g.counterAxisAlignItems = "CENTER";
    g.primaryAxisAlignItems = "CENTER";

    txt(g, brief.id, { font: LABEL, size: 15, tracking: 4, align: "CENTER",
                       color: HEX.gapText, colorVar: "content/secondary" });
    txt(g, `${brief.type}  ·  ${brief.ratioLabel}`, {
      font: BODYMED, size: 12, align: "CENTER",
      color: HEX.muted, colorVar: "content/muted" });
    txt(g, brief.job, { size: 13, lineHeight: 20, align: "CENTER",
                        width: Math.min(width - 96, 520),
                        color: HEX.gapText, colorVar: "content/secondary" });
    return g;
  }

  /** Every gap on the page, in reading order. Ids match the copy doc. */
  const BRIEFS = [
    { id: "HERO-01", type: "screenshot", ratio: 16 / 10, ratioLabel: "16:10",
      job: "A specimen board of real components at rest, dark in front with a light twin behind. Establishes that the system is finished before a word is read." },
    { id: "PROBLEM-01", type: "screenshot", ratio: 3, ratioLabel: "3:1",
      job: "Three 'Save changes' buttons from three teams, subtly different. Drift made visible. Must not be exaggerated." },
    { id: "DENSITY-01", type: "live demo", ratio: 16 / 9, ratioLabel: "16:9",
      job: "Four density radios above a two-region stage — operations left, editorial right — both reflowing from one dial. The claim is range, not adjustability." },
    { id: "DENSITY-02", type: "diagram", ratio: 4 / 3, ratioLabel: "4:3",
      job: "The same button at four densities with its real height and derived radius, above radius = height x 0.1875." },
    { id: "COLOUR-01", type: "screenshot", ratio: 5 / 3, ratioLabel: "5:3",
      job: "The real shipped palette: six ramps of ten steps, 'Ag' on every swatch in the engine's own best_foreground, step number beneath." },
    { id: "COLOUR-02", type: "diagram", ratio: 4 / 3, ratioLabel: "4:3",
      job: "A drifting blue ramp above Primitiv's own, each with a hue track beneath — scattered markers versus stacked." },
    { id: "FIGMA-01", type: "screenshot", ratio: 2, ratioLabel: "2:1",
      job: "A genuine Figma canvas beside a genuine browser render at matched scale, shared token names listed between them." },
    { id: "CODE-01", type: "animation", ratio: 16 / 10, ratioLabel: "16:10",
      job: "primitiv add button runs, the real file arrives, then a padding value is edited and the preview follows. The edit is the argument." },
    { id: "PATHS-01", type: "diagram", ratio: 5 / 2, ratioLabel: "5:2",
      job: "Headless, Styled and Figma as layers over one shared base of tokens and behaviours. Stops 'three ways' reading as fragmentation." },
    { id: "A11Y-01", type: "animation", ratio: 4 / 3, ratioLabel: "4:3",
      job: "A form driven entirely by keyboard, each key shown as a Kbd, no pointer on screen at any point." },
  ];
  const brief = (id) => BRIEFS.find((b) => b.id === id);

  /* ── borrow the header ──────────────────────────────────────────────── */
  /**
   * Cloned from the existing system-build landing frame rather than rebuilt,
   * so the home page and the landing wireframe cannot disagree about the
   * chrome. Searched by name across pages; the first frame whose name looks
   * like a header inside a system-build landing frame wins.
   */
  function findHeaderSource() {
    const HEADER_HINTS = ["header", "nav", "top bar", "topbar", "site header"];
    const pages = figma.root.children.filter((p) => /docs site|docs — |landing/i.test(p.name));
    for (const page of pages) {
      for (const frame of page.children) {
        if (frame.type !== "FRAME" && frame.type !== "SECTION") continue;
        if (!/landing|home/i.test(frame.name)) continue;
        const walk = (node, depth) => {
          if (depth > 3 || !node.children) return null;
          for (const c of node.children) {
            const n = (c.name || "").toLowerCase();
            if (HEADER_HINTS.some((hint) => n.includes(hint))) return c;
            const deeper = walk(c, depth + 1);
            if (deeper) return deeper;
          }
          return null;
        };
        const found = walk(frame, 0);
        if (found) return { node: found, from: `${page.name} › ${frame.name}` };
      }
    }
    return null;
  }

  const headerSource = findHeaderSource();

  /* ── the new footer ─────────────────────────────────────────────────── */
  /**
   * New in this build. It absorbs the landing page's old "Documentation map"
   * section, which was a nav list pretending to be an argument — a sitemap
   * belongs where readers look for one.
   */
  const FOOTER_COLUMNS = [
    { title: "Documentation", links: ["Start Here", "Components", "Tokens & theming", "Density", "Composition", "Accessibility"] },
    { title: "Build", links: ["The registry & CLI", "Headless package", "Changelog"] },
    { title: "Design", links: ["Figma library", "Harmoni", "Card marks"] },
    { title: "Project", links: ["GitHub", "npm", "JSR", "MIT licence"] },
  ];

  function buildFooter(parent, width, isMobile) {
    const pad = isMobile ? 24 : 96;
    const footer = stack(parent, "Footer", {
      width, gap: isMobile ? 40 : 56, px: pad, pt: isMobile ? 56 : 80,
      pb: isMobile ? 32 : 40, fillVar: "surface/subtle", fill: HEX.subtle,
    });
    footer.layoutSizingHorizontal = "FILL";

    const top = stack(footer, "Footer top", {
      dir: isMobile ? "column" : "row", gap: isMobile ? 40 : 64, fillWidth: true,
    });

    // Brand column
    const brandCol = stack(top, "Brand", { gap: 12, width: isMobile ? width - pad * 2 : 300 });
    const lockup = findComp("Lockup");
    if (lockup) {
      const inst = (lockup.type === "COMPONENT_SET" ? lockup.defaultVariant : lockup).createInstance();
      brandCol.appendChild(inst);                 // append first (gotcha 13)
      try { inst.rescale(28 / inst.height); } catch (e) {}
    } else {
      txt(brandCol, "Primitiv", { font: DISPLAY, size: 24 });
    }
    bodySm(brandCol, "One design system. Three ways to build.", isMobile ? width - pad * 2 : 300);

    // Link columns
    const cols = stack(top, "Link columns", {
      dir: "row", gap: isMobile ? 24 : 48, fillWidth: !isMobile,
    });
    cols.layoutWrap = "WRAP";
    cols.counterAxisSpacing = 32;
    for (const col of FOOTER_COLUMNS) {
      const c = stack(cols, col.title, { gap: 12, width: isMobile ? 150 : 160 });
      txt(c, col.title, { font: LABEL, size: 13, tracking: 4,
                          colorVar: "content/muted", color: HEX.muted });
      const list = findComp("List");
      // A real List where one exists, so the footer is not a hand-rolled <ul>.
      if (list) {
        const inst = (list.type === "COMPONENT_SET" ? list.defaultVariant : list).createInstance();
        c.appendChild(inst);
        try { inst.layoutSizingHorizontal = "FILL"; } catch (e) {}
        inst.name = `${col.title} links`;
      } else {
        for (const l of col.links) bodySm(c, l, isMobile ? 150 : 160);
      }
    }

    // Bottom bar
    const rule = figma.createRectangle();
    footer.appendChild(rule);
    rule.name = "Footer rule";
    rule.resize(Math.max(width - pad * 2, 1), 1);
    rule.strokes = [];                            // clear default (gotcha 28)
    paint(rule, "border/subtle", HEX.borderSubtle);
    rule.layoutSizingHorizontal = "FILL";

    const bottom = stack(footer, "Footer bottom", {
      dir: isMobile ? "column" : "row", gap: isMobile ? 8 : 24, fillWidth: true,
      justify: isMobile ? "MIN" : "SPACE_BETWEEN",
    });
    bodySm(bottom, "© 2026 Primitiv. MIT licensed.", isMobile ? width - pad * 2 : 320);
    bodySm(bottom, "Built with Primitiv.", isMobile ? width - pad * 2 : 200);
    return footer;
  }

  /* ── section scaffolding ────────────────────────────────────────────── */
  function section(parent, name, width, isMobile, o = {}) {
    const pad = isMobile ? 24 : 96;
    const s = stack(parent, name, {
      width, gap: isMobile ? 20 : 28, px: pad,
      pt: isMobile ? 56 : (o.pt != null ? o.pt : 96),
      pb: isMobile ? 56 : (o.pb != null ? o.pb : 96),
      fillVar: o.band ? "surface/subtle" : "surface/default",
      fill: o.band ? HEX.subtle : HEX.surface,
    });
    s.layoutSizingHorizontal = "FILL";
    return s;
  }
  const measure = (width, isMobile) => (isMobile ? width - 48 : Math.min(width - 192, 760));

  /* ── page reset ─────────────────────────────────────────────────────── */
  const PAGE_NAME = "Docs — Home page (v1)";
  let page = figma.root.children.find((p) => p.name === PAGE_NAME);
  if (!page) { page = figma.createPage(); page.name = PAGE_NAME; }
  for (const child of [...page.children]) child.remove();
  figma.currentPage = page;

  /* ── build one breakpoint ───────────────────────────────────────────── */
  async function buildPage(width, isMobile, x) {
    const root = figma.createFrame();
    page.appendChild(root);
    root.name = isMobile ? "Home (mobile)" : "Home (desktop)";
    root.layoutMode = "VERTICAL";
    root.itemSpacing = 0;
    root.primaryAxisSizingMode = "AUTO";
    root.counterAxisSizingMode = "FIXED";
    root.resize(width, 1000);
    root.primaryAxisSizingMode = "AUTO";          // re-assert (gotcha 7)
    root.x = x; root.y = 0;
    root.clipsContent = true;
    paint(root, "surface/default", HEX.surface);

    const M = measure(width, isMobile);

    /* Header — cloned, never rebuilt */
    if (headerSource) {
      const clone = headerSource.node.clone();
      root.appendChild(clone);
      clone.name = "Header (cloned)";
      try { clone.layoutSizingHorizontal = "FILL"; } catch (e) {}
    } else {
      const ph = stack(root, "Header — SOURCE NOT FOUND", {
        width, px: isMobile ? 24 : 96, py: 20, fill: "#FFF3CD", fillWidth: true,
      });
      txt(ph, "Header source frame not found — clone it in by hand from the system-build landing frame.",
          { size: 13, color: "#7A5C00", fillWidth: true });
    }

    /* S1 — Hero */
    {
      const s = section(root, "1 · Hero", width, isMobile, { pt: isMobile ? 64 : 120, pb: isMobile ? 48 : 72 });
      s.counterAxisAlignItems = "CENTER";
      s.itemSpacing = isMobile ? 20 : 28;
      const lockup = findComp("Lockup");
      if (lockup) {
        const inst = (lockup.type === "COMPONENT_SET" ? lockup.defaultVariant : lockup).createInstance();
        s.appendChild(inst);
        try { inst.rescale((isMobile ? 52 : 72) / inst.height); } catch (e) {}
      }
      txt(s, "Interfaces that look designed,\nand prove they're accessible.", {
        font: DISPLAY, size: isMobile ? 40 : 68, lineHeight: isMobile ? 42 : 68,
        align: "CENTER", width: isMobile ? M : 900,
      });
      bodyLg(s, "Colour generated to hold its contrast. Spacing that scales on one dial. 63 components your designers already have in Figma and your developers already have in code.", isMobile ? M : 620)
        .textAlignHorizontal = "CENTER";
      const ctas = stack(s, "CTAs", { dir: isMobile ? "column" : "row", gap: 12, align: "CENTER" });
      const btn = requireComp("Button");
      for (const [label, variant] of [["Get started", "primary"], ["Browse components", "secondary"]]) {
        if (btn && btn.type === "COMPONENT_SET") {
          const v = btn.children.find((c) => /Variant=" ?/.test(c.name) === false && c.name.includes(`Variant=${variant}`) && c.name.includes("Size=lg"))
                 || btn.children.find((c) => c.name.includes(`Variant=${variant}`))
                 || btn.defaultVariant;
          const inst = v.createInstance();
          ctas.appendChild(inst);                 // append first (gotcha 13)
          inst.name = `Button · ${label}`;
          try {
            const keys = Object.keys(inst.componentProperties || {});
            const labelKey = keys.find((k) => k.startsWith("Label"));
            if (labelKey) inst.setProperties({ [labelKey]: label });
          } catch (e) {}
        } else {
          txt(ctas, label, { font: LABEL, size: 16 });
        }
      }
      bodySm(s, "Open source · MIT · Copy the code into your repo and own it", isMobile ? M : 520)
        .textAlignHorizontal = "CENTER";
      gap(s, brief("HERO-01"), isMobile ? M : Math.min(width - 192, 1100));
    }

    /* S2 — Proof strip */
    {
      const s = section(root, "2 · Proof strip", width, isMobile, { band: true, pt: isMobile ? 40 : 56, pb: isMobile ? 40 : 56 });
      const row = stack(s, "Figures", { dir: isMobile ? "column" : "row", gap: isMobile ? 24 : 48, fillWidth: true });
      row.layoutWrap = isMobile ? "NO_WRAP" : "WRAP";
      row.counterAxisSpacing = 24;
      const FIGURES = [
        ["63 components", "in code and in Figma"],
        ["4 density modes", "one attribute changes all of them"],
        ["CSS, SCSS or Tailwind", "the tokens emit to all three"],
        ["100% test coverage", "lines, branches and functions"],
        ["MIT", "engine and components both"],
      ];
      for (const [fig, qual] of FIGURES) {
        const c = stack(row, fig, { gap: 4, width: isMobile ? M : 200 });
        txt(c, fig, { font: DISPLAY, size: isMobile ? 24 : 28, lineHeight: isMobile ? 28 : 32 });
        bodySm(c, qual, isMobile ? M : 200);
      }
      bodySm(s, "⚠ Re-verify every figure against the repo immediately before publishing. Do not copy them from the plan.", isMobile ? M : 640);
    }

    /* S3 — The problem */
    {
      const s = section(root, "3 · The problem", width, isMobile);
      overline(s, "Why this exists");
      h2(s, "You are already paying for a design system.", isMobile ? M : 760);
      bodyLg(s, "Most teams do not decide to build one. They build one by accident, a component at a time, and pay for it in ways that never show up on a roadmap.", M);
      gap(s, brief("PROBLEM-01"), isMobile ? M : Math.min(width - 192, 900));
      const BLOCKS = [
        ["Three developers build three different buttons.", "Nobody meant to. There was no shared one on the day each was needed."],
        ["The design file and the app drift apart.", "The mockup says 16px, the build says 14px, and by the third release nobody trusts either."],
        ["Accessibility becomes a panic before launch.", "Contrast and keyboard support get checked at the end, when fixing them costs the most."],
        ["A rebrand costs a quarter.", "Because the colours live in hundreds of files instead of being derived from one."],
      ];
      const grid = stack(s, "Symptoms", { dir: isMobile ? "column" : "row", gap: 32, fillWidth: true });
      grid.layoutWrap = isMobile ? "NO_WRAP" : "WRAP";
      grid.counterAxisSpacing = 32;
      for (const [head, sub] of BLOCKS) {
        const c = stack(grid, head, { gap: 8, width: isMobile ? M : 420 });
        h4(c, head, isMobile ? M : 420);
        bodyMd(c, sub, isMobile ? M : 420);
      }
      bodyLg(s, "Building the layer that fixes all four takes a team the better part of a year. This is that layer.", M);
    }

    /* S4 — Density (ahead of colour, deliberately) */
    {
      const s = section(root, "4 · Density", width, isMobile);
      overline(s, "Density");
      h2(s, "The same components, from dense dashboard to editorial page.", isMobile ? M : 820);
      bodyLg(s, "Most component libraries are tuned for one kind of product. Use them for something denser and everything feels bloated. Use them for something roomier and it feels cramped.", M);
      bodyLg(s, "Primitiv has four density modes: Dense, Compact, Comfortable and Spacious. Changing one attribute reflows everything beneath it — spacing, control height, corner radius, even type size. An operations tool and a marketing page can run the same components and both look like they were designed for the job.", M);
      gap(s, brief("DENSITY-01"), isMobile ? M : Math.min(width - 192, 1100));
      bodyMd(s, "It is not an all-or-nothing setting. Density is inherited, so you set it once for the whole application, or on any part of a page that needs to be different. A dense table inside a roomy article is one attribute on the table's container.", M);
      const two = stack(s, "Radius", { dir: isMobile ? "column" : "row", gap: 40, fillWidth: true });
      const left = stack(two, "Prose", { gap: 12, width: isMobile ? M : 420 });
      bodyMd(left, "Corner radius is worth singling out, because it shows how the system thinks. It is not a value someone assigns per size. It is a fraction of the control's height, so when density changes the height, the radius follows on its own and stays in proportion.", isMobile ? M : 420);
      gap(two, brief("DENSITY-02"), isMobile ? M : 420);
      bodySm(s, "How density works →", isMobile ? M : 300);
    }

    /* S5 — Colour */
    {
      const s = section(root, "5 · Colour", width, isMobile, { band: true });
      overline(s, "Colour");
      h2(s, "Every swatch already knows what text colour goes on it.", isMobile ? M : 820);
      bodyLg(s, "The letters on each colour below are not a design flourish. They are the actual text colour the engine chose for that swatch, and every one of them clears its contrast minimum.", M);
      bodyLg(s, "That is not a promise we check occasionally. It is a test that runs on every change, across all 100 generated colours in both themes. If a single pairing dropped below the line, the build would stop.", M);
      gap(s, brief("COLOUR-01"), isMobile ? M : Math.min(width - 192, 1100));
      const two = stack(s, "Harmonious", { dir: isMobile ? "column" : "row", gap: 40, fillWidth: true });
      const left = stack(two, "Prose", { gap: 12, width: isMobile ? M : 420 });
      bodyMd(left, "Legible is the low bar. The harder problem is that a colour scale should look like one family, and most do not. Ramps tend to drift in hue as they get lighter, so the pale end of your blue arrives slightly purple. Or they lose their colour and fade toward grey.", isMobile ? M : 420);
      bodyMd(left, "Neither happens here, and neither is left to judgement. The hue is held fixed by construction, the steps are checked to stay visibly distinct from one another, and a ramp that started greying out would fail its test rather than ship.", isMobile ? M : 420);
      gap(two, brief("COLOUR-02"), isMobile ? M : 420);
      bodyMd(s, "The palette is generated rather than picked. A colour engine called Harmoni takes one seed colour per ramp and builds the ten steps around it, deciding the foreground pairings as it goes. Primitiv ships the result, so you get an accessible palette without running anything.", M);
      bodyMd(s, "Harmoni is a Figma plugin and a product in its own right, for teams who want to generate their own palettes this way. You do not need it to use Primitiv.", M);
      bodySm(s, "Harmoni →     How tokens and theming work →", isMobile ? M : 420);
      bodySm(s, "100 generated swatches. Every one has a foreground that clears its contrast minimum, every ramp holds its hue, and no two steps collapse onto the same colour — all checked on every change.", isMobile ? M : 640);
    }

    /* S6 — Figma and code */
    {
      const s = section(root, "6 · Figma and code", width, isMobile);
      overline(s, "Design and build");
      h2(s, "Your design file and your code are built from the same tokens.", isMobile ? M : 820);
      bodyLg(s, "The Figma library is not a drawing of the components. Both are built from one set of tokens, so they cannot quietly disagree about a colour or a spacing value.", M);
      bodyLg(s, "Designers work with the real component sets, at every size and density. Developers get the same components in code. When a token changes, both move.", M);
      gap(s, brief("FIGMA-01"), isMobile ? M : Math.min(width - 192, 1100));
      bodyMd(s, "Two things the design file cannot match exactly, and it is better to know now. Figma cannot express CSS grid inside a component slot, so the Grid component is approximated with wrapping. And Aspect Ratio is fixed-pixel in Figma rather than fluid. Everything else is the same on both sides.", M);
      bodySm(s, "Design in Figma →", isMobile ? M : 300);
    }

    /* S7 — Ownership */
    {
      const s = section(root, "7 · Ownership", width, isMobile, { band: true });
      overline(s, "No lock-in");
      h2(s, "The code lands in your repository.", isMobile ? M : 760);
      bodyLg(s, "Run one command and the component becomes a file in your project. Real, readable code you can open and change. There is no styling engine to fight, and no upgrade that changes your buttons overnight.", M);
      gap(s, brief("CODE-01"), isMobile ? M : Math.min(width - 192, 1100));
      bodyMd(s, "You are not forking the hard part, either. The keyboard handling, the focus management and the ARIA can still come from the npm package, so you own the appearance without owning the behaviour. Or take both. That choice is the next section.", M);
      bodySm(s, "The registry and the CLI →", isMobile ? M : 300);
    }

    /* S8 — Three ways to build */
    {
      const s = section(root, "8 · Three ways to build", width, isMobile);
      overline(s, "Choose your path");
      h2(s, "One design system. Three ways to build.", isMobile ? M : 760);
      bodyLg(s, "Take as much or as little as you need. All three give you the same components underneath.", M);

      const PATHS = [
        { tag: "HEADLESS", who: "You have a design system already, and want the behaviour.",
          what: "Accessible behaviour, keyboard handling and props. No styling at all, so nothing fights what you have.",
          cmd: "npm install @primitiv-ui/react", link: "Headless docs →" },
        { tag: "STYLED", who: "You want components that already look finished.",
          what: "The behaviour plus the design — copied into your project as files you own and can change.",
          cmd: "npx primitiv add button", link: "Styled docs →" },
        { tag: "FIGMA", who: "You are designing, not building yet.",
          what: "The full component library in Figma, built from the same tokens as the code, with Harmoni generating the colour.",
          cmd: "Open the Figma library", link: "Design in Figma →" },
      ];
      const cards = stack(s, "Path cards", { dir: isMobile ? "column" : "row", gap: 24, fillWidth: true });
      const cardComp = findComp("Card");
      for (const p of PATHS) {
        let host;
        if (cardComp) {
          const inst = (cardComp.type === "COMPONENT_SET" ? cardComp.defaultVariant : cardComp).createInstance();
          cards.appendChild(inst);                // append first (gotcha 13)
          inst.name = `Card · ${p.tag}`;
          try { inst.layoutSizingHorizontal = "FILL"; } catch (e) {}
          // Card's own regions are instance sublayers (gotcha 14), so the
          // prose sits in a sibling column beneath rather than inside it.
          host = stack(cards, `${p.tag} content`, { gap: 10, width: isMobile ? M : 380 });
        } else {
          host = stack(cards, `Card · ${p.tag}`, {
            gap: 10, width: isMobile ? M : 380, px: 24, py: 24, radius: 10,
            fillVar: "surface/raised", fill: HEX.raised,
          });
          host.strokes = solid(HEX.border);
          host.strokeWeight = 1;
        }
        txt(host, p.tag, { font: LABEL, size: 12, tracking: 8, colorVar: "content/muted", color: HEX.muted });
        h4(host, p.who, isMobile ? M : 340);
        bodyMd(host, p.what, isMobile ? M : 340);
        txt(host, p.cmd, { font: MONO, size: 13, colorVar: "content/secondary", color: HEX.secondary, width: isMobile ? M : 340 });
        bodySm(host, p.link, isMobile ? M : 200);
      }
      gap(s, brief("PATHS-01"), isMobile ? M : Math.min(width - 192, 1000));
    }

    /* S9 — Accessibility */
    {
      const s = section(root, "9 · Accessibility", width, isMobile, { band: true });
      overline(s, "Built in");
      h2(s, "Accessible by default, not by audit.", isMobile ? M : 760);
      bodyLg(s, "Accessibility is not a pass someone does at the end here. It is a property of the components, checked continuously.", M);
      const two = stack(s, "Commitments + demo", { dir: isMobile ? "column" : "row", gap: 40, fillWidth: true });
      const left = stack(two, "Commitments", { gap: 20, width: isMobile ? M : 460 });
      const COMMITMENTS = [
        ["Every interactive component follows its WAI-ARIA pattern.", "Not an approximation of it."],
        ["Keyboard support is part of the component.", "Arrow keys, Home and End, Escape, type-ahead. Not something you add afterwards."],
        ["Contrast is guaranteed by the engine that generates the colour.", "Not spot-checked once the palette is chosen."],
        ["Focus is always visible.", "On every control, in both themes."],
      ];
      for (const [head, sub] of COMMITMENTS) {
        const c = stack(left, head, { gap: 6, width: isMobile ? M : 460 });
        h4(c, head, isMobile ? M : 460);
        bodyMd(c, sub, isMobile ? M : 460);
      }
      gap(two, brief("A11Y-01"), isMobile ? M : 420);
      bodyMd(s, "The behaviour layer is tested to full coverage and mutation-tested, which means the tests are themselves checked for whether they would actually catch a regression. A keyboard model that is merely covered is not the same as one that is asserted on.", M);
      bodySm(s, "Our accessibility commitments →", isMobile ? M : 320);
    }

    /* S10 — Close */
    {
      const s = section(root, "10 · Close", width, isMobile, { pt: isMobile ? 64 : 120, pb: isMobile ? 64 : 120 });
      s.counterAxisAlignItems = "CENTER";
      h2(s, "Start with one component.", isMobile ? M : 620).textAlignHorizontal = "CENTER";
      bodyLg(s, "You do not have to adopt a system to get value from it. Install one component, see whether it fits, and go from there.", isMobile ? M : 480)
        .textAlignHorizontal = "CENTER";
      const ctas = stack(s, "CTAs", { dir: isMobile ? "column" : "row", gap: 12, align: "CENTER" });
      const btn = findComp("Button");
      for (const [label, variant] of [["Get started", "primary"], ["Browse components", "secondary"]]) {
        if (btn && btn.type === "COMPONENT_SET") {
          const v = btn.children.find((c) => c.name.includes(`Variant=${variant}`)) || btn.defaultVariant;
          const inst = v.createInstance();
          ctas.appendChild(inst);
          inst.name = `Button · ${label}`;
          try {
            const keys = Object.keys(inst.componentProperties || {});
            const labelKey = keys.find((k) => k.startsWith("Label"));
            if (labelKey) inst.setProperties({ [labelKey]: label });
          } catch (e) {}
        } else {
          txt(ctas, label, { font: LABEL, size: 16 });
        }
      }
    }

    buildFooter(root, width, isMobile);
    return root;
  }

  const desktop = await buildPage(1440, false, 0);
  const mobile = await buildPage(390, true, 1640);

  /* ── the gap legend ─────────────────────────────────────────────────── */
  const legend = stack(page, "Illustration gaps", {
    width: 520, gap: 20, px: 32, py: 32, radius: 12, fill: HEX.surface,
  });
  legend.x = 2140; legend.y = 0;
  legend.strokes = solid(HEX.border);
  legend.strokeWeight = 1;
  txt(legend, "Illustration gaps", { font: DISPLAY, size: 28 });
  bodySm(legend, "Ten deliberate holes, keyed to docs/docs-site-home-copy.md. Each brief there carries the full spec: composition, exact contents, real component and token names, frame and breakpoints, both themes, motion timing, reduced-motion still, alt text, failure modes and craft notes.", 456);
  for (const b of BRIEFS) {
    const row = stack(legend, b.id, { gap: 4, width: 456 });
    txt(row, `${b.id}  ·  ${b.type}  ·  ${b.ratioLabel}`, {
      font: LABEL, size: 13, tracking: 2, colorVar: "content/primary", color: HEX.primary });
    bodySm(row, b.job, 456);
  }

  figma.currentPage.selection = [desktop];
  figma.viewport.scrollAndZoomIntoView([desktop, mobile, legend]);

  return {
    page: page.name,
    desktop: { id: desktop.id, height: Math.round(desktop.height) },
    mobile: { id: mobile.id, height: Math.round(mobile.height) },
    headerSource: headerSource ? headerSource.from : "NOT FOUND — placeholder banner used",
    gaps: BRIEFS.map((b) => b.id),
    variablesResolved: varIndex.size,
    componentsIndexed: compIndex.size,
    componentsMissing: missing,
  };
})();
