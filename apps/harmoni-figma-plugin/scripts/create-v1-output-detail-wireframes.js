/**
 * Harmoni Plugin — v1 Output Zone Detail Wireframes
 *
 * Three 480px frames side by side, exploring the output zone's three
 * states. The top half of every frame is identical to the v1 main
 * screen so we can see that nothing above the output zone moves when
 * the user drills into a detail view.
 *
 *   1. Default state          — output toggles + Configure ▸ affordances + Apply
 *   2. Canvas swatches detail — layout / shape / labels / badges / preview
 *   3. Colour variables detail — collection / naming / modes / preview
 *
 * The zone header acts as the back affordance:
 *   default:           "APPLY TO FIGMA"
 *   swatches detail:   "‹ APPLY ▸ CANVAS SWATCHES"
 *   variables detail:  "‹ APPLY ▸ COLOUR VARIABLES"
 *
 * HOW TO RUN
 * ----------
 * 1. Open your Figma file in the desktop app.
 * 2. Plugins → Development → Open console.
 * 3. Type "allow pasting" and press Enter.
 * 4. Paste this file and press Enter.
 */

(async function createV1OutputDetailWireframes() {

  // ─── Fonts ──────────────────────────────────────────────────────────────────
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  // ─── Page ───────────────────────────────────────────────────────────────────
  const page = figma.createPage();
  page.name = "Wireframes — Harmoni Plugin (v1 output detail)";
  figma.currentPage = page;

  // ─── Mock data ──────────────────────────────────────────────────────────────
  const NEUTRAL_L_LIGHT = [248, 232, 212, 188, 161, 132, 104, 78, 53, 26];
  const NEUTRAL_L_DARK  = [240, 220, 196, 168, 138, 108, 80, 56, 36, 18];

  const BRAND_LIGHT = [
    "#EFF6FF", "#DBEAFE", "#BFDBFE", "#93C5FD", "#60A5FA",
    "#3B82F6", "#2563EB", "#1D4ED8", "#1E40AF", "#172554",
  ];
  const BRAND_DARK = [
    "#0B1220", "#101A30", "#162447", "#1E3A8A", "#1E40AF",
    "#1D4ED8", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD",
  ];

  const STEPS   = ["50","100","200","300","400","500","600","700","800","900"];
  const FG_STEP = ["900","900","900","900","900","50","50","50","50","50"];
  const RATIOS  = ["14.2","9.8","6.5","4.9","3.8","4.6","6.1","9.1","12.8","19.3"];
  const RATING  = "AA";

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
  function solid(hex)           { return [{ type: "SOLID", color: hexToRgb(hex) }]; }
  function solidA(hex, opacity) { return [{ type: "SOLID", color: hexToRgb(hex), opacity }]; }
  function grey(l) {
    const h = Math.round(l).toString(16).padStart(2, "0");
    return `#${h}${h}${h}`;
  }
  function estimateLightness(hex) {
    const { r, g, b } = hexToRgb(hex);
    return Math.round((0.299 * r + 0.587 * g + 0.114 * b) * 255);
  }

  // ─── Node helpers ───────────────────────────────────────────────────────────
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
  function makeSectionLabel(parent, label, x, y, hex) {
    return makeText(parent, label, x, y, 9, "Medium", hex || "#999999");
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SHARED TOP — header + neutral + brand (identical across all three frames)
  // ────────────────────────────────────────────────────────────────────────────
  //
  // Returns the y cursor just below the brand block divider, so the
  // per-frame output zone can pick up from there.
  // ────────────────────────────────────────────────────────────────────────────
  function renderSharedTop(f, W) {
    const PAD       = 16;
    const CW        = W - PAD * 2;
    const HDR_H     = 40;
    const SWATCH_GAP = 3;
    const SWATCH_W   = Math.floor((CW - SWATCH_GAP * 9) / 10);
    const RAMP_W     = SWATCH_W * 10 + SWATCH_GAP * 9;
    const RAMP_X_OFF = Math.round((CW - RAMP_W) / 2);
    const SWATCH_H   = 56;

    // Header
    makeRect(f, "Header bg", 0, 0, W, HDR_H, "#1E1E1E");
    makeText(f, "Harmoni", PAD, 12, 13, "Medium", "#FFFFFF");
    const PICKER_X = PAD + 64;
    const PICKER_W = Math.min(160, W - PICKER_X - PAD - 32);
    const picker = makeRect(f, "Project picker", PICKER_X, 8, PICKER_W, 24, solidA("#FFFFFF", 0.12));
    picker.cornerRadius = 12;
    makeText(f, "Acme Corp", PICKER_X + 10, 13, 11, "Regular", "#FFFFFF");
    makeText(f, "▾", PICKER_X + PICKER_W - 14, 13, 10, "Regular", "#FFFFFF");
    makeText(f, "···", W - PAD - 14, 12, 14, "Bold", "#FFFFFF");

    let y = HDR_H + 12;

    // NEUTRAL
    makeSectionLabel(f, "NEUTRAL", PAD, y); y += 12;
    makeDivider(f, PAD, y, CW); y += 8;

    const PICK_W = Math.floor((CW - 8) / 2);
    drawPickerCard(f, "White", "#FAFAFA", "#FAFAFA", PAD, y, PICK_W);
    drawPickerCard(f, "Black", "#121212", "#121212", PAD + PICK_W + 8, y, PICK_W);
    y += 44;

    y += 8;
    y = drawRampBlock(f, "Neutral light", PAD, y, RAMP_X_OFF, SWATCH_W, SWATCH_H, SWATCH_GAP, CW,
                     NEUTRAL_L_LIGHT, LVALS_LIGHT, false);
    y = drawRampBlock(f, "Neutral dark", PAD, y, RAMP_X_OFF, SWATCH_W, SWATCH_H, SWATCH_GAP, CW,
                     NEUTRAL_L_DARK, LVALS_DARK, true);

    y += 16;
    makeDivider(f, PAD, y, CW); y += 8;

    // BRAND
    makeSectionLabel(f, "BRAND", PAD, y); y += 12;
    makeDivider(f, PAD, y, CW); y += 8;

    // Brand picker + use-as-tint (not active here — focus is on output zone)
    const BRAND_PICK_W = Math.floor(CW * 0.55) - 4;
    const TINT_BTN_W   = CW - BRAND_PICK_W - 8;

    const brandCard = makeRect(f, "Brand picker", PAD, y, BRAND_PICK_W, 36, "#FFFFFF");
    brandCard.strokes = solid("#E0E0E0"); brandCard.strokeWeight = 1; brandCard.cornerRadius = 6;
    const bsw = makeRect(f, "Brand swatch", PAD + 6, y + 6, 24, 24, BRAND_LIGHT[5]);
    bsw.cornerRadius = 3;
    makeText(f, "Brand",   PAD + 36, y + 4,  9,  "Regular", "#999999");
    makeText(f, "#3B82F6", PAD + 36, y + 17, 11, "Medium",  "#1E1E1E");

    const tintBtnX = PAD + BRAND_PICK_W + 8;
    const tintBtn = makeRect(f, "Use as tint", tintBtnX, y, TINT_BTN_W, 36, "#FFFFFF");
    tintBtn.strokes = solid("#C8C8C8"); tintBtn.strokeWeight = 1; tintBtn.cornerRadius = 6;
    makeText(f, "Use as tint", tintBtnX + Math.round((TINT_BTN_W - 60) / 2), y + 11, 10, "Medium", "#1E1E1E");
    y += 44;

    y += 8;
    y = drawRampBlock(f, "Brand light", PAD, y, RAMP_X_OFF, SWATCH_W, SWATCH_H, SWATCH_GAP, CW,
                     BRAND_LIGHT, LVALS_LIGHT, false);
    y = drawRampBlock(f, "Brand dark", PAD, y, RAMP_X_OFF, SWATCH_W, SWATCH_H, SWATCH_GAP, CW,
                     BRAND_DARK, LVALS_DARK, true);

    y += 16;
    makeDivider(f, PAD, y, CW); y += 8;

    return { y, PAD, CW };
  }

  function drawPickerCard(f, label, hex, swatchHex, x, y, w) {
    const card = makeRect(f, label + " picker", x, y, w, 36, "#FFFFFF");
    card.strokes = solid("#E0E0E0"); card.strokeWeight = 1; card.cornerRadius = 6;
    const sw = makeRect(f, label + " swatch", x + 6, y + 6, 24, 24, swatchHex);
    sw.cornerRadius = 3;
    if (swatchHex.toUpperCase() === "#FAFAFA" || swatchHex === "#FFFFFF") {
      sw.strokes = solid("#D0D0D0"); sw.strokeWeight = 1;
    }
    makeText(f, label, x + 36, y + 4,  9,  "Regular", "#999999");
    makeText(f, hex,   x + 36, y + 17, 11, "Medium",  "#1E1E1E");
  }

  function drawRampBlock(f, label, PAD, y, RAMP_X_OFF, SW, SH, GAP, CW, colors, lvals, isDark) {
    const isHexArray = typeof colors[0] === "string";

    for (let i = 0; i < 10; i++) {
      const cx = PAD + RAMP_X_OFF + i * (SW + GAP);
      const fill = isHexArray ? colors[i] : grey(colors[i]);
      const sw = makeRect(f, `${label} ${STEPS[i]}`, cx, y, SW, SH, fill);
      sw.cornerRadius = 2;

      const lightness = isHexArray ? estimateLightness(colors[i]) : colors[i];
      const fg = lightness > 145 ? "#1E1E1E" : "#FFFFFF";
      if (SW >= 30) {
        makeText(f, FG_STEP[i], cx + 2, y + 6, 7, "Bold", fg);
        if (SW >= 34) {
          makeText(f, RATIOS[i], cx + 2, y + 16, 7, "Regular", fg);
          makeText(f, RATING,    cx + 2, y + 26, 7, "Bold", fg);
        }
      }
    }
    for (let i = 0; i < 10; i++) {
      const cx = PAD + RAMP_X_OFF + i * (SW + GAP);
      makeText(f, STEPS[i], cx + 1, y + SH + 3, 7, "Regular", "#666666");
    }
    y += SH + 14;

    // Inline curve sliders
    const SLIDER_H = 40;
    for (let i = 0; i < 10; i++) {
      const cx = PAD + RAMP_X_OFF + i * (SW + GAP);
      const track = makeRect(f, `${label} curve ${i} track`, cx + Math.floor(SW / 2) - 1, y, 2, SLIDER_H, "#D8D8D8");
      track.cornerRadius = 1;
      const thumbY = y + Math.round((1 - lvals[i]) * (SLIDER_H - 8));
      const thumb = makeRect(f, `${label} curve ${i} thumb`, cx + Math.floor(SW / 2) - 4, thumbY, 8, 8, "#1E1E1E");
      thumb.cornerRadius = 4;
    }
    y += SLIDER_H + 4;

    // Padding row
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

  // ────────────────────────────────────────────────────────────────────────────
  // OUTPUT ZONE — three states
  // ────────────────────────────────────────────────────────────────────────────

  // Reusable bits used inside detail views
  function drawApplyButton(f, PAD, CW, y) {
    const apply = makeRect(f, "Apply", PAD, y, CW, 40, "#1E1E1E");
    apply.cornerRadius = 6;
    const labelW = 88;
    makeText(f, "Apply to Figma", PAD + Math.round((CW - labelW) / 2), y + 13, 12, "Medium", "#FFFFFF");
    return y + 48;
  }

  function drawZoneHeader(f, PAD, CW, y, state) {
    // state: 'default' | 'swatches' | 'variables'
    if (state === "default") {
      makeSectionLabel(f, "APPLY TO FIGMA", PAD, y); y += 12;
      makeDivider(f, PAD, y, CW); y += 8;
      return y;
    }
    // Breadcrumb header for detail states. The 'Apply' segment is the back link.
    const isSw = state === "swatches";
    makeText(f, "‹", PAD, y - 2, 12, "Medium", "#2563EB");
    makeText(f, "APPLY",              PAD + 12, y, 9, "Medium", "#2563EB");
    makeText(f, "▸",                  PAD + 50, y, 9, "Medium", "#999999");
    makeText(f,
      isSw ? "CANVAS SWATCHES" : "COLOUR VARIABLES",
      PAD + 60, y, 9, "Medium", "#1E1E1E");
    y += 12;
    makeDivider(f, PAD, y, CW); y += 8;
    return y;
  }

  // ── DEFAULT state ─────────────────────────────────────────────────────────
  function drawDefault(f, PAD, CW, y) {
    y = drawZoneHeader(f, PAD, CW, y, "default");

    const OUT_W = Math.floor((CW - 8) / 2);

    // Each card carries an inline "Configure ›" link when its toggle is on.
    // We show both ON here so both Configure links are visible.
    function outputCard(label, sub, x) {
      const t = makeRect(f, label + " output", x, y, OUT_W, 62, "#1E1E1E");
      t.strokes = solid("#1E1E1E"); t.strokeWeight = 1; t.cornerRadius = 6;
      makeText(f, label, x + 10, y + 6, 11, "Medium", "#FFFFFF");
      const subT = makeText(f, sub, x + 10, y + 22, 9, "Regular", "#FFFFFF");
      subT.fills = solidA("#FFFFFF", 0.7);
      // Configure link, bottom-aligned
      makeText(f, "Configure ›", x + 10, y + 42, 10, "Medium", "#93C5FD");
      // Toggle indicator, top-right
      const dot = makeRect(f, label + " on indicator", x + OUT_W - 18, y + 8, 8, 8, "#10B981");
      dot.cornerRadius = 4;
    }

    outputCard("Canvas swatches",  "Place on page",         PAD);
    outputCard("Colour variables", "Write to collection",   PAD + OUT_W + 8);
    y += 70;

    return drawApplyButton(f, PAD, CW, y);
  }

  // ── SWATCHES DETAIL ───────────────────────────────────────────────────────
  function drawSwatchesDetail(f, PAD, CW, y) {
    y = drawZoneHeader(f, PAD, CW, y, "swatches");

    // Layout direction segmented
    makeText(f, "Layout", PAD, y + 6, 10, "Regular", "#333333");
    drawSegmented(f, PAD + 56, y, CW - 56, ["Horizontal", "Vertical"], 0);
    y += 30;

    // Shape segmented
    makeText(f, "Shape", PAD, y + 6, 10, "Regular", "#333333");
    drawSegmented(f, PAD + 56, y, CW - 56, ["Square", "Round"], 0);
    y += 30;

    // Step labels toggle
    drawToggleRow(f, PAD, CW, y, "Step labels", true);
    y += 26;

    // A11y badges toggle
    drawToggleRow(f, PAD, CW, y, "A11y badges", false);
    y += 32;

    // PREVIEW
    makeSectionLabel(f, "PREVIEW", PAD, y); y += 12;
    makeDivider(f, PAD, y, CW); y += 8;

    // Horizontal row of mini swatches (matches layout direction = Horizontal)
    const PV_GAP = 4;
    const PV_W   = Math.floor((CW - PV_GAP * 9) / 10);
    const PV_H   = 32;
    for (let i = 0; i < 10; i++) {
      const sx = PAD + i * (PV_W + PV_GAP);
      const sw = makeRect(f, `Preview ${STEPS[i]}`, sx, y, PV_W, PV_H, BRAND_LIGHT[i]);
      sw.cornerRadius = 2;
      // Step labels enabled → render under each swatch
      makeText(f, STEPS[i], sx + 1, y + PV_H + 3, 7, "Regular", "#666666");
    }
    y += PV_H + 18;

    return drawApplyButton(f, PAD, CW, y);
  }

  // ── VARIABLES DETAIL ──────────────────────────────────────────────────────
  function drawVariablesDetail(f, PAD, CW, y) {
    y = drawZoneHeader(f, PAD, CW, y, "variables");

    // Collection
    makeText(f, "Collection", PAD, y, 9, "Regular", "#999999"); y += 12;
    const coll = makeRect(f, "Collection dropdown", PAD, y, CW, 32, "#FFFFFF");
    coll.strokes = solid("#D0D0D0"); coll.strokeWeight = 1; coll.cornerRadius = 5;
    makeText(f, "Brand · Neutral", PAD + 10, y + 10, 11, "Medium", "#1E1E1E");
    makeText(f, "▾",               PAD + CW - 16, y + 10, 10, "Regular", "#888888");
    y += 40;

    // Naming
    makeText(f, "Naming", PAD, y, 9, "Regular", "#999999"); y += 12;
    drawSegmented(f, PAD, y, CW, ["brand-500", "brand/500", "Brand 500"], 0);
    y += 30;

    // Modes
    makeText(f, "Modes", PAD, y, 9, "Regular", "#999999"); y += 12;
    drawSegmented(f, PAD, y, CW, ["Light + Dark", "Light only", "Dark only"], 0);
    y += 38;

    // PREVIEW
    makeSectionLabel(f, "PREVIEW · 40 variables", PAD, y); y += 12;
    makeDivider(f, PAD, y, CW); y += 8;

    const previewLines = [
      "brand-50  brand-100  brand-200  …  brand-900",
      "neutral-50  neutral-100  neutral-200  …  neutral-900",
      "Bound to light + dark modes within the collection.",
    ];
    for (const line of previewLines) {
      makeText(f, line, PAD, y, 10, "Regular", "#444444");
      y += 16;
    }
    y += 4;

    return drawApplyButton(f, PAD, CW, y);
  }

  // ── Generic widgets ───────────────────────────────────────────────────────
  function drawSegmented(f, x, y, w, labels, activeIdx) {
    const segW = Math.floor(w / labels.length);
    // Background pill
    const bg = makeRect(f, "Segmented bg", x, y, segW * labels.length, 24, "#E0E0E0");
    bg.cornerRadius = 4;
    // Active segment
    const ax = x + segW * activeIdx;
    const active = makeRect(f, "Segmented active", ax, y, segW, 24, "#1E1E1E");
    active.cornerRadius = 4;
    // Labels
    for (let i = 0; i < labels.length; i++) {
      const lx = x + segW * i;
      // Crude centring — font width estimate
      const labelLen = labels[i].length;
      const lw = labelLen * 5;
      const isActive = i === activeIdx;
      makeText(f, labels[i],
        lx + Math.round((segW - lw) / 2),
        y + 7,
        9,
        isActive ? "Medium" : "Regular",
        isActive ? "#FFFFFF" : "#555555");
    }
  }

  function drawToggleRow(f, PAD, CW, y, label, on) {
    makeText(f, label, PAD, y + 4, 11, "Regular", "#333333");
    const tX  = PAD + CW - 32;
    const tBg = makeRect(f, label + " toggle", tX, y, 32, 18, on ? "#1E1E1E" : "#D0D0D0");
    tBg.cornerRadius = 9;
    const knobX = on ? tX + 16 : tX + 2;
    const knob  = makeRect(f, label + " knob", knobX, y + 2, 14, 14, "#FFFFFF");
    knob.cornerRadius = 7;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────

  const W = 480;
  const GAP = 48;

  // We don't know the final height until the output zone is rendered. Render
  // each frame with a generous initial height, then trim to fit.
  function renderFrame(originX, name, drawZone) {
    const f = makeFrame(name, originX, 0, W, 2000, "#F4F4F5");
    const { y, PAD, CW } = renderSharedTop(f, W);
    const finalY = drawZone(f, PAD, CW, y);
    f.resize(W, finalY + PAD);
    return f;
  }

  const frames = [
    renderFrame(0,                  "v1 — Output default (480px)",      drawDefault),
    renderFrame(W + GAP,            "v1 — Output: Canvas swatches",     drawSwatchesDetail),
    renderFrame((W + GAP) * 2,      "v1 — Output: Colour variables",    drawVariablesDetail),
  ];

  // Captions above each frame
  const caps = [
    "Default — toggles + Configure ▸ + Apply",
    "Detail — Canvas swatches (layout / shape / labels / badges / preview)",
    "Detail — Colour variables (collection / naming / modes / preview)",
  ];
  for (let i = 0; i < caps.length; i++) {
    const cap = figma.createText();
    cap.fontName = { family: "Inter", style: "Regular" };
    cap.fontSize = 11;
    cap.fills = solid("#666666");
    cap.characters = caps[i];
    cap.x = (W + GAP) * i;
    cap.y = -28;
    page.appendChild(cap);
  }

  // Annotation below
  const maxH = Math.max(...frames.map((f) => f.height));
  const anno = figma.createText();
  anno.fontName = { family: "Inter", style: "Regular" };
  anno.fontSize = 11;
  anno.fills = solid("#888888");
  anno.characters =
    "Output zone is the only stateful area. Top half is identical across all three frames — only the bottom (output zone) changes. " +
    "Clicking 'Configure ›' on a default-state output card swaps the zone into its detail view; the breadcrumb ‹ on the detail header returns to default.";
  anno.x = 0;
  anno.y = maxH + 20;
  page.appendChild(anno);

  figma.viewport.scrollAndZoomIntoView(frames);
  console.log('✓ Created page "' + page.name + '" with ' + frames.length + ' frames.');

})().catch((err) => console.error("Wireframe error:", err.message));
