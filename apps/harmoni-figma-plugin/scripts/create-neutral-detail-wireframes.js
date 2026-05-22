/**
 * Harmoni Plugin — Neutral Section Detail Wireframes
 *
 * Appends three screens to the "Wireframes — Harmoni Plugin" page
 * (creates the page if it doesn't exist yet):
 *
 *   Screen 2a — Default state
 *               Enhanced White/Black colour pickers (swatch + hex + chevron
 *               inside a card control, referencing the ColorEngine.tsx
 *               input[type=color] pattern) and the 10-step neutral ramp.
 *
 *   Screen 2b — Lightness curve editor
 *               Sliders/Curve tab bar, then 10 vertical range sliders — one
 *               per ramp step, aligned to the swatch columns above — mapping
 *               to ColorEngine.tsx CurveEditor / palette.lightness_curve.
 *
 *   Screen 2c — Padding sliders
 *               Light-padding and dark-padding horizontal range sliders with
 *               value readouts. Shift buttons deferred (not yet specified).
 *
 * Layout references:
 *   apps/workbench/src/ColorEngine.tsx  — control structure & vocabulary
 *   apps/harmoni-figma-plugin/PLUGIN_UX_PLAN.md — agreed dimensions & tokens
 *
 * HOW TO RUN
 * ----------
 * 1. Open your Figma file in the desktop app.
 * 2. Plugins → Development → Open console (⌘⌥I on Mac).
 * 3. Type "allow pasting" and press Enter, then paste this file and Enter.
 *
 * Run after the existing wireframe scripts (Screens 1–6 occupy
 * x = 0 … 2040). New frames land at x = 2448, 2856, 3264.
 */

(async function createNeutralDetailWireframes() {

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
  const W     = 360;
  const H     = 620;
  const PAD   = 16;
  const CW    = W - PAD * 2;           // 328px content width
  const HDR_H = 48;
  const GAP   = 48;

  // Positioned after existing Screens 1–6 (each occupies W+GAP = 408px)
  const X2A = (W + GAP) * 6;           // 2448
  const X2B = (W + GAP) * 7;           // 2856
  const X2C = (W + GAP) * 8;           // 3264

  // ─── Ramp geometry (matches create-wireframes.js) ─────────────────────────
  const SWATCH_W   = 28;
  const SWATCH_H   = 52;
  const SWATCH_GAP = 4;
  const RAMP_W     = SWATCH_W * 10 + SWATCH_GAP * 9;         // 316px
  const RAMP_X     = PAD + Math.round((CW - RAMP_W) / 2);    // 22px from frame left

  // Greyscale approximation for steps 50 → 900
  const LIGHTNESS = [248, 232, 212, 188, 161, 132, 104, 78, 53, 26];
  const STEPS     = ["50","100","200","300","400","500","600","700","800","900"];
  const FG_STEP   = ["900","900","900","900","900","50","50","50","50","50"];
  const RATIOS    = ["14.2","9.8","6.5","4.9","3.8","4.6","6.1","9.1","12.8","19.3"];
  const RATINGS   = ["AA","AA","AA","AA","AA","AA","AA","AA","AA","AA"];

  // Lightness values (0–1, 1 = lightest) feeding the curve-editor sliders
  // Matches the descending curve produced by harmoni-core for a neutral ramp
  const LVALS = [0.97, 0.91, 0.83, 0.74, 0.63, 0.52, 0.41, 0.31, 0.21, 0.10];

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

  function grey(l) {
    const h = Math.round(l).toString(16).padStart(2, "0");
    return `#${h}${h}${h}`;
  }

  function makeFrame(name, x, y, w, h, bg = "#F2F2F2") {
    const f = figma.createFrame();
    f.name = name;
    f.x = x; f.y = y;
    f.resize(w, h);
    f.fills = solid(bg);
    f.clipsContent = true;
    return f;
  }

  function makeRect(parent, name, x, y, w, h, fill) {
    const r = figma.createRectangle();
    r.name = name;
    r.x = x; r.y = y;
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
    t.x = x; t.y = y;
    parent.appendChild(t);
    return t;
  }

  function makeDivider(parent, x, y, w) {
    return makeRect(parent, "Divider", x, y, w, 1, "#D8D8D8");
  }

  function makeSectionLabel(parent, label, x, y) {
    return makeText(parent, label, x, y, 10, "Medium", "#999999");
  }

  function makeHeader(parent, title, showBack = false) {
    makeRect(parent, "Header bg", 0, 0, W, HDR_H, "#1E1E1E");
    if (showBack) {
      makeText(parent, "‹", 14, 13, 20, "Regular", "#FFFFFF");
      makeText(parent, title, 38, 15, 14, "Medium", "#FFFFFF");
    } else {
      makeText(parent, title, PAD, 15, 14, "Medium", "#FFFFFF");
    }
    const closeBox = makeRect(parent, "Close", W - PAD - 22, 13, 22, 22, solidA("#FFFFFF", 0.12));
    closeBox.cornerRadius = 4;
    makeText(parent, "×", W - PAD - 16, 15, 12, "Regular", "#FFFFFF");
  }

  // Colour picker control card: label (small, grey) + hex value + swatch + chevron.
  // Maps to the <label><input type="color" …/></label> pattern in ColorEngine.tsx.
  // PW = 156px, two controls fit side-by-side with a 16px gap inside the content area.
  function makePickerControl(parent, label, hexDisplay, swatchHex, x, y) {
    const PW   = 156;
    const card = makeRect(parent, label + " picker", x, y, PW, 40, "#FFFFFF");
    card.strokes = solid("#E0E0E0");
    card.strokeWeight = 1;
    card.cornerRadius = 6;

    const sw = makeRect(parent, label + " swatch", x + 8, y + 8, 24, 24, swatchHex);
    sw.cornerRadius = 3;
    // White swatch needs a border so it reads against the white card background
    if (swatchHex === "#FAFAFA" || swatchHex === "#FFFFFF") {
      sw.strokes = solid("#CCCCCC");
      sw.strokeWeight = 1;
    }

    makeText(parent, label,      x + 38, y + 5,  9,  "Regular", "#999999");
    makeText(parent, hexDisplay, x + 38, y + 19, 11, "Medium",  "#1E1E1E");
    makeText(parent, "▾",        x + PW - 18, y + 12, 11, "Regular", "#BBBBBB");
  }

  // 10-step neutral ramp + step labels below. Matches Swatch.tsx internals.
  function makeNeutralRamp(parent, y) {
    for (let i = 0; i < 10; i++) {
      const l  = LIGHTNESS[i];
      const sx = RAMP_X + i * (SWATCH_W + SWATCH_GAP);

      const sw = makeRect(parent, `Swatch ${STEPS[i]}`, sx, y, SWATCH_W, SWATCH_H, grey(l));
      sw.cornerRadius = 2;

      const infoHex = l > 145 ? "#1E1E1E" : "#FFFFFF";
      const ix = sx + 2;
      makeText(parent, FG_STEP[i], ix, y + 8,  7, "Bold",    infoHex);
      makeText(parent, RATIOS[i],  ix, y + 18, 7, "Regular", infoHex);
      makeText(parent, RATINGS[i], ix, y + 28, 7, "Bold",    infoHex);
    }
    for (let i = 0; i < 10; i++) {
      const sx = RAMP_X + i * (SWATCH_W + SWATCH_GAP);
      makeText(parent, STEPS[i], sx + 2, y + SWATCH_H + 3, 7, "Regular", "#555555");
    }
  }

  // Right-aligned "Apply to Figma" button (matches existing Screen 2 layout)
  function makeApplyBtn(parent, y) {
    const AW  = 132;
    const AX  = PAD + CW - AW;
    const btn = makeRect(parent, "Apply to Figma", AX, y, AW, 32, "#1E1E1E");
    btn.cornerRadius = 6;
    makeText(parent, "Apply to Figma", AX + 14, y + 9, 11, "Medium", "#FFFFFF");
  }

  // Shared Neutral section: NEUTRAL label → divider → pickers → ramp.
  // Returns the y-cursor immediately below the ramp step labels.
  function makeNeutralSection(parent) {
    let y = HDR_H + 16;              // 64

    makeSectionLabel(parent, "NEUTRAL", PAD, y);
    y += 18;                         // 82

    makeDivider(parent, PAD, y, CW);
    y += 12;                         // 94

    // Two picker controls side by side (156px each, 16px gap = CW exactly)
    makePickerControl(parent, "White", "#FAFAFA", "#FAFAFA", PAD,            y);
    makePickerControl(parent, "Black", "#121212", "#121212", PAD + 156 + 16, y);
    y += 52;                         // 40px card + 12px gap → 146

    makeNeutralRamp(parent, y);
    y += SWATCH_H + 16;              // 52 + 16 → 214

    return y;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 2a — Default state (enhanced colour picker controls)
  // ═══════════════════════════════════════════════════════════════════════════
  const s2a = makeFrame("Screen 2a — Project (Neutral) Default", X2A, 0, W, H);
  makeHeader(s2a, "Acme Corp", true);

  let ya = makeNeutralSection(s2a);   // 214

  makeApplyBtn(s2a, ya);
  ya += 52;                           // 266

  makeSectionLabel(s2a, "BRAND", PAD, ya);
  ya += 18;                           // 284

  makeDivider(s2a, PAD, ya, CW);
  ya += 12;                           // 296

  const brandBox = makeRect(s2a, "Brand — placeholder", PAD, ya, CW, 84, "#F8F8F8");
  brandBox.strokes = solid("#D0D0D0");
  brandBox.strokeWeight = 1;
  brandBox.dashPattern = [6, 4];
  brandBox.cornerRadius = 6;
  makeText(s2a, "Brand colours — coming soon", PAD + 44, ya + 34, 11, "Regular", "#AAAAAA");

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 2b — Lightness curve editor (Sliders tab active)
  //
  // Maps to ColorEngine.tsx CurveEditor component:
  //   <Tabs.Trigger value="a">Sliders</Tabs.Trigger>
  //   <Tabs.Content value="a"> — 10 × input[type=range] over lightness_curve[]
  // ═══════════════════════════════════════════════════════════════════════════
  const s2b = makeFrame("Screen 2b — Project (Neutral) Curve Editor", X2B, 0, W, H);
  makeHeader(s2b, "Acme Corp", true);

  let yb = makeNeutralSection(s2b);   // 214

  // ── Section header ─────────────────────────────────────────────────────────
  makeSectionLabel(s2b, "LIGHTNESS CURVE", PAD, yb);
  yb += 18;                           // 232

  makeDivider(s2b, PAD, yb, CW);
  yb += 12;                           // 244

  // ── Segmented tab bar: Sliders | Curve ────────────────────────────────────
  const TAB_W = Math.round(CW / 2);   // 164px per tab

  // Outer card provides the overall border and radius
  const tabCard = makeRect(s2b, "Tabs container", PAD, yb, CW, 30, "#FFFFFF");
  tabCard.strokes = solid("#E0E0E0");
  tabCard.strokeWeight = 1;
  tabCard.cornerRadius = 6;

  // Active pill covers the left half
  const activePill = makeRect(s2b, "Tab — Sliders (active)", PAD, yb, TAB_W, 30, "#1E1E1E");
  activePill.topLeftRadius     = 6;
  activePill.topRightRadius    = 0;
  activePill.bottomLeftRadius  = 6;
  activePill.bottomRightRadius = 0;

  // Tab labels — centred within each half (estimated glyph widths at 12px)
  // "Sliders" ≈ 46px → centre of left tab (x=98) → start at 75
  makeText(s2b, "Sliders", 75,  yb + 9, 12, "Medium",  "#FFFFFF");
  // "Curve"   ≈ 33px → centre of right tab (x=262) → start at 245
  makeText(s2b, "Curve",   245, yb + 9, 12, "Regular", "#888888");

  // Thin divider between the two tab halves
  makeRect(s2b, "Tab mid-divider", PAD + TAB_W, yb + 6, 1, 18, "#D8D8D8");

  yb += 38;                           // 30px bar + 8px gap → 282

  // ── 10 vertical lightness sliders ─────────────────────────────────────────
  // One slider per ramp step, x-aligned with the swatch columns above.
  // Thumb position: top = lightest (1.0), bottom = darkest (0.0).
  const SLIDER_H = 64;
  const THUMB_H  = 8;
  const THUMB_W  = 12;

  // Percentage value labels above each slider column
  for (let i = 0; i < 10; i++) {
    const sx  = RAMP_X + i * (SWATCH_W + SWATCH_GAP);
    makeText(s2b, Math.round(LVALS[i] * 100) + "%", sx, yb, 7, "Regular", "#888888");
  }
  yb += 12;                           // 294

  // Tracks, active fills, and thumbs
  for (let i = 0; i < 10; i++) {
    const sx = RAMP_X + i * (SWATCH_W + SWATCH_GAP);

    // 4px track centred horizontally in the 28px swatch column
    const trackX = sx + Math.round((SWATCH_W - 4) / 2);

    // Thumb y offset from track top (higher lightness → thumb closer to top)
    const thumbTop = Math.round((1 - LVALS[i]) * (SLIDER_H - THUMB_H));

    // Track background (full height, light grey)
    const track = makeRect(s2b, `Track ${STEPS[i]}`, trackX, yb, 4, SLIDER_H, "#D8D8D8");
    track.cornerRadius = 2;

    // Active fill — from top down to thumb midpoint (represents lightness amount)
    const fillH = thumbTop + Math.round(THUMB_H / 2);
    if (fillH > 1) {
      const fill = makeRect(s2b, `Fill ${STEPS[i]}`, trackX, yb, 4, fillH, "#1E1E1E");
      fill.topLeftRadius  = 2;
      fill.topRightRadius = 2;
    }

    // Thumb — wider than the track, centred in the swatch column
    const thumbX = sx + Math.round((SWATCH_W - THUMB_W) / 2);
    const thumb  = makeRect(s2b, `Thumb ${STEPS[i]}`, thumbX, yb + thumbTop, THUMB_W, THUMB_H, "#1E1E1E");
    thumb.cornerRadius = 2;
  }

  yb += SLIDER_H + 8;                 // 294 + 64 + 8 = 366

  // Step labels below sliders, aligned with ramp columns
  for (let i = 0; i < 10; i++) {
    const sx = RAMP_X + i * (SWATCH_W + SWATCH_GAP);
    makeText(s2b, STEPS[i], sx + 2, yb, 7, "Regular", "#555555");
  }
  yb += 20;                           // 386

  makeApplyBtn(s2b, yb);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 2c — Padding sliders (light + dark padding)
  //
  // Maps to ColorEngine.tsx:
  //   palette__slider-container--light-padding  — input[type=range] value=lightPadding
  //   palette__slider-container--dark-padding   — input[type=range] value=darkPadding
  //
  // Shift buttons are deferred and not shown here.
  // ═══════════════════════════════════════════════════════════════════════════
  const s2c = makeFrame("Screen 2c — Project (Neutral) Padding", X2C, 0, W, H);
  makeHeader(s2c, "Acme Corp", true);

  let yc = makeNeutralSection(s2c);   // 214

  makeSectionLabel(s2c, "PADDING", PAD, yc);
  yc += 18;                           // 232

  makeDivider(s2c, PAD, yc, CW);
  yc += 12;                           // 244

  // Horizontal range slider row helper.
  // value / maxVal control the thumb position; value is shown as "n%" on the right.
  function makeHSliderRow(parent, label, value, maxVal, y) {
    const LABEL_W  = 92;
    const VAL_W    = 36;
    const TRACK_W  = CW - LABEL_W - VAL_W - 8;    // 192px track
    const TRACK_X  = PAD + LABEL_W;
    const FILL_W   = Math.round((value / maxVal) * TRACK_W);
    const THUMB_SZ = 14;

    // Label (left-aligned)
    makeText(parent, label, PAD, y + 10, 12, "Regular", "#333333");

    // Track background
    const track = makeRect(parent, label + " track", TRACK_X, y + 13, TRACK_W, 4, "#D8D8D8");
    track.cornerRadius = 2;

    // Active fill (left portion)
    if (FILL_W > 0) {
      const fill = makeRect(parent, label + " fill", TRACK_X, y + 13, FILL_W, 4, "#1E1E1E");
      fill.topLeftRadius    = 2;
      fill.bottomLeftRadius = 2;
    }

    // Thumb (circle, centred on the fill end-point)
    const thumbX = TRACK_X + FILL_W - Math.round(THUMB_SZ / 2);
    const thumbY = y + 13 - Math.round((THUMB_SZ - 4) / 2);
    const thumb  = makeRect(parent, label + " thumb", thumbX, thumbY, THUMB_SZ, THUMB_SZ, "#1E1E1E");
    thumb.cornerRadius = 7;
    thumb.strokes = solid("#FFFFFF");
    thumb.strokeWeight = 2;

    // Value readout (right-aligned after the track)
    makeText(parent, value + "%", TRACK_X + TRACK_W + 8, y + 8, 12, "Medium", "#1E1E1E");
  }

  // Light padding: 12% of a ~30% maximum
  makeHSliderRow(s2c, "Light padding", 12, 30, yc);
  yc += 44;                           // 40px row + 4px gap → 288

  // Dark padding: 8% of a ~30% maximum
  makeHSliderRow(s2c, "Dark padding", 8, 30, yc);
  yc += 44;                           // 332

  makeApplyBtn(s2c, yc);

  // ─── Zoom to fit new screens ──────────────────────────────────────────────
  figma.viewport.scrollAndZoomIntoView([s2a, s2b, s2c]);

  console.log('✓ Added Screens 2a, 2b, 2c to "Wireframes — Harmoni Plugin".');

})().catch((err) => console.error("Wireframe error:", err.message));
