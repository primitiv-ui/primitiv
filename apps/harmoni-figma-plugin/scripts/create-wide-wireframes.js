/**
 * Harmoni Plugin — Wide Layout Wireframes (640px)
 *
 * Proposes a navigation-reduced redesign at 640px plugin width.
 * Creates two screens on a new Figma page:
 *
 *   Screen R1 — Projects (640px, wider project cards)
 *   Screen R2 — Palette Editor (640px, two-column persistent layout)
 *               Left (364px):  live swatch preview — neutral ramp + brand rows
 *               Right (232px): all configuration + Apply panel — no sub-screens
 *
 * Navigation reduction: Screens 2, 2a, 2b, 2c, 3, 4, 5, 6 → one screen.
 * User journey: Projects → Palette Editor. Done.
 *
 * HOW TO RUN
 * ----------
 * 1. Open your Figma file in the desktop app.
 * 2. Plugins → Development → Open console (⌘⌥I on Mac).
 * 3. Type "allow pasting" and press Enter, then paste this file and press Enter.
 */

(async function createWideWireframes() {

  // ─── Fonts ────────────────────────────────────────────────────────────────
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  // ─── Page ─────────────────────────────────────────────────────────────────
  const page = figma.createPage();
  page.name = "Wireframes — Harmoni Plugin (Wide)";
  figma.currentPage = page;

  // ─── Layout constants ─────────────────────────────────────────────────────
  const W      = 640;
  const H      = 620;
  const PAD    = 16;
  const HDR_H  = 48;
  const CW     = W - PAD * 2;   // 608px full-width content area
  const GAP    = 48;             // gap between frames on canvas

  // Two-column layout (Screen R2)
  const LEFT_COL_W  = 364;
  const COL_GAP     = 12;
  const RIGHT_COL_W = CW - LEFT_COL_W - COL_GAP;  // 232px
  const RCX         = PAD + LEFT_COL_W + COL_GAP;  // 392px from frame left

  // Neutral ramp geometry (left column)
  const SWATCH_W   = 32;
  const SWATCH_H   = 60;
  const SWATCH_GAP = 4;
  const RAMP_W     = SWATCH_W * 10 + SWATCH_GAP * 9;             // 356px
  const RAMP_X     = PAD + Math.round((LEFT_COL_W - RAMP_W) / 2); // 20px

  // Ramp data (greyscale approximation, matches workbench Swatch.tsx values)
  const LIGHTNESS = [248, 232, 212, 188, 161, 132, 104, 78, 53, 26];
  const STEPS     = ["50","100","200","300","400","500","600","700","800","900"];
  const FG_STEP   = ["900","900","900","900","900","50","50","50","50","50"];
  const RATIOS    = ["14.2","9.8","6.5","4.9","3.8","4.6","6.1","9.1","12.8","19.3"];
  const RATINGS   = ["AA","AA","AA","AA","AA","AA","AA","AA","AA","AA"];

  // Lightness values (0–1) for the curve visualisation — descending, matches harmoni-core
  const LVALS = [0.97, 0.91, 0.83, 0.74, 0.63, 0.52, 0.41, 0.31, 0.21, 0.10];

  // ─── Primitive helpers ────────────────────────────────────────────────────

  function hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16) / 255,
      g: parseInt(hex.slice(3, 5), 16) / 255,
      b: parseInt(hex.slice(5, 7), 16) / 255,
    };
  }

  function solid(hex) { return [{ type: "SOLID", color: hexToRgb(hex) }]; }

  function solidA(hex, opacity) {
    return [{ type: "SOLID", color: hexToRgb(hex), opacity }];
  }

  function grey(l) {
    const h = Math.round(l).toString(16).padStart(2, "0");
    return `#${h}${h}${h}`;
  }

  function makeFrame(name, x, y, w, h, bg = "#F2F2F2") {
    const f = figma.createFrame();
    f.name = name; f.x = x; f.y = y;
    f.resize(w, h); f.fills = solid(bg); f.clipsContent = true;
    return f;
  }

  function makeRect(parent, name, x, y, w, h, fill) {
    const r = figma.createRectangle();
    r.name = name; r.x = x; r.y = y; r.resize(w, h);
    r.fills = Array.isArray(fill) ? fill : solid(fill);
    parent.appendChild(r); return r;
  }

  function makeText(parent, content, x, y, size, style, hex) {
    const t = figma.createText();
    t.fontName = { family: "Inter", style }; t.fontSize = size;
    t.fills = solid(hex); t.characters = content;
    t.x = x; t.y = y; parent.appendChild(t); return t;
  }

  function makeDivider(parent, x, y, w) {
    return makeRect(parent, "Divider", x, y, w, 1, "#D8D8D8");
  }

  function makeSectionLabel(parent, label, x, y) {
    return makeText(parent, label, x, y, 10, "Medium", "#999999");
  }

  // ─── Shared: plugin header ────────────────────────────────────────────────

  function makeSimpleHeader(parent, title) {
    makeRect(parent, "Header bg", 0, 0, W, HDR_H, "#1E1E1E");
    makeText(parent, title, PAD, 15, 14, "Medium", "#FFFFFF");
    const closeBox = makeRect(parent, "Close", W - PAD - 22, 13, 22, 22, solidA("#FFFFFF", 0.12));
    closeBox.cornerRadius = 4;
    makeText(parent, "×", W - PAD - 16, 15, 12, "Regular", "#FFFFFF");
  }

  // Breadcrumb header: "‹  ProjectName  /  PaletteName"
  function makeBreadcrumbHeader(parent, projectName, paletteName) {
    makeRect(parent, "Header bg", 0, 0, W, HDR_H, "#1E1E1E");
    makeText(parent, "‹", 14, 13, 20, "Regular", "#FFFFFF");
    makeText(parent, projectName, 38, 15, 14, "Medium", "#FFFFFF");
    // Rough character width at 14px — adequate for wireframe positioning
    const sepX = 38 + projectName.length * 7 + 4;
    makeText(parent, "/", sepX, 15, 14, "Regular", "#555555");
    makeText(parent, paletteName, sepX + 14, 15, 14, "Regular", "#CCCCCC");
    const closeBox = makeRect(parent, "Close", W - PAD - 22, 13, 22, 22, solidA("#FFFFFF", 0.12));
    closeBox.cornerRadius = 4;
    makeText(parent, "×", W - PAD - 16, 15, 12, "Regular", "#FFFFFF");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN R1 — Projects (640px wide)
  // ═══════════════════════════════════════════════════════════════════════════
  const sr1 = makeFrame("Screen R1 — Projects", 0, 0, W, H, "#F2F2F2");
  makeSimpleHeader(sr1, "Harmoni");

  let y = HDR_H + 16;

  makeText(sr1, "Projects", PAD, y, 20, "Bold", "#1E1E1E");
  y += 40;

  const newBtn = makeRect(sr1, "New project", PAD, y, CW, 40, "#FFFFFF");
  newBtn.strokes = solid("#C8C8C8"); newBtn.strokeWeight = 1; newBtn.cornerRadius = 6;
  makeText(sr1, "+ New project", PAD + 12, y + 12, 13, "Medium", "#1E1E1E");
  y += 56;

  makeDivider(sr1, PAD, y, CW);
  y += 12;

  const PROJECTS = [
    {
      name: "Acme Corp",
      chips: ["#E53935","#1E88E5","#43A047","#FB8C00","#8E24AA"],
      palettes: "3 palettes",
      date: "2 days ago",
    },
    {
      name: "Studio Wren",
      chips: ["#FF6F00","#F4511E","#00ACC1","#6D4C41","#546E7A"],
      palettes: "2 palettes",
      date: "1 week ago",
    },
    {
      name: "Client B",
      chips: ["#3949AB","#00897B","#C0CA33","#F4511E","#78909C"],
      palettes: "5 palettes",
      date: "3 weeks ago",
    },
  ];

  const ITEM_H = 80;

  for (const proj of PROJECTS) {
    const item = makeRect(sr1, `Project — ${proj.name}`, PAD, y, CW, ITEM_H, "#FFFFFF");
    item.strokes = solid("#E0E0E0"); item.strokeWeight = 1; item.cornerRadius = 8;

    makeText(sr1, proj.name, PAD + 12, y + 10, 14, "Medium", "#1E1E1E");
    makeText(sr1, proj.palettes, PAD + 12, y + 28, 11, "Regular", "#888888");

    let cx = PAD + 12;
    for (const hex of proj.chips) {
      const chip = makeRect(sr1, "Chip", cx, y + 48, 20, 20, hex);
      chip.cornerRadius = 4; cx += 24;
    }

    makeText(sr1, "Modified " + proj.date, W - PAD - 106, y + 10, 10, "Regular", "#AAAAAA");
    makeText(sr1, "›", W - PAD - 14, y + 28, 18, "Regular", "#BBBBBB");

    y += ITEM_H + 8;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN R2 — Palette Editor (two-column, 640px)
  // ═══════════════════════════════════════════════════════════════════════════
  const sr2 = makeFrame("Screen R2 — Palette Editor", W + GAP, 0, W, H, "#F2F2F2");
  makeBreadcrumbHeader(sr2, "Acme Corp", "Neutral");

  // Thin vertical divider between the two columns
  makeRect(sr2, "Column divider", RCX - 7, HDR_H + 8, 1, H - HDR_H - 16, "#D8D8D8");

  // ─── LEFT COLUMN — live swatch preview ───────────────────────────────────

  let ly = HDR_H + 16;

  // Neutral section header
  makeSectionLabel(sr2, "NEUTRAL", PAD, ly);
  ly += 18;
  makeDivider(sr2, PAD, ly, LEFT_COL_W);
  ly += 12;

  // 10-step neutral ramp
  for (let i = 0; i < 10; i++) {
    const l  = LIGHTNESS[i];
    const sx = RAMP_X + i * (SWATCH_W + SWATCH_GAP);
    const sw = makeRect(sr2, `Swatch ${STEPS[i]}`, sx, ly, SWATCH_W, SWATCH_H, grey(l));
    sw.cornerRadius = 2;
    const fg = l > 145 ? "#1E1E1E" : "#FFFFFF";
    makeText(sr2, FG_STEP[i], sx + 2, ly + 10, 7, "Bold",    fg);
    makeText(sr2, RATIOS[i],  sx + 2, ly + 21, 7, "Regular", fg);
    makeText(sr2, RATINGS[i], sx + 2, ly + 32, 7, "Bold",    fg);
  }

  // Step labels below neutral ramp
  for (let i = 0; i < 10; i++) {
    const sx = RAMP_X + i * (SWATCH_W + SWATCH_GAP);
    makeText(sr2, STEPS[i], sx + 1, ly + SWATCH_H + 3, 7, "Regular", "#555555");
  }
  ly += SWATCH_H + 22;

  // Brand section
  makeSectionLabel(sr2, "BRAND", PAD, ly);
  ly += 18;
  makeDivider(sr2, PAD, ly, LEFT_COL_W);
  ly += 12;

  const BRAND_ROWS = [
    {
      label: "Primary",
      colors: ["#DBEAFE","#BFDBFE","#93C5FD","#60A5FA","#3B82F6",
               "#2563EB","#1D4ED8","#1E40AF","#1E3A8A","#172554"],
    },
    {
      label: "Secondary",
      colors: ["#EDE9FE","#DDD6FE","#C4B5FD","#A78BFA","#8B5CF6",
               "#7C3AED","#6D28D9","#5B21B6","#4C1D95","#2E1065"],
    },
    {
      label: "Accent",
      colors: ["#FEF3C7","#FDE68A","#FCD34D","#FBBF24","#F59E0B",
               "#D97706","#B45309","#92400E","#78350F","#451A03"],
    },
  ];

  const BRAND_SH = 24;

  for (const row of BRAND_ROWS) {
    makeText(sr2, row.label, PAD, ly, 11, "Medium", "#444444");
    for (let i = 0; i < 10; i++) {
      const sx = RAMP_X + i * (SWATCH_W + SWATCH_GAP);
      const sw = makeRect(sr2, `${row.label} ${STEPS[i]}`, sx, ly + 14, SWATCH_W, BRAND_SH, row.colors[i]);
      sw.cornerRadius = 2;
    }
    for (let i = 0; i < 10; i++) {
      const sx = RAMP_X + i * (SWATCH_W + SWATCH_GAP);
      makeText(sr2, STEPS[i], sx + 1, ly + 14 + BRAND_SH + 2, 7, "Regular", "#555555");
    }
    ly += 14 + BRAND_SH + 14;  // label + swatches + step-labels-area = 52px
  }

  // Ghost "add brand colour" button
  const addBrandBtn = makeRect(sr2, "Add brand colour", PAD, ly, LEFT_COL_W, 28, "#FFFFFF");
  addBrandBtn.strokes = solid("#C8C8C8"); addBrandBtn.strokeWeight = 1;
  addBrandBtn.dashPattern = [4, 3]; addBrandBtn.cornerRadius = 4;
  makeText(sr2, "+ Add brand colour", PAD + 8, ly + 8, 11, "Regular", "#888888");

  // ─── RIGHT COLUMN — configuration + apply ────────────────────────────────
  // All previously separate sub-screens live here as scrollable sections.
  // Right column starts at x=RCX=392, width=232px.

  let ry = HDR_H + 16;

  // ── Neutral colours ──────────────────────────────────────────────────────
  makeSectionLabel(sr2, "NEUTRAL COLOURS", RCX, ry);
  ry += 14;
  makeDivider(sr2, RCX, ry, RIGHT_COL_W);
  ry += 10;

  // Two compact colour picker cards side by side
  const PW = Math.floor((RIGHT_COL_W - 8) / 2);  // 112px each

  function makePickerCard(label, hexDisplay, swatchHex, cardX) {
    const card = makeRect(sr2, label + " picker", cardX, ry, PW, 40, "#FFFFFF");
    card.strokes = solid("#E0E0E0"); card.strokeWeight = 1; card.cornerRadius = 6;
    const sw = makeRect(sr2, label + " swatch", cardX + 8, ry + 8, 24, 24, swatchHex);
    sw.cornerRadius = 3;
    if (swatchHex.toUpperCase() === "#FAFAFA" || swatchHex === "#FFFFFF") {
      sw.strokes = solid("#CCCCCC"); sw.strokeWeight = 1;
    }
    makeText(sr2, label,      cardX + 36, ry + 5,  9,  "Regular", "#999999");
    makeText(sr2, hexDisplay, cardX + 36, ry + 19, 10, "Medium",  "#1E1E1E");
    makeText(sr2, "▾", cardX + PW - 14, ry + 14, 10, "Regular", "#BBBBBB");
  }

  makePickerCard("White", "#FAFAFA", "#FAFAFA", RCX);
  makePickerCard("Black", "#121212", "#121212", RCX + PW + 8);
  ry += 48;

  // ── Lightness curve ───────────────────────────────────────────────────────
  makeSectionLabel(sr2, "LIGHTNESS CURVE", RCX, ry);
  ry += 14;
  makeDivider(sr2, RCX, ry, RIGHT_COL_W);
  ry += 10;

  // Miniature curve visualisation: 10 dots at their lightness positions
  const CURVE_H   = 48;
  const curveArea = makeRect(sr2, "Curve area", RCX, ry, RIGHT_COL_W, CURVE_H, "#F8F8F8");
  curveArea.strokes = solid("#E0E0E0"); curveArea.strokeWeight = 1; curveArea.cornerRadius = 4;

  const dotInset = 12;
  const dotAreaW = RIGHT_COL_W - dotInset * 2;
  const dotAreaH = CURVE_H - 12;

  for (let i = 0; i < 10; i++) {
    const dx  = RCX + dotInset + Math.round(i * dotAreaW / 9);
    const dy  = ry + 6 + Math.round((1 - LVALS[i]) * dotAreaH);
    const dot = makeRect(sr2, `Dot ${i}`, dx - 3, dy - 3, 6, 6, "#1E1E1E");
    dot.cornerRadius = 3;
  }
  ry += CURVE_H + 6;

  makeText(sr2, "Edit curve  ›", RCX, ry, 10, "Regular", "#2563EB");
  ry += 18;

  // ── Padding ───────────────────────────────────────────────────────────────
  makeSectionLabel(sr2, "PADDING", RCX, ry);
  ry += 14;
  makeDivider(sr2, RCX, ry, RIGHT_COL_W);
  ry += 10;

  function makeHSlider(label, value, maxVal) {
    const LABEL_W = 60;
    const VAL_W   = 28;
    const TRACK_W = RIGHT_COL_W - LABEL_W - VAL_W - 4;
    const TX      = RCX + LABEL_W;
    const FILL_W  = Math.round((value / maxVal) * TRACK_W);
    const TD      = 12;

    makeText(sr2, label, RCX, ry + 8, 11, "Regular", "#333333");

    const track = makeRect(sr2, label + " track", TX, ry + 11, TRACK_W, 4, "#D8D8D8");
    track.cornerRadius = 2;

    if (FILL_W > 0) {
      const fill = makeRect(sr2, label + " fill", TX, ry + 11, FILL_W, 4, "#1E1E1E");
      fill.topLeftRadius = 2; fill.bottomLeftRadius = 2;
    }

    const thX   = TX + FILL_W - TD / 2;
    const thY   = ry + 11 - (TD - 4) / 2;
    const thumb = makeRect(sr2, label + " thumb", thX, thY, TD, TD, "#1E1E1E");
    thumb.cornerRadius = 6; thumb.strokes = solid("#FFFFFF"); thumb.strokeWeight = 2;

    makeText(sr2, value + "%", TX + TRACK_W + 4, ry + 6, 11, "Medium", "#1E1E1E");
  }

  makeHSlider("Light", 12, 30); ry += 30;
  makeHSlider("Dark",   8, 30); ry += 34;

  // ── Swatch style ──────────────────────────────────────────────────────────
  makeDivider(sr2, RCX, ry, RIGHT_COL_W); ry += 8;
  makeSectionLabel(sr2, "SWATCH STYLE", RCX, ry); ry += 14;
  makeDivider(sr2, RCX, ry, RIGHT_COL_W); ry += 10;

  // Shape toggle: Round | Square
  makeText(sr2, "Shape", RCX, ry + 5, 11, "Regular", "#333333");
  const TOGW  = 100;
  const TOGX  = RCX + RIGHT_COL_W - TOGW;
  const togBg = makeRect(sr2, "Shape toggle bg", TOGX, ry, TOGW, 24, "#E0E0E0");
  togBg.cornerRadius = 4;
  const togActive = makeRect(sr2, "Shape active pill", TOGX, ry, TOGW / 2, 24, "#1E1E1E");
  togActive.topLeftRadius = 4; togActive.topRightRadius = 0;
  togActive.bottomLeftRadius = 4; togActive.bottomRightRadius = 0;
  makeText(sr2, "Round",  TOGX + 6,          ry + 7, 9, "Medium",  "#FFFFFF");
  makeText(sr2, "Square", TOGX + TOGW / 2 + 6, ry + 7, 9, "Regular", "#666666");
  ry += 32;

  function makeToggleRow(label, on) {
    makeText(sr2, label, RCX, ry + 4, 11, "Regular", "#333333");
    const tX  = RCX + RIGHT_COL_W - 32;
    const tBg = makeRect(sr2, label + " toggle", tX, ry, 32, 18, on ? "#1E1E1E" : "#D0D0D0");
    tBg.cornerRadius = 9;
    const knobX = on ? tX + 16 : tX + 2;
    const knob  = makeRect(sr2, label + " knob", knobX, ry + 2, 14, 14, "#FFFFFF");
    knob.cornerRadius = 7;
  }

  makeToggleRow("Step labels", true);  ry += 26;
  makeToggleRow("A11y badges", false); ry += 30;

  // ── Apply to Figma ────────────────────────────────────────────────────────
  makeDivider(sr2, RCX, ry, RIGHT_COL_W); ry += 8;
  makeSectionLabel(sr2, "APPLY TO FIGMA", RCX, ry); ry += 14;
  makeDivider(sr2, RCX, ry, RIGHT_COL_W); ry += 10;

  function makeCheckboxRow(label, checked) {
    const cb = makeRect(sr2, label + " cb", RCX, ry + 1, 14, 14, checked ? "#1E1E1E" : "#FFFFFF");
    cb.cornerRadius = 3;
    cb.strokes = solid(checked ? "#1E1E1E" : "#C0C0C0"); cb.strokeWeight = 1.5;
    if (checked) makeText(sr2, "✓", RCX + 2, ry, 11, "Bold", "#FFFFFF");
    makeText(sr2, label, RCX + 20, ry + 2, 11, "Regular", "#333333");
  }

  makeCheckboxRow("Colour styles", false);   ry += 22;
  makeCheckboxRow("Colour variables", true); ry += 26;

  // Collection dropdown
  makeText(sr2, "Collection", RCX, ry, 10, "Regular", "#999999"); ry += 14;
  const collDrop = makeRect(sr2, "Collection dropdown", RCX, ry, RIGHT_COL_W, 30, "#FFFFFF");
  collDrop.strokes = solid("#D0D0D0"); collDrop.strokeWeight = 1; collDrop.cornerRadius = 5;
  makeText(sr2, "My Library", RCX + 8, ry + 8, 11, "Regular", "#1E1E1E");
  makeText(sr2, "▾", RCX + RIGHT_COL_W - 16, ry + 9, 11, "Regular", "#888888");
  ry += 38;

  // Primary Apply button — full right-column width
  const applyBtn = makeRect(sr2, "Apply to Figma", RCX, ry, RIGHT_COL_W, 36, "#1E1E1E");
  applyBtn.cornerRadius = 6;
  makeText(sr2, "Apply to Figma", RCX + Math.round((RIGHT_COL_W - 76) / 2), ry + 11, 12, "Medium", "#FFFFFF");

  // ─── Canvas annotation ────────────────────────────────────────────────────
  const anno = figma.createText();
  anno.fontName = { family: "Inter", style: "Regular" };
  anno.fontSize = 11;
  anno.fills = [{ type: "SOLID", color: hexToRgb("#888888") }];
  anno.characters = "Screen R2 replaces Screens 2, 2a, 2b, 2c, 3, 4, 5, 6.  User journey: Projects → Palette Editor. No sub-navigation.";
  anno.x = W + GAP;
  anno.y = H + 20;
  page.appendChild(anno);

  // ─── Zoom to fit ──────────────────────────────────────────────────────────
  figma.viewport.scrollAndZoomIntoView([sr1, sr2]);
  console.log('✓ Created page "' + page.name + '" with Screens R1 and R2.');

  function hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16) / 255,
      g: parseInt(hex.slice(3, 5), 16) / 255,
      b: parseInt(hex.slice(5, 7), 16) / 255,
    };
  }

})().catch((err) => console.error("Wireframe error:", err.message));
