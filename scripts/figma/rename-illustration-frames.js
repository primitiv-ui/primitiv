/**
 * Rename the 40 content-illustration frames to their export filenames — and
 * put the descriptive names back afterwards.
 *
 * Run through the Desktop Bridge (`figma_execute`) against the page
 * "Docs Site — Content illustrations". Paste the body of `apply()` or
 * `restore()` depending on which direction you want.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 * Figma names an exported file after its LAYER, and there is no prefix or
 * rename field in the export dialog — only a suffix. So the only way to get
 * forty files out of Figma already named `start-01-desktop-light.png` is for
 * the frame to be called `start-01-desktop-light`. The alternative is exporting
 * `START-01 — desktop light.png` and renaming forty files by hand, which is
 * forty chances to put a light twin where a dark one goes; the site renders a
 * mismatched pair perfectly happily, so nothing downstream would catch it.
 *
 * Pixels cannot leave this sandbox — `www.figma.com` answers 403 at CONNECT
 * under the network policy, so `get_screenshot` / `download_assets` are both
 * walled (docs-site-content-plan.md §6.0.19). Scripting the canvas works.
 * So the division of labour is: this script prepares the canvas, a human
 * clicks Export.
 *
 * ── WHAT `apply()` DOES ───────────────────────────────────────────────────
 * 1. Renames each frame to `<id>-<desktop|mobile>-<light|dark>`, the exact
 *    name `apps/docs-site/scripts/gen-illustrations.mjs` expects (asserted —
 *    its own `IDS` × breakpoints × themes cross-check came back 40/40, no
 *    missing, no extra).
 * 2. Puts `PNG @2x, no suffix` export settings on all forty, so the export
 *    panel is pre-filled and the scale is not chosen forty times. Scale is
 *    free to be anything — the site measures each PNG's IHDR and uses only the
 *    aspect — but 2x is right for a HiDPI screen.
 * 3. Selects all forty and activates the page, so the panel reads
 *    "Export 40 layers" the moment the human looks at it. Deliberately a
 *    selection rather than file-wide export settings: the page also holds two
 *    strays (the source screenshot RECTANGLE and a loose `body/xs` TEXT) that
 *    must not be exported.
 *
 * IDEMPOTENT. `target()` accepts either the descriptive name or an
 * already-applied export name, so a second run changes nothing. That is not a
 * nicety: the first attempt at this threw on `figma.currentPage = page`
 * (dynamic-page access needs `setCurrentPageAsync`) AFTER the renames had
 * already applied — the partial-apply hazard in CLAUDE.md gotcha 5 — and a
 * non-idempotent retry would have matched nothing and reported zero.
 *
 * `restore()` reads `illustration-export-names.json` beside this file and
 * matches on **frame id, not name**, so it works whichever direction the names
 * are currently in.
 */

const IDS = [
  'START-01', 'FAMILY-01', 'TOKENS-01', 'DENSITY-C01', 'DENSITY-C02',
  'COMPOSE-01', 'A11Y-C01', 'CLI-01', 'FIGMA-P01', 'FIGMA-P02',
];
const LOWER = IDS.map((i) => i.toLowerCase());
const PAGE = 'Docs Site — Content illustrations';
const SETTINGS = [{ format: 'PNG', suffix: '', constraint: { type: 'SCALE', value: 2 } }];

const target = (name) => {
  const orig = /^(.+?) — (desktop|mobile)( light)?$/.exec(name);
  if (orig && IDS.includes(orig[1])) {
    return `${orig[1].toLowerCase()}-${orig[2]}-${orig[3] ? 'light' : 'dark'}`;
  }
  const applied = /^(.+?)-(desktop|mobile)-(light|dark)$/.exec(name);
  if (applied && LOWER.includes(applied[1])) return name;
  return null;
};

async function apply() {
  const page = figma.root.children.find((p) => p.name === PAGE);
  await page.loadAsync();

  const ids = [];
  for (const c of page.children) {
    if (c.type !== 'FRAME') continue;
    const t = target(c.name);
    if (!t) continue;
    if (c.name !== t) c.name = t;
    c.exportSettings = SETTINGS;
    ids.push(c.id);
  }

  await figma.setCurrentPageAsync(page);
  page.selection = ids.map((id) => page.findOne((n) => n.id === id)).filter(Boolean);

  /* Read back rather than trust the writes — CLAUDE.md's "never report a write
     you have not read back", which TOKENS-01's light twin earned the hard way. */
  const frames = page.children.filter((c) => c.type === 'FRAME');
  return {
    prepared: ids.length,
    selected: page.selection.length,
    badSettings: frames
      .filter((c) => {
        const s = (c.exportSettings || [])[0];
        return !s || s.format !== 'PNG' || s.suffix !== '' || !s.constraint || s.constraint.value !== 2;
      })
      .map((c) => c.name),
    names: frames.map((c) => c.name).sort(),
  };
}

/** Put the descriptive names back. Matches on id, so direction does not matter. */
async function restore(frames /* the `frames` array from illustration-export-names.json */) {
  const page = figma.root.children.find((p) => p.name === PAGE);
  await page.loadAsync();

  const restored = [];
  const notFound = [];
  for (const f of frames) {
    const node = await figma.getNodeByIdAsync(f.id);
    if (!node) { notFound.push(f.id); continue; }
    node.name = f.from;
    restored.push(f.from);
  }
  return { restored: restored.length, notFound };
}
