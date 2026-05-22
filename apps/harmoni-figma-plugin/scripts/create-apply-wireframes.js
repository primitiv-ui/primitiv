/**
 * Harmoni Plugin — Apply to Figma Wireframe Generator
 *
 * Adds two screens to the existing "Wireframes — Harmoni Plugin" page
 * (creates the page if it doesn't exist yet):
 *
 *   Screen 3 — Apply overlay: choose outputs (initial state, nothing selected)
 *   Screen 4 — Apply overlay: Colour variables checked + collection picker open
 *
 * HOW TO RUN
 * ----------
 * 1. Open your Figma file in the desktop app.
 * 2. Plugins → Development → Open console (or ⌘⌥I).
 * 3. Type "allow pasting" and press Enter, then paste this file and press Enter.
 *
 * Run after create-wireframes.js (Screens 1 & 2), or on its own.
 */

(async function createApplyWireframes() {

  // ─── Fonts ────────────────────────────────────────────────────────────────
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  // ─── Page — find existing or create ──────────────────────────────────────
  let page = figma.root.children.find(p => p.name === "Wireframes — Harmoni Plugin");
  if (!page) {
    page = figma.createPage();
    page.name = "Wireframes — Harmoni Plugin";
  }
  figma.currentPage = page;

  // ─── Helpers ──────────────────────────────────────────────────────────────
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

  function makeFrame(name, x, y, w, h, bg = "#FFFFFF") {
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
      makeText(parent, title, 16, 15, 14, "Medium", "#FFFFFF");
    }
    const closeBox = makeRect(parent, "Close", W - PAD - 22, 13, 22, 22, solidA("#FFFFFF", 0.12));
    closeBox.cornerRadius = 4;
    makeText(parent, "×", W - PAD - 16, 15, 12, "Regular", "#FFFFFF");
  }

  // ─── Layout constants ─────────────────────────────────────────────────────
  const W      = 360;
  const H      = 620;
  const PAD    = 16;
  const CW     = W - PAD * 2;   // 328px
  const HDR_H  = 48;
  const GAP    = 48;             // gap between frames

  // Place Screens 3 & 4 to the right of the first two (at x=816 and x=1224)
  const X3 = (W + GAP) * 2;
  const X4 = (W + GAP) * 3;

  // ─── Shared: option card ──────────────────────────────────────────────────
  // Renders a checkbox-style option card. checked=true gives a filled checkbox
  // and a slightly highlighted card border.
  function makeOptionCard(parent, y, label, description, checked) {
    const CARD_H = 64;

    const card = makeRect(parent, label + " card", PAD, y, CW, CARD_H, "#FFFFFF");
    card.strokes = solid(checked ? "#1E1E1E" : "#E0E0E0");
    card.strokeWeight = checked ? 1.5 : 1;
    card.cornerRadius = 8;

    // Checkbox
    const cb = makeRect(parent, "Checkbox", PAD + 12, y + 22, 20, 20, checked ? "#1E1E1E" : "#FFFFFF");
    cb.strokes = solid(checked ? "#1E1E1E" : "#BBBBBB");
    cb.strokeWeight = 1.5;
    cb.cornerRadius = 4;
    if (checked) {
      makeText(parent, "✓", PAD + 16, y + 23, 11, "Bold", "#FFFFFF");
    }

    makeText(parent, label,       PAD + 44, y + 12, 13, "Medium",  "#1E1E1E");
    makeText(parent, description, PAD + 44, y + 31, 11, "Regular", "#888888");

    return CARD_H;
  }

  // ─── Shared: footer ───────────────────────────────────────────────────────
  function makeFooter(parent, applyEnabled) {
    const FOOTER_Y = H - 64;
    makeDivider(parent, 0, FOOTER_Y, W);

    const BTN_Y = FOOTER_Y + 12;
    const BTN_H = 40;
    const BTN_W = (CW - 8) / 2;   // ~160px each, 8px gap between

    // Cancel
    const cancelBtn = makeRect(parent, "Cancel", PAD, BTN_Y, BTN_W, BTN_H, "#FFFFFF");
    cancelBtn.strokes = solid("#D0D0D0");
    cancelBtn.strokeWeight = 1;
    cancelBtn.cornerRadius = 6;
    makeText(parent, "Cancel", PAD + 51, BTN_Y + 12, 13, "Medium", "#333333");

    // Apply
    const applyX   = PAD + BTN_W + 8;
    const applyFill = applyEnabled ? "#1E1E1E" : "#BBBBBB";
    const applyBtn  = makeRect(parent, "Apply", applyX, BTN_Y, BTN_W, BTN_H, applyFill);
    applyBtn.cornerRadius = 6;
    makeText(parent, "Apply", applyX + 57, BTN_Y + 12, 13, "Medium", "#FFFFFF");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 3 — Apply overlay: initial state (nothing selected)
  // ═══════════════════════════════════════════════════════════════════════════
  const s3 = makeFrame("Screen 3 — Apply (choose outputs)", X3, 0, W, H, "#F2F2F2");
  makeHeader(s3, "Apply to Figma", true);

  let y = HDR_H + 16;

  makeSectionLabel(s3, "GENERATE", PAD, y);
  y += 18;
  makeDivider(s3, PAD, y, CW);
  y += 12;

  makeOptionCard(s3, y, "Canvas swatches",  "Place swatch frames on the active Figma page", false);
  y += 72;

  makeOptionCard(s3, y, "Colour variables", "Write variables to a chosen collection", false);
  y += 72;

  makeText(s3, "Select at least one output to continue.", PAD, y + 4, 11, "Regular", "#AAAAAA");

  makeFooter(s3, false);

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 4 — Apply overlay: Colour variables checked + collection picker open
  // ═══════════════════════════════════════════════════════════════════════════
  const s4 = makeFrame("Screen 4 — Apply (variables + collection)", X4, 0, W, H, "#F2F2F2");
  makeHeader(s4, "Apply to Figma", true);

  y = HDR_H + 16;

  makeSectionLabel(s4, "GENERATE", PAD, y);
  y += 18;
  makeDivider(s4, PAD, y, CW);
  y += 12;

  makeOptionCard(s4, y, "Canvas swatches",  "Place swatch frames on the active Figma page", false);
  y += 72;

  makeOptionCard(s4, y, "Colour variables", "Write variables to a chosen collection", true);
  y += 76;

  // ── Variable collection picker ────────────────────────────────────────────
  makeSectionLabel(s4, "VARIABLE COLLECTION", PAD, y);
  y += 18;
  makeDivider(s4, PAD, y, CW);
  y += 8;

  // Tree rows — simplified representation of the Tree component
  // Each row: expand indicator + label. Selected row gets a highlight bg.
  const ROW_H = 36;

  const TREE_ITEMS = [
    { label: "▶   Brand",     indent: 0, selected: false },
    { label: "●   Neutral",   indent: 0, selected: true  },
    { label: "▶   Dark mode", indent: 0, selected: false },
  ];

  for (const item of TREE_ITEMS) {
    if (item.selected) {
      const highlight = makeRect(s4, "Selected row bg", 0, y, W, ROW_H, "#E8E8E8");
    }

    const textStyle  = item.selected ? "Medium"  : "Regular";
    const textColour = item.selected ? "#1E1E1E" : "#444444";
    const indentPx   = PAD + 12 + item.indent * 20;

    makeText(s4, item.label, indentPx, y + 10, 13, textStyle, textColour);

    if (item.selected) {
      // Selected indicator on right edge
      makeRect(s4, "Selection indicator", W - 8, y + 10, 4, 16, "#1E1E1E");
    }

    y += ROW_H;
  }

  y += 8;
  makeText(s4, "+ New collection", PAD + 12, y, 12, "Medium", "#555555");

  makeFooter(s4, true);

  // ─── Zoom to the two new screens ──────────────────────────────────────────
  figma.viewport.scrollAndZoomIntoView([s3, s4]);

  console.log('✓ Apply wireframes created (Screens 3 & 4) on page "' + page.name + '".');

})().catch(err => console.error("Wireframe error:", err.message));
