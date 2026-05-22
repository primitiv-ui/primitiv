/**
 * Harmoni Plugin — Swatch Configuration Wireframe Generator
 *
 * Adds two screens to the existing "Wireframes — Harmoni Plugin" page
 * (creates the page if it doesn't exist yet):
 *
 *   Screen 5 — Swatch style configuration
 *              Shape (Square / Circle), Step numbers toggle, Accessibility
 *              info toggle, live mini-preview of the current config.
 *
 *   Screen 6 — Canvas output preview
 *              Simulates the Figma canvas showing three generated swatch
 *              frame variants: square with a11y info, circle with a11y info,
 *              and square with step numbers only (a11y info off).
 *
 * HOW TO RUN
 * ----------
 * 1. Open Figma desktop app.
 * 2. Plugins → Development → Open console (or ⌘⌥I).
 * 3. Type "allow pasting" and press Enter, then paste this file and press Enter.
 *
 * Run after create-wireframes.js and create-apply-wireframes.js, or on its own.
 */

(async function createSwatchConfigWireframes() {

  // ─── Fonts ────────────────────────────────────────────────────────────────
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  // ─── Page ─────────────────────────────────────────────────────────────────
  let page = figma.root.children.find(p => p.name === "Wireframes — Harmoni Plugin");
  if (!page) {
    page = figma.createPage();
    page.name = "Wireframes — Harmoni Plugin";
  }
  figma.currentPage = page;

  // ─── Layout constants ─────────────────────────────────────────────────────
  const W      = 360;
  const H      = 620;
  const PAD    = 16;
  const CW     = W - PAD * 2;    // 328px
  const HDR_H  = 48;
  const GAP    = 48;

  const X5 = (W + GAP) * 4;     // 1632 — to the right of Screens 1–4
  const X6 = (W + GAP) * 5;     // 2040

  // Swatch ramp data (greyscale approximation matching workbench Swatch.tsx values)
  const LIGHTNESS = [248, 232, 212, 188, 161, 132, 104, 78, 53, 26];
  const STEPS     = ["50","100","200","300","400","500","600","700","800","900"];
  const FG_STEP   = ["900","900","900","900","900","50","50","50","50","50"];
  const RATIOS    = ["14.2","9.8","6.5","4.9","3.8","4.6","6.1","9.1","12.8","19.3"];

  // Swatch geometry (shared between Screen 5 preview and Screen 6 output frames)
  const SW_W      = 28;
  const SW_GAP    = 4;
  const RAMP_W    = SW_W * 10 + SW_GAP * 9;         // 316px
  const RAMP_OFFSET = Math.round((CW - RAMP_W) / 2); // 6px — centres ramp in CW

  // ─── Primitive helpers ────────────────────────────────────────────────────
  function hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16) / 255,
      g: parseInt(hex.slice(3, 5), 16) / 255,
      b: parseInt(hex.slice(5, 7), 16) / 255,
    };
  }

  function solid(hex)             { return [{ type: "SOLID", color: hexToRgb(hex) }]; }
  function solidA(hex, opacity)   { return [{ type: "SOLID", color: hexToRgb(hex), opacity }]; }
  function grey(l)                { const h = Math.round(l).toString(16).padStart(2, "0"); return `#${h}${h}${h}`; }
  function ink(l)                 { return l > 145 ? "#1E1E1E" : "#FFFFFF"; }

  function makeFrame(name, x, y, w, h, bg) {
    const f = figma.createFrame();
    f.name = name; f.x = x; f.y = y;
    f.resize(w, h);
    f.fills = solid(bg || "#FFFFFF");
    f.clipsContent = true;
    return f;
  }

  // Creates a frame as a child of `parent`. x/y are relative to the parent.
  function makeSubFrame(parent, name, x, y, w, h, bg) {
    const f = figma.createFrame();
    f.name = name; f.x = x; f.y = y;
    f.resize(w, h);
    f.fills = solid(bg || "#FFFFFF");
    f.clipsContent = false;
    parent.appendChild(f);
    return f;
  }

  function makeRect(parent, name, x, y, w, h, fill) {
    const r = figma.createRectangle();
    r.name = name; r.x = x; r.y = y;
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
    t.characters = String(content);
    t.x = x; t.y = y;
    parent.appendChild(t);
    return t;
  }

  function makeDivider(parent, x, y, w) {
    return makeRect(parent, "Divider", x, y, w, 1, "#D8D8D8");
  }

  function makeSectionLabel(parent, label, x, y, color) {
    return makeText(parent, label, x, y, 10, "Medium", color || "#999999");
  }

  function makeHeader(parent, title, showBack) {
    makeRect(parent, "Header bg", 0, 0, W, HDR_H, "#1E1E1E");
    if (showBack) {
      makeText(parent, "‹",   14, 13, 20, "Regular", "#FFFFFF");
      makeText(parent, title, 38, 15, 14, "Medium",  "#FFFFFF");
    } else {
      makeText(parent, title, 16, 15, 14, "Medium",  "#FFFFFF");
    }
    const cb = makeRect(parent, "Close", W - PAD - 22, 13, 22, 22, solidA("#FFFFFF", 0.12));
    cb.cornerRadius = 4;
    makeText(parent, "×", W - PAD - 16, 15, 12, "Regular", "#FFFFFF");
  }

  // ─── Widget: pill toggle switch ───────────────────────────────────────────
  function makeToggle(parent, x, y, on) {
    const pill = makeRect(parent, on ? "Toggle on" : "Toggle off", x, y, 44, 24, on ? "#1E1E1E" : "#DDDDDD");
    pill.cornerRadius = 12;
    const thumb = makeRect(parent, "Thumb", on ? x + 22 : x + 2, y + 2, 20, 20, "#FFFFFF");
    thumb.cornerRadius = 10;
  }

  // ─── Widget: labelled toggle row (label + subtitle + right-aligned toggle) ─
  function makeToggleRow(parent, y, label, subtitle, on) {
    makeText(parent, label,    PAD, y,      13, "Medium",  "#1E1E1E");
    makeText(parent, subtitle, PAD, y + 18, 11, "Regular", "#888888");
    makeToggle(parent, PAD + CW - 44, y + 4, on);
  }

  // ─── Widget: two-button shape segment control ─────────────────────────────
  // Square is always the selected button (dark). Circle is unselected.
  function makeShapeSegment(parent, x, y) {
    const BW = (CW - 8) / 2;

    const sq = makeRect(parent, "Square", x, y, BW, 36, "#1E1E1E");
    sq.cornerRadius = 6;
    makeText(parent, "■  Square", x + 28, y + 10, 13, "Medium", "#FFFFFF");

    const ci = makeRect(parent, "Circle", x + BW + 8, y, BW, 36, "#FFFFFF");
    ci.strokes = solid("#D0D0D0"); ci.strokeWeight = 1; ci.cornerRadius = 6;
    makeText(parent, "●  Circle", x + BW + 8 + 28, y + 10, 13, "Regular", "#555555");
  }

  // ─── Widget: option card (checked state) ──────────────────────────────────
  function makeCheckedCard(parent, y, label, desc) {
    const card = makeRect(parent, label, PAD, y, CW, 64, "#FFFFFF");
    card.strokes = solid("#1E1E1E"); card.strokeWeight = 1.5; card.cornerRadius = 8;
    const cb = makeRect(parent, "Checkbox", PAD + 12, y + 22, 20, 20, "#1E1E1E");
    cb.strokes = solid("#1E1E1E"); cb.strokeWeight = 1.5; cb.cornerRadius = 4;
    makeText(parent, "✓",   PAD + 16,  y + 23, 11, "Bold",    "#FFFFFF");
    makeText(parent, label, PAD + 44,  y + 12, 13, "Medium",  "#1E1E1E");
    makeText(parent, desc,  PAD + 44,  y + 31, 11, "Regular", "#888888");
  }

  // ─── Widget: option card (unchecked state) ────────────────────────────────
  function makeUncheckedCard(parent, y, label, desc) {
    const card = makeRect(parent, label, PAD, y, CW, 64, "#FFFFFF");
    card.strokes = solid("#E0E0E0"); card.strokeWeight = 1; card.cornerRadius = 8;
    const cb = makeRect(parent, "Checkbox", PAD + 12, y + 22, 20, 20, "#FFFFFF");
    cb.strokes = solid("#BBBBBB"); cb.strokeWeight = 1.5; cb.cornerRadius = 4;
    makeText(parent, label, PAD + 44, y + 12, 13, "Medium",  "#1E1E1E");
    makeText(parent, desc,  PAD + 44, y + 31, 11, "Regular", "#888888");
  }

  // ─── Widget: footer (Cancel + Apply buttons) ──────────────────────────────
  function makeFooter(parent, applyEnabled) {
    const FY = H - 64;
    const BW = (CW - 8) / 2;
    makeDivider(parent, 0, FY, W);
    const can = makeRect(parent, "Cancel", PAD, FY + 12, BW, 40, "#FFFFFF");
    can.strokes = solid("#D0D0D0"); can.strokeWeight = 1; can.cornerRadius = 6;
    makeText(parent, "Cancel", PAD + 51, FY + 24, 13, "Medium", "#333333");
    const ax  = PAD + BW + 8;
    const app = makeRect(parent, "Apply", ax, FY + 12, BW, 40, applyEnabled ? "#1E1E1E" : "#BBBBBB");
    app.cornerRadius = 6;
    makeText(parent, "Apply", ax + 57, FY + 24, 13, "Medium", "#FFFFFF");
  }

  // ─── Swatch output frame builder ──────────────────────────────────────────
  // Renders a row of 10 swatches inside a sub-frame (representing the Figma
  // frame that gets placed on the canvas). `mode` controls what's shown:
  //   "square-full"   — square swatches, foreground step + ratio + AA inside
  //   "circle-full"   — circle swatches, AA inside
  //   "square-labels" — square swatches, step label only (no a11y info)
  function makeSwatchOutputFrame(parent, name, x, y, mode) {
    const SW_H_FULL  = 60;
    const SW_H_SHORT = 40;
    const CIRC_D     = SW_W;   // 28px diameter — same width as square for alignment

    let sfH;
    if (mode === "square-full")   sfH = 8 + SW_H_FULL  + 4 + 12 + 8;   // 92 → 96
    if (mode === "circle-full")   sfH = 8 + CIRC_D     + 4 + 12 + 8;   // 60 → 64
    if (mode === "square-labels") sfH = 8 + SW_H_SHORT + 4 + 12 + 8;   // 72 → 76

    // Round up to nearest 4px for clean proportions
    sfH = Math.ceil(sfH / 4) * 4;

    const sf = makeSubFrame(parent, name, x, y, CW, sfH, "#FFFFFF");
    sf.cornerRadius = 6;

    for (let i = 0; i < 10; i++) {
      const l  = LIGHTNESS[i];
      const sx = RAMP_OFFSET + i * (SW_W + SW_GAP);

      if (mode === "square-full") {
        const sw = makeRect(sf, `Swatch ${STEPS[i]}`, sx, 8, SW_W, SW_H_FULL, grey(l));
        sw.cornerRadius = 2;
        makeText(sf, FG_STEP[i], sx + 2, 14, 7, "Bold",    ink(l));
        makeText(sf, RATIOS[i],  sx + 2, 23, 6, "Regular", ink(l));
        makeText(sf, "AA",       sx + 2, 31, 7, "Bold",    ink(l));
        makeText(sf, STEPS[i],   sx + 1, 8 + SW_H_FULL  + 4, 7, "Regular", "#555555");
      }

      if (mode === "circle-full") {
        const sw = makeRect(sf, `Swatch ${STEPS[i]}`, sx, 8, CIRC_D, CIRC_D, grey(l));
        sw.cornerRadius = CIRC_D / 2;
        makeText(sf, "AA", sx + 6, 16, 7, "Bold", ink(l));
        makeText(sf, STEPS[i], sx + 1, 8 + CIRC_D + 4, 7, "Regular", "#555555");
      }

      if (mode === "square-labels") {
        const sw = makeRect(sf, `Swatch ${STEPS[i]}`, sx, 8, SW_W, SW_H_SHORT, grey(l));
        sw.cornerRadius = 2;
        makeText(sf, STEPS[i], sx + 1, 8 + SW_H_SHORT + 4, 7, "Regular", "#555555");
      }
    }

    return sfH;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 5 — Swatch style configuration
  //
  // Appears when the user taps "Canvas swatches" in the Apply overlay.
  // Shows shape picker, step number toggle, accessibility info toggle,
  // and a live mini-preview of the current configuration.
  // ═══════════════════════════════════════════════════════════════════════════
  const s5 = makeFrame("Screen 5 — Swatch style config", X5, 0, W, H, "#F2F2F2");
  makeHeader(s5, "Apply to Figma", true);

  let y = HDR_H + 16;   // 64

  // ── GENERATE section ──────────────────────────────────────────────────────
  makeSectionLabel(s5, "GENERATE", PAD, y);
  y += 18;   // 82
  makeDivider(s5, PAD, y, CW);
  y += 12;   // 94

  makeCheckedCard(s5, y, "Canvas swatches", "Place swatch frames on the active Figma page");
  y += 72;   // 166

  // ── SWATCH STYLE section ──────────────────────────────────────────────────
  makeSectionLabel(s5, "SWATCH STYLE", PAD, y);
  y += 18;   // 184
  makeDivider(s5, PAD, y, CW);
  y += 12;   // 196

  // Shape picker
  makeText(s5, "Shape", PAD, y, 13, "Medium", "#1E1E1E");
  y += 24;   // 220
  makeShapeSegment(s5, PAD, y);
  y += 44;   // 264

  // Step numbers toggle (on)
  makeToggleRow(s5, y, "Step numbers", "50, 100, 200…", true);
  y += 48;   // 312

  // Accessibility info toggle (off — so the preview reflects this state)
  makeToggleRow(s5, y, "Accessibility info", "Contrast ratio and AA / AAA rating", false);
  y += 48;   // 360

  // ── PREVIEW section ───────────────────────────────────────────────────────
  // Shows 5 sampled swatches (50, 200, 400, 700, 900) reflecting the current
  // toggles: square shape, step numbers on, accessibility info off.
  makeSectionLabel(s5, "PREVIEW", PAD, y);
  y += 18;   // 378
  makeDivider(s5, PAD, y, CW);
  y += 8;    // 386

  {
    const PIDX  = [0, 2, 4, 7, 9];
    const PSW_W = Math.floor((CW - 4 * 4) / 5);   // 62px each
    const PSW_H = 52;
    let   px    = PAD;

    for (const i of PIDX) {
      const l  = LIGHTNESS[i];
      const sw = makeRect(s5, `Preview ${STEPS[i]}`, px, y, PSW_W, PSW_H, grey(l));
      sw.cornerRadius = 3;
      // Step number inside top-left (step numbers is ON)
      makeText(s5, STEPS[i], px + 4, y + 4, 8, "Bold", ink(l));
      // Step label below swatch
      makeText(s5, STEPS[i], px + 4, y + PSW_H + 3, 8, "Regular", "#555555");
      px += PSW_W + 4;
    }
    y += PSW_H + 18;   // 456
  }

  // ── Colour variables card (unchecked — out of scope for this config) ──────
  makeUncheckedCard(s5, y, "Colour variables", "Write variables to a chosen collection");
  y += 72;   // 528

  makeFooter(s5, true);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 6 — Canvas output preview
  //
  // Simulates the Figma canvas (dark background) with three variants of the
  // generated swatch frame placed on it, so the user can compare:
  //   1. Square + accessibility info (foreground step, ratio, AA rating)
  //   2. Circle + accessibility info
  //   3. Square + step numbers only (accessibility info toggled off)
  // ═══════════════════════════════════════════════════════════════════════════
  const s6 = makeFrame("Screen 6 — Canvas output preview", X6, 0, W, H, "#3C3C3C");

  // Minimal Figma toolbar at the top to establish canvas context
  makeRect(s6, "Figma toolbar", 0, 0, W, HDR_H, "#2C2C2C");
  makeText(s6, "Harmoni", 16, 15, 14, "Medium", "#FFFFFF");
  const toolHandle = makeRect(s6, "Plugin handle", W - 50, 14, 34, 20, solidA("#FFFFFF", 0.1));
  toolHandle.cornerRadius = 4;

  y = 64;

  const CANVAS_LABEL_COLOR = "#888888";

  // 1. Square swatches with full accessibility info
  makeSectionLabel(s6, "SQUARE — WITH ACCESSIBILITY INFO", PAD, y, CANVAS_LABEL_COLOR);
  y += 16;
  const sfH1 = makeSwatchOutputFrame(s6, "Neutral / Acme Corp", PAD, y, "square-full");
  y += sfH1 + 16;

  // 2. Circle swatches with accessibility info
  makeSectionLabel(s6, "CIRCLE — WITH ACCESSIBILITY INFO", PAD, y, CANVAS_LABEL_COLOR);
  y += 16;
  const sfH2 = makeSwatchOutputFrame(s6, "Neutral / Acme Corp (Circle)", PAD, y, "circle-full");
  y += sfH2 + 16;

  // 3. Square swatches — step numbers only (accessibility info toggled off)
  makeSectionLabel(s6, "SQUARE — STEP NUMBERS ONLY", PAD, y, CANVAS_LABEL_COLOR);
  y += 16;
  makeSwatchOutputFrame(s6, "Neutral / Acme Corp (no a11y)", PAD, y, "square-labels");

  // ─── Zoom to the two new screens ──────────────────────────────────────────
  figma.viewport.scrollAndZoomIntoView([s5, s6]);

  console.log("✓ Swatch config wireframes created (Screens 5 & 6).");

})().catch(err => console.error("Wireframe error:", err.message));
