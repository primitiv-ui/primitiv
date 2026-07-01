/*
 * Redesign Explorations — ToggleGroup · Tabs · Accordion
 * =====================================================
 * A pastable Figma dev-console script (Plugin API). It builds a new page with
 * three BOLD redesign prototypes that deliberately break from the current
 * welded button-group / enclosed-strip look:
 *
 *   1. ToggleGroup → inset track + floating thumb   (iOS / Arc segmented control)
 *   2. Tabs        → sliding ink-bar underline       (Linear / Vercel / Stripe)
 *   3. Accordion   → hairline rows, no boxes         (Apple / Notion minimal)
 *
 * All colours, the elevation shadow, radii and the framed-control sizing bind to
 * the file's REAL variables / effect styles by name — so the specimens respond
 * to theme + density like the shipping components. Where a token name isn't
 * found the script falls back to a sensible literal so it always runs.
 *
 * HOW TO RUN
 *   1. Figma desktop app → Plugins → Development → Open console (⌘⌥I / Ctrl+Alt+I).
 *   2. Click in the console, type `allow pasting`, press Enter.
 *   3. Paste this whole file, press Enter. A new page is created and focused.
 *
 * Nothing existing is touched — it only adds one page. Delete the page to redo.
 */
(async function () {
  // ---------------------------------------------------------------- load pages
  // Dynamic-page API: pages/nodes on other pages aren't reachable until loaded.
  // Without this, the getNodeByIdAsync() label-font read below returns null.
  if (typeof figma.loadAllPagesAsync === 'function') { try { await figma.loadAllPagesAsync(); } catch (e) {} }

  // ---------------------------------------------------------------- resolve vars
  const allVars = await figma.variables.getLocalVariablesAsync();
  const V = {};
  for (const v of allVars) if (!(v.name in V)) V[v.name] = v; // first match per name

  const colCache = {};
  async function col(id) { return colCache[id] || (colCache[id] = await figma.variables.getVariableCollectionByIdAsync(id)); }
  // resolve a variable's numeric value, following aliases through default modes
  async function num(name, fallback) {
    let v = V[name]; if (!v) return fallback;
    for (let i = 0; i < 8; i++) {
      const c = await col(v.variableCollectionId);
      let val = v.valuesByMode[c.defaultModeId];
      if (val && typeof val === 'object' && val.type === 'VARIABLE_ALIAS') { v = await figma.variables.getVariableByIdAsync(val.id); continue; }
      return typeof val === 'number' ? val : fallback;
    }
    return fallback;
  }

  // resolved sizing numbers (token-derived, with fallbacks)
  const H      = await num('framed-control/md/height', 40);
  const PADX   = await num('framed-control/md/padding-inline', 14);
  const GAP    = await num('framed-control/md/gap', 8);
  const RADMD  = await num('framed-control/md/radius', 8);
  const RFULL  = await num('radii/full', 999);

  // ---------------------------------------------------------------- fonts
  let LABEL = { family: 'Inter', style: 'Medium' }, LSIZE = 14, LLH = null;
  try {
    const tg = await figma.getNodeByIdAsync('389:3372');
    const t = tg && tg.findOne(n => n.type === 'TEXT' && n.name === 'Label');
    if (t) { const f = t.getRangeFontName(0, 1); if (f && f.family) { LABEL = f; LSIZE = t.fontSize || 14; const lh = t.lineHeight; if (lh && lh.unit === 'PIXELS') LLH = lh.value; } }
  } catch (e) {}
  async function canLoad(f) { try { await figma.loadFontAsync(f); return true; } catch (e) { return false; } }
  if (!(await canLoad(LABEL))) { LABEL = { family: 'Inter', style: 'Medium' }; await canLoad(LABEL); }
  let BODY = { family: 'Inter', style: 'Regular' };
  for (const c of [{ family: 'Asta Sans', style: 'Regular' }, { family: LABEL.family, style: 'Regular' }, { family: 'Inter', style: 'Regular' }]) { if (await canLoad(c)) { BODY = c; break; } }
  const TITLE = (await canLoad({ family: LABEL.family, style: 'SemiBold' })) ? { family: LABEL.family, style: 'SemiBold' }
              : (await canLoad({ family: LABEL.family, style: 'Bold' })) ? { family: LABEL.family, style: 'Bold' } : LABEL;

  // ---------------------------------------------------------------- colour fallbacks (0..1)
  const FB = {
    'surface/default': { r: 1, g: 1, b: 1 },
    'color/neutral/100': { r: 0.93, g: 0.93, b: 0.94 },
    'color/neutral/200': { r: 0.88, g: 0.88, b: 0.90 },
    'content/primary': { r: 0.09, g: 0.09, b: 0.11 },
    'content/secondary': { r: 0.36, g: 0.36, b: 0.40 },
    'content/muted': { r: 0.55, g: 0.55, b: 0.60 },
    'action/primary/default': { r: 0.137, g: 0.361, b: 0.882 },
    'border/subtle': { r: 0.90, g: 0.90, b: 0.92 },
    'border/default': { r: 0.82, g: 0.82, b: 0.85 },
  };

  // ---------------------------------------------------------------- helpers
  function fill(node, name) {
    const v = V[name];
    if (v) node.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v)];
    else node.fills = [{ type: 'SOLID', color: FB[name] || { r: 0, g: 0, b: 0 } }];
  }
  function strokeCol(node, name) {
    const v = V[name];
    if (v) node.strokes = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v)];
    else node.strokes = [{ type: 'SOLID', color: FB[name] || { r: 0, g: 0, b: 0 } }];
  }
  function bindNum(node, field, name) { const v = V[name]; if (v) { try { node.setBoundVariable(field, v); return true; } catch (e) {} } return false; }
  function af(dir) { const f = figma.createFrame(); f.layoutMode = dir; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO'; f.fills = []; f.clipsContent = false; f.strokes = []; f.strokeWeight = 0; return f; }
  function sizeH(n, m) { try { n.layoutSizingHorizontal = m; } catch (e) {} }
  function sizeV(n, m) { try { n.layoutSizingVertical = m; } catch (e) {} }
  function bindRadius(node, name, literal) { for (const f of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) if (!bindNum(node, f, name)) node[f] = literal; }
  function T(chars, font, size, colorName, opts) {
    opts = opts || {};
    const t = figma.createText(); t.fontName = font; t.characters = chars; t.fontSize = size;
    if (opts.lh) t.lineHeight = { unit: 'PIXELS', value: opts.lh };
    if (opts.ls != null) t.letterSpacing = { unit: 'PERCENT', value: opts.ls };
    if (opts.case) t.textCase = opts.case;
    fill(t, colorName);
    return t;
  }

  // ---------------------------------------------------------------- page + root
  const page = figma.createPage();
  page.name = '▷ Redesign Explorations — ToggleGroup · Tabs · Accordion';
  figma.currentPage = page;

  const root = af('VERTICAL'); root.name = 'Redesign Explorations'; root.itemSpacing = 64; root.paddingTop = root.paddingBottom = root.paddingLeft = root.paddingRight = 0;
  page.appendChild(root); root.x = 160; root.y = 160;

  const head = af('VERTICAL'); head.itemSpacing = 8; root.appendChild(head); sizeH(head, 'HUG');
  const h1 = T('Bold redesigns — breaking from the button-group', TITLE, 28, 'content/primary', { ls: -1 }); head.appendChild(h1);
  const h2 = T('Quiet ground + one moving/accent cue + motion does the work. Real tokens bound. Light theme, md size.', BODY, 15, 'content/secondary', { lh: 22 }); head.appendChild(h2); sizeH(h2, 'FIXED'); h2.resize(720, h2.height); h2.textAutoResize = 'HEIGHT';

  // board = white card with a title + caption, specimens appended after
  function board(titleText, caption) {
    const b = af('VERTICAL'); b.name = titleText; b.itemSpacing = 24; b.paddingTop = b.paddingBottom = 40; b.paddingLeft = b.paddingRight = 44; b.clipsContent = false;
    fill(b, 'surface/default'); bindRadius(b, 'radii/3', 16); root.appendChild(b); sizeH(b, 'HUG');
    const cap = af('VERTICAL'); cap.itemSpacing = 4; b.appendChild(cap); sizeH(cap, 'HUG');
    cap.appendChild(T(titleText, TITLE, 19, 'content/primary', { ls: -0.5 }));
    const csub = T(caption, BODY, 13.5, 'content/muted', { lh: 20 }); cap.appendChild(csub); sizeH(csub, 'FIXED'); csub.resize(560, csub.height); csub.textAutoResize = 'HEIGHT';
    return b;
  }
  function rowLabel(parent, txt) { const l = T(txt, BODY, 11.5, 'content/muted', { case: 'UPPER', ls: 6 }); parent.appendChild(l); return l; }

  // ============================================================ 1) TOGGLE GROUP
  const b1 = board('ToggleGroup — inset track + floating thumb',
    'No segment borders, no dividers, no primary-fill block. A recessed neutral track carries plain labels; the active state is one raised white pill (surface/default + shadow/1) that slides between cells. Multi-select = one pill per pressed cell.');

  async function segControl(labels, activeIdx /* number or array */, width) {
    const active = Array.isArray(activeIdx) ? activeIdx : [activeIdx];
    const track = af('HORIZONTAL'); track.name = 'track'; track.itemSpacing = 4; track.paddingTop = track.paddingBottom = track.paddingLeft = track.paddingRight = 4;
    track.counterAxisAlignItems = 'CENTER'; fill(track, 'color/neutral/100'); bindRadius(track, 'radii/full', RFULL); track.clipsContent = false;
    b1.appendChild(track); sizeH(track, 'FIXED'); track.resize(width, track.height); track.primaryAxisSizingMode = 'FIXED';
    for (let i = 0; i < labels.length; i++) {
      const on = active.includes(i);
      const seg = af('HORIZONTAL'); seg.name = on ? 'segment · on' : 'segment'; seg.primaryAxisAlignItems = 'CENTER'; seg.counterAxisAlignItems = 'CENTER';
      seg.paddingLeft = seg.paddingRight = PADX; if (!bindNum(seg, 'paddingLeft', 'framed-control/md/padding-inline')) seg.paddingLeft = PADX; if (!bindNum(seg, 'paddingRight', 'framed-control/md/padding-inline')) seg.paddingRight = PADX;
      if (on) { fill(seg, 'surface/default'); bindRadius(seg, 'radii/full', RFULL); try { await seg.setEffectStyleIdAsync((await figma.getLocalEffectStylesAsync()).find(e => e.name === 'shadow/1')?.id || ''); } catch (e) {} }
      else { seg.fills = []; }
      const lab = T(labels[i], LABEL, LSIZE, on ? 'content/primary' : 'content/secondary', LLH ? { lh: LLH } : {});
      seg.appendChild(lab);
      track.appendChild(seg); sizeH(seg, 'FILL'); sizeV(seg, 'FIXED'); seg.resize(seg.width, H);
    }
    return track;
  }

  rowLabel(b1, 'Single select · one thumb');
  await segControl(['Day', 'Week', 'Month'], 1, 300);
  rowLabel(b1, 'Multiple select · a pill per pressed cell');
  await segControl(['Bold', 'Italic', 'Underline'], [0, 2], 330);

  // ============================================================ 2) TABS
  const b2 = board('Tabs — sliding ink-bar underline',
    'The enclosure is gone. Plain text labels with air; the active tab carries a 2px accent ink-bar (action/primary) that overlaps a full-width baseline hairline (border/subtle). The panel has no frame — content just flows below.');

  function tabsSpec(labels, activeIdx, width) {
    const wrap = af('VERTICAL'); wrap.name = 'tabs'; wrap.itemSpacing = 20; b2.appendChild(wrap); sizeH(wrap, 'HUG');
    const rowW = af('HORIZONTAL'); rowW.name = 'tablist'; rowW.itemSpacing = 4; rowW.primaryAxisAlignItems = 'MIN'; rowW.counterAxisAlignItems = 'CENTER'; rowW.clipsContent = false;
    strokeCol(rowW, 'border/subtle'); rowW.strokeWeight = 0; rowW.strokeTopWeight = 0; rowW.strokeLeftWeight = 0; rowW.strokeRightWeight = 0; rowW.strokeBottomWeight = 1;
    wrap.appendChild(rowW); sizeH(rowW, 'FIXED'); rowW.resize(width, rowW.height); rowW.primaryAxisSizingMode = 'FIXED';
    const tabs = [];
    for (let i = 0; i < labels.length; i++) {
      const on = i === activeIdx;
      const tab = af('HORIZONTAL'); tab.name = on ? 'tab · active' : 'tab'; tab.primaryAxisAlignItems = 'CENTER'; tab.counterAxisAlignItems = 'CENTER';
      tab.paddingLeft = tab.paddingRight = PADX; tab.paddingTop = 10; tab.paddingBottom = 14;
      tab.appendChild(T(labels[i], LABEL, LSIZE, on ? 'content/primary' : 'content/secondary', LLH ? { lh: LLH } : {}));
      rowW.appendChild(tab); sizeV(tab, 'HUG'); tabs.push(tab);
    }
    // ink bar — absolute, sitting on the baseline under the active tab
    const at = tabs[activeIdx];
    const bar = figma.createRectangle(); bar.name = 'ink-bar'; bar.resize(at.width, 2); fill(bar, 'action/primary/default'); bar.topLeftRadius = bar.topRightRadius = 1;
    rowW.appendChild(bar); bar.layoutPositioning = 'ABSOLUTE'; bar.x = at.x; bar.y = rowW.height - 2; bar.constraints = { horizontal: 'MIN', vertical: 'MAX' };
    // panel — no frame, just flowing body copy
    const panel = T('Panel content flows straight into the page — no border, no seam. The ink-bar and the label weight carry the selection; the baseline rule ties the row together.', BODY, 14, 'content/secondary', { lh: 22 });
    wrap.appendChild(panel); sizeH(panel, 'FIXED'); panel.resize(width, panel.height); panel.textAutoResize = 'HEIGHT';
    return wrap;
  }
  tabsSpec(['Overview', 'Activity', 'Settings', 'Billing'], 1, 520);

  // ============================================================ 3) ACCORDION
  const b3 = board('Accordion — hairline rows, no boxes',
    'No container border, no per-item box, no panel frame. Items are separated by a single hairline (border/subtle); a generous trigger row pairs the label with a chevron that flips open→closed. The open panel is flush, quiet body copy.');

  function chevron(open) {
    const v = figma.createVector(); v.name = 'chevron';
    v.vectorPaths = [{ windingRule: 'NONE', data: open ? 'M 1 6 L 6 1 L 11 6' : 'M 1 1 L 6 6 L 11 1' }];
    strokeCol(v, open ? 'content/primary' : 'content/muted'); v.strokeWeight = 1.5; v.strokeCap = 'ROUND'; v.strokeJoin = 'ROUND'; v.fills = [];
    return v;
  }
  function accItem(container, label, open, body) {
    const item = af('VERTICAL'); item.name = open ? 'item · open' : 'item'; item.itemSpacing = 0;
    strokeCol(item, 'border/subtle'); item.strokeWeight = 0; item.strokeTopWeight = 0; item.strokeLeftWeight = 0; item.strokeRightWeight = 0; item.strokeBottomWeight = 1;
    container.appendChild(item); sizeH(item, 'FILL');
    const trig = af('HORIZONTAL'); trig.name = 'trigger'; trig.primaryAxisAlignItems = 'SPACE_BETWEEN'; trig.counterAxisAlignItems = 'CENTER'; trig.paddingTop = trig.paddingBottom = 18;
    item.appendChild(trig); sizeH(trig, 'FILL');
    trig.appendChild(T(label, LABEL, LSIZE + 1, open ? 'content/primary' : 'content/primary', LLH ? { lh: LLH } : {}));
    trig.appendChild(chevron(open));
    if (open && body) {
      const p = T(body, BODY, 14, 'content/secondary', { lh: 22 }); item.appendChild(p); sizeH(p, 'FILL'); p.textAutoResize = 'HEIGHT'; p.paddingBottom = 0; // spacing via item pad below
      // add breathing room under the open body
      const spacer = figma.createFrame(); spacer.fills = []; spacer.resize(1, 20); item.appendChild(spacer); sizeH(spacer, 'FILL');
    }
    return item;
  }
  const acc = af('VERTICAL'); acc.name = 'accordion'; acc.itemSpacing = 0; b3.appendChild(acc); sizeH(acc, 'FIXED'); acc.resize(520, acc.height); acc.primaryAxisSizingMode = 'AUTO';
  accItem(acc, "What's included", false);
  accItem(acc, 'Billing & plans', true, 'Every plan includes the full component library and unlimited projects. Upgrade or downgrade at any time — changes are prorated to the day, and nothing is locked behind a seat count.');
  accItem(acc, 'Cancellation policy', false);
  accItem(acc, 'Data & privacy', false);

  // ---------------------------------------------------------------- focus
  figma.currentPage = page;
  figma.viewport.scrollAndZoomIntoView([root]);
  console.log('✓ Built redesign explorations on page:', page.name);
  console.log('  label font:', LABEL.family, LABEL.style, '| body font:', BODY.family, BODY.style);
})().catch(err => console.error('✗', err && err.stack ? err.stack : err));
