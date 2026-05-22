/**
 * Harmoni Plugin — v1 Wireframes
 *
 * Single-screen, no-nav, SupaPalette-inspired layout for the Harmoni
 * plugin v1. Renders four frames side by side:
 *
 *   320px — narrowest candidate (SupaPalette-like footprint)
 *   400px — middle candidate
 *   480px — widest candidate
 *   400px tint-active variant — shows conditional tint UI in context
 *
 * Each frame contains the full v1 control inventory:
 *   - Header strip (title + project picker + overflow)
 *   - Neutral block (white/black pickers, [tint], light ramp + curve +
 *     padding, dark ramp + curve + padding)
 *   - Brand block (hex picker, "use as tint", light ramp + curve +
 *     padding, dark ramp + curve + padding)
 *   - Output strip (output mode toggles, collection, Apply)
 *
 * Compare side-by-side in Figma to choose the narrowest width that
 * fits the inventory without crowding. Log the decision in
 * PLUGIN_UX_PLAN.md's Iteration log.
 *
 * HOW TO RUN
 * ----------
 * 1. Open your Figma file in the desktop app.
 * 2. Plugins → Development → Open console.
 * 3. Type "allow pasting" and press Enter.
 * 4. Paste this file and press Enter.
 */

(async function createV1Wireframes() {

  // ─── Fonts ──────────────────────────────────────────────────────────────────
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  // ─── Page ───────────────────────────────────────────────────────────────────
  const page = figma.createPage();
  page.name = "Wireframes — Harmoni Plugin (v1)";
  figma.currentPage = page;

  // ─── Mock data (consistent across widths) ───────────────────────────────────

  // 10-step ramp data — greyscale approximation matching workbench Swatch.tsx
  const NEUTRAL_L_LIGHT = [248, 232, 212, 188, 161, 132, 104, 78, 53, 26];
  const NEUTRAL_L_DARK  = [240, 220, 196, 168, 138, 108, 80, 56, 36, 18];

  // Brand: cool blue family
  const BRAND_LIGHT = [
    "#EFF6FF", "#DBEAFE", "#BFDBFE", "#93C5FD", "#60A5FA",
    "#3B82F6", "#2563EB", "#1D4ED8", "#1E40AF", "#172554",
  ];
  const BRAND_DARK = [
    "#0B1220", "#101A30", "#162447", "#1E3A8A", "#1E40AF",
    "#1D4ED8", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD",
  ];

  const STEPS    = ["50","100","200","300","400","500","600","700","800","900"];
  const FG_STEP  = ["900","900","900","900","900","50","50","50","50","50"];
  const RATIOS   = ["14.2","9.8","6.5","4.9","3.8","4.6","6.1","9.1","12.8","19.3"];
  const RATING   = "AA";

  // Lightness curve values (0–1), descending — visualised under each ramp
  const LVALS_LIGHT = [0.97, 0.91, 0.83, 0.74, 0.63, 0.52, 0.41, 0.31, 0.21, 0.10];
  const LVALS_DARK  = [0.94, 0.86, 0.77, 0.66, 0.54, 0.42, 0.31, 0.22, 0.14, 0.07];

  // ─── Colour helpers ─────────────────────────────────────────────────────────

  function hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16) / 255,
      g: parseInt(hex.slice(3, 5), 16) / 255,
      b: parseInt(hex.slice(5, 7), 16) / 255,
    };
  }

  function solid(hex)            { return [{ type: "SOLID", color: hexToRgb(hex) }]; }
  function solidA(hex, opacity)  { return [{ type: "SOLID", color: hexToRgb(hex), opacity }]; }
  function grey(l) {
    const h = Math.round(l).toString(16).padStart(2, "0");
    return `#${h}${h}${h}`;
  }

  // ─── Primitive node helpers ─────────────────────────────────────────────────

  function makeFrame(name, x, y, w, h, bg) {
    const f = figma.createFrame();
    f.name = name; f.x = x; f.y = y; f.resize(w, h);
    f.fills = solid(bg); f.clipsContent = true;
    return f;
  }

  function makeRect(parent, name, x, y, w, h, fill) {
    const r = figma.createRectangle();
    r.name = name; r.x = x; r.y = y; r.resize(w, h);
    r.fills = Array.isArray(fill) ? fill : solid(fill);
    parent.appendChild(r);
    return r;
  }

  function makeText(parent, content, x, y, size, style, hex) {
    const t = figma.createText();
    t.fontName = { family: "Inter", style }; t.fontSize = size;
    t.fills = solid(hex); t.characters = content;
    t.x = x; t.y = y;
    parent.appendChild(t);
    return t;
  }

  function makeDivider(parent, x, y, w) {
    return makeRect(parent, "Divider", x, y, w, 1, "#E4E4E4");
  }

  function makeSectionLabel(parent, label, x, y) {
    return makeText(parent, label, x, y, 9, "Medium", "#999999");
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SCREEN BUILDER
  // ────────────────────────────────────────────────────────────────────────────
  //
  // Renders the complete v1 single-screen plugin at the given width.
  // Geometry derives from W; the script is width-agnostic by design.
  //
  // tintActive: when true, the conditional tint controls appear inline
  //   under the neutral pickers (showing the brand colour acting as the
  //   neutral tint source).
  // ────────────────────────────────────────────────────────────────────────────
  function renderScreen(originX, W, tintActive) {

    // Width-dependent layout
    const PAD       = W <= 360 ? 12 : 16;
    const CW        = W - PAD * 2;
    const HDR_H     = 40;
    const SWATCH_GAP = 3;
    const SWATCH_W   = Math.floor((CW - SWATCH_GAP * 9) / 10);
    const RAMP_W     = SWATCH_W * 10 + SWATCH_GAP * 9;
    const RAMP_X_OFF = Math.round((CW - RAMP_W) / 2);
    const SWATCH_H   = 56;

    // Pre-compute the height by walking the layout once with a dry cursor.
    // We commit by re-running below into a real frame.

    function layoutHeight() {
      let y = HDR_H + 12;
      y += 14;                  // section label
      y += 6;                   // divider+gap
      y += 44;                  // white/black pickers row
      if (tintActive) y += 56;  // tint controls block
      // Neutral light ramp + curve + padding
      y += 8;                   // ramp top spacing
      y += SWATCH_H + 14;       // ramp + step labels row
      y += 44;                  // inline curve sliders
      y += 28;                  // padding row
      y += 16;                  // gap
      // Neutral dark ramp + curve + padding
      y += SWATCH_H + 14;
      y += 44;
      y += 28;
      y += 24;                  // section divider
      // Brand section
      y += 14;                  // section label
      y += 6;
      y += 44;                  // hex picker + use-as-tint button
      // Brand light ramp + curve + padding
      y += 8;
      y += SWATCH_H + 14;
      y += 44;
      y += 28;
      y += 16;
      // Brand dark ramp + curve + padding
      y += SWATCH_H + 14;
      y += 44;
      y += 28;
      y += 24;                  // section divider
      // Output strip
      y += 14;                  // section label
      y += 6;
      y += 56;                  // output toggles
      y += 38;                  // collection
      y += 48;                  // Apply button
      y += PAD;                 // bottom pad
      return y;
    }

    const H = layoutHeight();
    const name = tintActive
      ? `v1 — ${W}px (tint active)`
      : `v1 — ${W}px`;
    const f = makeFrame(name, originX, 0, W, H, "#F4F4F5");

    let y = 0;

    // ── Header strip ─────────────────────────────────────────────────────────
    makeRect(f, "Header bg", 0, 0, W, HDR_H, "#1E1E1E");
    makeText(f, "Harmoni", PAD, 12, 13, "Medium", "#FFFFFF");

    // Project picker — pill in header, takes the middle area
    const PICKER_X = PAD + 64;
    const PICKER_W = Math.min(160, W - PICKER_X - PAD - 32);
    const picker = makeRect(f, "Project picker", PICKER_X, 8, PICKER_W, 24, solidA("#FFFFFF", 0.12));
    picker.cornerRadius = 12;
    makeText(f, "Acme Corp", PICKER_X + 10, 13, 11, "Regular", "#FFFFFF");
    makeText(f, "▾", PICKER_X + PICKER_W - 14, 13, 10, "Regular", "#FFFFFF");

    // Overflow menu
    makeText(f, "···", W - PAD - 14, 12, 14, "Bold", "#FFFFFF");

    y = HDR_H + 12;

    // ── NEUTRAL section ──────────────────────────────────────────────────────
    makeSectionLabel(f, "NEUTRAL", PAD, y); y += 12;
    makeDivider(f, PAD, y, CW); y += 8;

    // White / Black pickers, side by side
    const PICK_W = Math.floor((CW - 8) / 2);

    function pickerCard(label, hex, swatchHex, x) {
      const card = makeRect(f, label + " picker", x, y, PICK_W, 36, "#FFFFFF");
      card.strokes = solid("#E0E0E0"); card.strokeWeight = 1; card.cornerRadius = 6;
      const sw = makeRect(f, label + " swatch", x + 6, y + 6, 24, 24, swatchHex);
      sw.cornerRadius = 3;
      if (swatchHex.toUpperCase() === "#FAFAFA" || swatchHex === "#FFFFFF") {
        sw.strokes = solid("#D0D0D0"); sw.strokeWeight = 1;
      }
      makeText(f, label, x + 36, y + 4, 9, "Regular", "#999999");
      makeText(f, hex,   x + 36, y + 17, 11, "Medium", "#1E1E1E");
    }

    pickerCard("White", "#FAFAFA", "#FAFAFA", PAD);
    pickerCard("Black", "#121212", "#121212", PAD + PICK_W + 8);
    y += 44;

    // Tint controls (conditional)
    if (tintActive) {
      const tintCard = makeRect(f, "Tint card", PAD, y, CW, 48, "#FFFFFF");
      tintCard.strokes = solid("#E0E0E0"); tintCard.strokeWeight = 1; tintCard.cornerRadius = 6;
      const ts = makeRect(f, "Tint source swatch", PAD + 8, y + 8, 18, 18, BRAND_LIGHT[5]);
      ts.cornerRadius = 3;
      makeText(f, "Neutral tint", PAD + 32, y + 5, 9, "Regular", "#999999");
      makeText(f, "From brand", PAD + 32, y + 17, 10, "Medium", "#1E1E1E");

      // Strength slider on the right side of the card
      const SL_X = PAD + 130;
      const SL_W = CW - 130 - 60 - 12;
      const track = makeRect(f, "Tint strength track", SL_X, y + 21, SL_W, 4, "#E4E4E4");
      track.cornerRadius = 2;
      const fillW = Math.round(SL_W * 0.42);
      const fill = makeRect(f, "Tint strength fill", SL_X, y + 21, fillW, 4, "#1E1E1E");
      fill.topLeftRadius = 2; fill.bottomLeftRadius = 2;
      const thumb = makeRect(f, "Tint strength thumb", SL_X + fillW - 6, y + 17, 12, 12, "#1E1E1E");
      thumb.cornerRadius = 6; thumb.strokes = solid("#FFFFFF"); thumb.strokeWeight = 2;
      makeText(f, "42%", SL_X + SL_W + 6, y + 16, 10, "Medium", "#1E1E1E");

      // Remove tint link
      makeText(f, "Remove", CW + PAD - 44, y + 4, 9, "Regular", "#2563EB");
      y += 56;
    }

    // ── Neutral light ramp + curve + padding ─────────────────────────────────
    y += 8;
    y = drawRampBlock(f, "Neutral light", PAD, y, RAMP_X_OFF, SWATCH_W, SWATCH_H, SWATCH_GAP, CW, RAMP_W,
                     NEUTRAL_L_LIGHT, LVALS_LIGHT, /*isNeutral*/true, /*isDark*/false);

    // ── Neutral dark ramp + curve + padding ──────────────────────────────────
    y = drawRampBlock(f, "Neutral dark", PAD, y, RAMP_X_OFF, SWATCH_W, SWATCH_H, SWATCH_GAP, CW, RAMP_W,
                     NEUTRAL_L_DARK, LVALS_DARK, /*isNeutral*/true, /*isDark*/true);

    y += 16;
    makeDivider(f, PAD, y, CW); y += 8;

    // ── BRAND section ────────────────────────────────────────────────────────
    makeSectionLabel(f, "BRAND", PAD, y); y += 12;
    makeDivider(f, PAD, y, CW); y += 8;

    // Brand hex picker + "use as tint" button
    const BRAND_PICK_W = Math.floor(CW * 0.55) - 4;
    const TINT_BTN_W   = CW - BRAND_PICK_W - 8;

    const brandCard = makeRect(f, "Brand picker", PAD, y, BRAND_PICK_W, 36, "#FFFFFF");
    brandCard.strokes = solid("#E0E0E0"); brandCard.strokeWeight = 1; brandCard.cornerRadius = 6;
    const bsw = makeRect(f, "Brand swatch", PAD + 6, y + 6, 24, 24, BRAND_LIGHT[5]);
    bsw.cornerRadius = 3;
    makeText(f, "Brand", PAD + 36, y + 4, 9, "Regular", "#999999");
    makeText(f, "#3B82F6", PAD + 36, y + 17, 11, "Medium", "#1E1E1E");

    const tintBtnX = PAD + BRAND_PICK_W + 8;
    const tintBtn = makeRect(f, "Use as tint", tintBtnX, y, TINT_BTN_W, 36,
                              tintActive ? "#1E1E1E" : "#FFFFFF");
    tintBtn.strokes = solid(tintActive ? "#1E1E1E" : "#C8C8C8");
    tintBtn.strokeWeight = 1; tintBtn.cornerRadius = 6;
    const tintBtnLabel = tintActive ? "Tinting" : "Use as tint";
    const tintBtnCol = tintActive ? "#FFFFFF" : "#1E1E1E";
    const labelW = tintActive ? 42 : 60;
    makeText(f, tintBtnLabel, tintBtnX + Math.round((TINT_BTN_W - labelW) / 2), y + 11, 10, "Medium", tintBtnCol);
    y += 44;

    // ── Brand light ramp + curve + padding ──────────────────────────────────
    y += 8;
    y = drawRampBlock(f, "Brand light", PAD, y, RAMP_X_OFF, SWATCH_W, SWATCH_H, SWATCH_GAP, CW, RAMP_W,
                     BRAND_LIGHT, LVALS_LIGHT, /*isNeutral*/false, /*isDark*/false);

    // ── Brand dark ramp + curve + padding ────────────────────────────────────
    y = drawRampBlock(f, "Brand dark", PAD, y, RAMP_X_OFF, SWATCH_W, SWATCH_H, SWATCH_GAP, CW, RAMP_W,
                     BRAND_DARK, LVALS_DARK, /*isNeutral*/false, /*isDark*/true);

    y += 16;
    makeDivider(f, PAD, y, CW); y += 8;

    // ── OUTPUT strip ─────────────────────────────────────────────────────────
    makeSectionLabel(f, "APPLY TO FIGMA", PAD, y); y += 12;
    makeDivider(f, PAD, y, CW); y += 8;

    // Two output toggles, side by side
    const OUT_W = Math.floor((CW - 8) / 2);

    function outputToggle(label, sub, on, x) {
      const t = makeRect(f, label + " output", x, y, OUT_W, 48, on ? "#1E1E1E" : "#FFFFFF");
      t.strokes = solid(on ? "#1E1E1E" : "#D0D0D0"); t.strokeWeight = 1; t.cornerRadius = 6;
      const col = on ? "#FFFFFF" : "#1E1E1E";
      const subCol = on ? solidA("#FFFFFF", 0.7) : solid("#888888");
      makeText(f, label, x + 10, y + 6, 11, "Medium", col);
      const subText = makeText(f, sub, x + 10, y + 22, 9, "Regular", on ? "#FFFFFF" : "#888888");
      subText.fills = subCol;
    }

    outputToggle("Canvas swatches", "Place on page", true,  PAD);
    outputToggle("Colour variables", "Write to collection", false, PAD + OUT_W + 8);
    y += 56;

    // Collection picker — inline popover-style trigger, not a modal
    const collDrop = makeRect(f, "Collection dropdown", PAD, y, CW, 30, "#FFFFFF");
    collDrop.strokes = solid("#D0D0D0"); collDrop.strokeWeight = 1; collDrop.cornerRadius = 5;
    makeText(f, "Collection", PAD + 10, y + 4, 8, "Regular", "#999999");
    makeText(f, "Brand · Neutral", PAD + 10, y + 14, 10, "Medium", "#1E1E1E");
    makeText(f, "▾", PAD + CW - 16, y + 9, 10, "Regular", "#888888");
    y += 38;

    // Primary Apply button
    const apply = makeRect(f, "Apply", PAD, y, CW, 40, "#1E1E1E");
    apply.cornerRadius = 6;
    const applyLabelW = 88;
    makeText(f, "Apply to Figma", PAD + Math.round((CW - applyLabelW) / 2), y + 13, 12, "Medium", "#FFFFFF");
    y += 48;

    return f;
  }

  // ── Ramp + inline curve + padding block ───────────────────────────────────
  //
  // Renders a single ramp (10 swatches), the 10-step inline lightness
  // curve directly beneath, and a one-row padding control with shift
  // buttons. Returns the post-block y cursor.
  // ────────────────────────────────────────────────────────────────────────────
  function drawRampBlock(f, label, PAD, y, RAMP_X_OFF, SW, SH, GAP, CW, RAMP_W,
                          colors, lvals, isNeutral, isDark) {

    const isHexArray = typeof colors[0] === "string";

    // Ramp swatches
    for (let i = 0; i < 10; i++) {
      const cx = PAD + RAMP_X_OFF + i * (SW + GAP);
      const fill = isHexArray ? colors[i] : grey(colors[i]);
      const sw = makeRect(f, `${label} ${STEPS[i]}`, cx, y, SW, SH, fill);
      sw.cornerRadius = 2;

      // Foreground text colour: light swatches → dark text, dark → light text
      const lightness = isHexArray
        ? estimateLightness(colors[i])
        : colors[i];
      const fg = lightness > 145 ? "#1E1E1E" : "#FFFFFF";

      // Only render contrast info if the swatch is wide enough
      if (SW >= 30) {
        makeText(f, FG_STEP[i], cx + 2, y + 6, 7, "Bold", fg);
        if (SW >= 34) {
          makeText(f, RATIOS[i], cx + 2, y + 16, 7, "Regular", fg);
          makeText(f, RATING,    cx + 2, y + 26, 7, "Bold", fg);
        }
      }
    }

    // Step labels below
    for (let i = 0; i < 10; i++) {
      const cx = PAD + RAMP_X_OFF + i * (SW + GAP);
      makeText(f, STEPS[i], cx + 1, y + SH + 3, 7, "Regular", "#666666");
    }
    y += SH + 14;

    // Inline lightness curve — vertical sliders directly under each column
    const SLIDER_H = 40;
    for (let i = 0; i < 10; i++) {
      const cx = PAD + RAMP_X_OFF + i * (SW + GAP);
      const track = makeRect(f, `${label} curve ${i} track`, cx + Math.floor(SW / 2) - 1, y, 2, SLIDER_H, "#D8D8D8");
      track.cornerRadius = 1;
      // Thumb position from lightness value (lvals descending in palette order)
      const thumbY = y + Math.round((1 - lvals[i]) * (SLIDER_H - 8));
      const thumb = makeRect(f, `${label} curve ${i} thumb`, cx + Math.floor(SW / 2) - 4, thumbY, 8, 8, "#1E1E1E");
      thumb.cornerRadius = 4;
    }
    y += SLIDER_H + 4;

    // Padding slider row — single horizontal slider + shift buttons
    const SHIFT_W = 22;
    const PAD_LABEL_W = 56;
    const PAD_VAL_W = 28;
    const SHIFTS_W = SHIFT_W * 2 + 4;
    const TRACK_W = CW - PAD_LABEL_W - PAD_VAL_W - SHIFTS_W - 16;
    const tX = PAD + PAD_LABEL_W;

    makeText(f, "Padding", PAD, y + 6, 10, "Regular", "#333333");

    const track = makeRect(f, label + " padding track", tX, y + 10, TRACK_W, 4, "#E4E4E4");
    track.cornerRadius = 2;
    const pct = isDark ? 0.08 : 0.12;
    const fillW = Math.round(TRACK_W * (pct / 0.30));
    if (fillW > 0) {
      const fill = makeRect(f, label + " padding fill", tX, y + 10, fillW, 4, "#1E1E1E");
      fill.topLeftRadius = 2; fill.bottomLeftRadius = 2;
    }
    const thumb = makeRect(f, label + " padding thumb", tX + fillW - 6, y + 6, 12, 12, "#1E1E1E");
    thumb.cornerRadius = 6; thumb.strokes = solid("#FFFFFF"); thumb.strokeWeight = 2;
    makeText(f, Math.round(pct * 100) + "%", tX + TRACK_W + 4, y + 4, 10, "Medium", "#1E1E1E");

    // Shift buttons (left, right)
    const shiftsX = PAD + CW - SHIFTS_W;
    const sL = makeRect(f, label + " shift left", shiftsX, y, SHIFT_W, 20, "#FFFFFF");
    sL.strokes = solid("#C8C8C8"); sL.strokeWeight = 1; sL.cornerRadius = 4;
    makeText(f, "‹", shiftsX + 7, y + 3, 11, "Bold", "#444444");

    const sR = makeRect(f, label + " shift right", shiftsX + SHIFT_W + 4, y, SHIFT_W, 20, "#FFFFFF");
    sR.strokes = solid("#C8C8C8"); sR.strokeWeight = 1; sR.cornerRadius = 4;
    makeText(f, "›", shiftsX + SHIFT_W + 4 + 9, y + 3, 11, "Bold", "#444444");

    y += 28;
    return y;
  }

  // Rough perceived lightness from hex — for choosing FG text colour on swatches.
  // Not for any production logic — just so the wireframe text stays legible.
  function estimateLightness(hex) {
    const { r, g, b } = hexToRgb(hex);
    return Math.round((0.299 * r + 0.587 * g + 0.114 * b) * 255);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────

  const GAP = 48;
  const widths  = [320, 400, 480];
  const labels  = [
    "320px — narrowest candidate (SupaPalette-like)",
    "400px — middle candidate",
    "480px — widest candidate",
    "400px — tint active (conditional UI)",
  ];

  const frames = [];
  let cursorX = 0;

  for (const w of widths) {
    frames.push(renderScreen(cursorX, w, /*tintActive*/false));
    cursorX += w + GAP;
  }
  // Tint-active variant at 400px
  frames.push(renderScreen(cursorX, 400, /*tintActive*/true));

  // Caption row above the frames
  let captionX = 0;
  const allWidths = [...widths, 400];
  for (let i = 0; i < allWidths.length; i++) {
    const cap = figma.createText();
    cap.fontName = { family: "Inter", style: "Regular" };
    cap.fontSize = 11;
    cap.fills = solid("#666666");
    cap.characters = labels[i];
    cap.x = captionX;
    cap.y = -28;
    page.appendChild(cap);
    captionX += allWidths[i] + GAP;
  }

  // Annotation below the frames
  const maxH = Math.max(...frames.map((f) => f.height));
  const anno = figma.createText();
  anno.fontName = { family: "Inter", style: "Regular" };
  anno.fontSize = 11;
  anno.fills = solid("#888888");
  anno.characters =
    "v1 — single screen, no nav, single brand colour, both light + dark ramps shown, inline curve + padding controls. " +
    "Compare widths side-by-side; pick narrowest fit. Log in PLUGIN_UX_PLAN.md → Iteration log.";
  anno.x = 0;
  anno.y = maxH + 20;
  page.appendChild(anno);

  figma.viewport.scrollAndZoomIntoView(frames);
  console.log('✓ Created page "' + page.name + '" with ' + frames.length + ' frames.');

})().catch((err) => console.error("Wireframe error:", err.message));
