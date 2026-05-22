/**
 * Harmoni Plugin — Wireframe Generator
 *
 * Creates two wireframe screens on a new Figma page:
 *   Screen 1 — Projects (the landing/project-list screen)
 *   Screen 2 — Project view (Neutral section: White/Black pickers + ramp)
 *
 * HOW TO RUN
 * ----------
 * 1. Open your Figma file in the desktop app.
 * 2. Plugins → Development → Open console  (or ⌘⌥I on Mac).
 * 3. Paste the entire contents of this file and press Enter.
 *
 * The script creates a new page called "Wireframes — Harmoni Plugin"
 * and zooms the viewport to fit both frames.
 */

(async function createWireframes() {

  // ─── Fonts ────────────────────────────────────────────────────────────────
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  // ─── Page ─────────────────────────────────────────────────────────────────
  const page = figma.createPage();
  page.name = "Wireframes — Harmoni Plugin";
  figma.currentPage = page;

  // ─── Primitive helpers ────────────────────────────────────────────────────

  function hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16) / 255,
      g: parseInt(hex.slice(3, 5), 16) / 255,
      b: parseInt(hex.slice(5, 7), 16) / 255,
    };
  }

  function solid(hex) {
    return [{ type: "SOLID", color: hexToRgb(hex) }];
  }

  function solidA(hex, opacity) {
    return [{ type: "SOLID", color: hexToRgb(hex), opacity }];
  }

  // Lightness 0–255: returns "#nnnnnn" grey hex
  function grey(l) {
    const h = Math.round(l).toString(16).padStart(2, "0");
    return `#${h}${h}${h}`;
  }

  function makeFrame(name, x, y, w, h, bg = "#FFFFFF") {
    const f = figma.createFrame();
    f.name = name;
    f.x = x;
    f.y = y;
    f.resize(w, h);
    f.fills = solid(bg);
    f.clipsContent = true;
    return f;
  }

  function makeRect(parent, name, x, y, w, h, fill) {
    const r = figma.createRectangle();
    r.name = name;
    r.x = x;
    r.y = y;
    r.resize(w, h);
    r.fills = Array.isArray(fill) ? fill : solid(fill);
    parent.appendChild(r);
    return r;
  }

  function makeText(parent, content, x, y, size, style, hex) {
    const t = figma.createText();
    t.fontName = { family: "Inter", style };
    t.fontSize = size;
    t.fills = solid(hex);
    t.characters = content;
    t.x = x;
    t.y = y;
    parent.appendChild(t);
    return t;
  }

  function makeDivider(parent, x, y, w) {
    return makeRect(parent, "Divider", x, y, w, 1, "#D8D8D8");
  }

  function makeSectionLabel(parent, label, x, y) {
    return makeText(parent, label, x, y, 10, "Medium", "#999999");
  }

  // ─── Layout constants ─────────────────────────────────────────────────────
  const W       = 360;
  const H       = 620;
  const PAD     = 16;
  const CW      = W - PAD * 2;   // content width: 328px
  const HDR_H   = 48;

  // ─── Shared: plugin header ────────────────────────────────────────────────
  function makeHeader(parent, title, showBack = false) {
    makeRect(parent, "Header bg", 0, 0, W, HDR_H, "#1E1E1E");

    if (showBack) {
      makeText(parent, "‹", 14, 13, 20, "Regular", "#FFFFFF");
      makeText(parent, title, 38, 15, 14, "Medium", "#FFFFFF");
    } else {
      makeText(parent, title, 16, 15, 14, "Medium", "#FFFFFF");
    }

    const closeBox = makeRect(parent, "Close", W - PAD - 22, 13, 22, 22, solidA("#FFFFFF", 0.12));
    closeBox.cornerRadius = 4;
    makeText(parent, "×", W - PAD - 16, 15, 12, "Regular", "#FFFFFF");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 1 — Projects
  // ═══════════════════════════════════════════════════════════════════════════
  const s1 = makeFrame("Screen 1 — Projects", 0, 0, W, H, "#F2F2F2");
  makeHeader(s1, "Harmoni");

  let y = HDR_H + 16;

  // Page heading
  makeText(s1, "Projects", PAD, y, 20, "Bold", "#1E1E1E");
  y += 40;

  // New project button
  const newBtn = makeRect(s1, "New project", PAD, y, CW, 40, "#FFFFFF");
  newBtn.strokes = solid("#C8C8C8");
  newBtn.strokeWeight = 1;
  newBtn.cornerRadius = 6;
  makeText(s1, "+ New project", PAD + 12, y + 12, 13, "Medium", "#1E1E1E");
  y += 56;

  makeDivider(s1, PAD, y, CW);
  y += 12;

  // ── Project list ──────────────────────────────────────────────────────────
  const PROJECTS = [
    {
      name: "Acme Corp",
      chips: ["#E53935", "#1E88E5", "#43A047", "#FB8C00", "#8E24AA"],
      date: "Modified 2 days ago",
    },
    {
      name: "Studio Wren",
      chips: ["#FF6F00", "#F4511E", "#00ACC1", "#6D4C41", "#546E7A"],
      date: "Modified 1 week ago",
    },
    {
      name: "Client B",
      chips: ["#3949AB", "#00897B", "#C0CA33", "#F4511E", "#78909C"],
      date: "Modified 3 weeks ago",
    },
  ];

  const ITEM_H = 76;

  for (const proj of PROJECTS) {
    const item = makeRect(s1, `Project — ${proj.name}`, PAD, y, CW, ITEM_H, "#FFFFFF");
    item.strokes = solid("#E0E0E0");
    item.strokeWeight = 1;
    item.cornerRadius = 8;

    // Project name
    makeText(s1, proj.name, PAD + 12, y + 12, 13, "Medium", "#1E1E1E");

    // Colour chips (5 × 16px squares, 4px gap)
    let cx = PAD + 12;
    for (const chipHex of proj.chips) {
      const chip = makeRect(s1, "Chip", cx, y + 34, 16, 16, chipHex);
      chip.cornerRadius = 3;
      cx += 20;
    }

    // Last modified
    makeText(s1, proj.date, PAD + 12, y + 56, 10, "Regular", "#888888");

    // Chevron
    makeText(s1, "›", W - PAD - 14, y + 26, 18, "Regular", "#BBBBBB");

    y += ITEM_H + 8;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 2 — Project View (Neutral section)
  // ═══════════════════════════════════════════════════════════════════════════
  const s2 = makeFrame("Screen 2 — Project (Neutral)", W + 48, 0, W, H, "#F2F2F2");
  makeHeader(s2, "Acme Corp", true);

  y = HDR_H + 16;

  // ── Neutral section ───────────────────────────────────────────────────────
  makeSectionLabel(s2, "NEUTRAL", PAD, y);
  y += 18;
  makeDivider(s2, PAD, y, CW);
  y += 12;

  // White picker
  makeText(s2, "White", PAD, y + 11, 12, "Regular", "#333333");
  const whitePicker = makeRect(s2, "White picker", PAD + 50, y, 36, 36, "#FFFFFF");
  whitePicker.strokes = solid("#BBBBBB");
  whitePicker.strokeWeight = 1;
  whitePicker.cornerRadius = 4;

  // Black picker
  makeText(s2, "Black", PAD + 104, y + 11, 12, "Regular", "#333333");
  const blackPicker = makeRect(s2, "Black picker", PAD + 154, y, 36, 36, "#1E1E1E");
  blackPicker.cornerRadius = 4;

  y += 52;

  // ── Neutral ramp ──────────────────────────────────────────────────────────
  const SWATCH_W   = 28;
  const SWATCH_H   = 52;
  const SWATCH_GAP = 4;
  const RAMP_W     = SWATCH_W * 10 + SWATCH_GAP * 9;   // 316px
  const RAMP_X     = PAD + Math.round((CW - RAMP_W) / 2);

  // Approximate greyscale lightness for steps 50→900
  const LIGHTNESS = [248, 232, 212, 188, 161, 132, 104, 78, 53, 26];
  const STEPS     = ["50","100","200","300","400","500","600","700","800","900"];
  // Foreground step that would pass contrast at each swatch (mirrors workbench best_foreground)
  const FG_STEP   = ["900","900","900","900","900","50","50","50","50","50"];
  const RATINGS   = ["AA","AA","AA","AA","AA","AA","AA","AA","AA","AA"];
  const RATIOS    = ["14.2","9.8","6.5","4.9","3.8","4.6","6.1","9.1","12.8","19.3"];

  for (let i = 0; i < 10; i++) {
    const l   = LIGHTNESS[i];
    const sx  = RAMP_X + i * (SWATCH_W + SWATCH_GAP);

    const sw = makeRect(s2, `Swatch ${STEPS[i]}`, sx, y, SWATCH_W, SWATCH_H, grey(l));
    sw.cornerRadius = 2;

    // Inside the swatch: foreground step + ratio + rating (matching workbench Swatch component)
    const infoHex = l > 145 ? "#1E1E1E" : "#FFFFFF";
    const infoX   = sx + 2;
    makeText(s2, FG_STEP[i], infoX, y + 8,  7, "Bold",    infoHex);
    makeText(s2, RATIOS[i],  infoX, y + 18, 7, "Regular", infoHex);
    makeText(s2, RATINGS[i], infoX, y + 28, 7, "Bold",    infoHex);
  }

  // Step labels below the ramp (matching workbench Swatch layout)
  for (let i = 0; i < 10; i++) {
    const sx = RAMP_X + i * (SWATCH_W + SWATCH_GAP);
    makeText(s2, STEPS[i], sx + 2, y + SWATCH_H + 3, 7, "Regular", "#555555");
  }

  y += SWATCH_H + 16;

  // Quick Apply button (right-aligned)
  const APPLY_W  = 132;
  const APPLY_X  = PAD + CW - APPLY_W;
  const applyBtn = makeRect(s2, "Apply to Figma", APPLY_X, y, APPLY_W, 32, "#1E1E1E");
  applyBtn.cornerRadius = 6;
  makeText(s2, "Apply to Figma", APPLY_X + 14, y + 9, 11, "Medium", "#FFFFFF");

  y += 52;

  // ── Brand section (placeholder) ───────────────────────────────────────────
  makeSectionLabel(s2, "BRAND", PAD, y);
  y += 18;
  makeDivider(s2, PAD, y, CW);
  y += 12;

  const brandBox = makeRect(s2, "Brand — placeholder", PAD, y, CW, 84, "#F8F8F8");
  brandBox.strokes = solid("#D0D0D0");
  brandBox.strokeWeight = 1;
  brandBox.dashPattern = [6, 4];
  brandBox.cornerRadius = 6;

  // Rough centring for placeholder label
  makeText(s2, "Brand colours — coming soon", PAD + 44, y + 34, 11, "Regular", "#AAAAAA");

  // ─── Zoom to fit ──────────────────────────────────────────────────────────
  figma.viewport.scrollAndZoomIntoView([s1, s2]);

  console.log('✓ Created page "' + page.name + '" with 2 wireframe screens.');

})().catch((err) => console.error("Wireframe error:", err.message));
