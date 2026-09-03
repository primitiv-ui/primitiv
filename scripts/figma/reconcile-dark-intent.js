// Reconcile Figma's dark Intent variables with the shipped code (Option B).
//
// THE PROBLEM  Dark frames pin Intent=Dark but leave "Primitives / Palette"
// on Light, so every dark Intent variable could only reach the LIGHT ramp.
// Whoever authored them compensated by inverting the step numbers by eye —
// content/primary aliases neutral/50 to get light ink. It mostly works, but
// it drifts (48 of 80 checkable roles were off) and a few landed on the
// wrong side of the ramp entirely: content/muted rendered at 2.66:1 and
// action/link/foreground/active at 1.06:1. See docs/dark-intent-figma-drift.md.
//
// THE FIX  Stop inverting. Alias the SAME palette step the code aliases,
// and pin Palette=Dark alongside Intent=Dark so that step resolves against
// the dark ramp. Figma then matches the code by construction rather than by
// somebody's eye.
//
// THIS IS A FLAG DAY. Between the two phases a dark frame renders wrong, so
// the script does both or neither. Nothing is written until every lookup has
// resolved.
//
//   node scripts/figma/reconcile-dark-intent.js   <- not runnable directly;
//   paste into the Figma console, or run through the Desktop Bridge.
//
// Set DRY_RUN = true to preview. Undo in Figma is a single version-history
// step, so a bad run is cheap to reverse.
//
// THE ALIAS MAP IS GENERATED, NOT HAND-PICKED. Regenerate it from the source
// of truth with:
//
//   python3 - <<'EOF'
//   import json
//   i=json.load(open('packages/tokens/src/intent.json'))
//   def flat(d,pre=''):
//       o={}
//       for k,v in d.items():
//           if k.startswith('$'): continue
//           p=f"{pre}/{k}" if pre else k
//           if isinstance(v,dict) and '$value' in v: o[p]=v['$value']
//           elif isinstance(v,dict): o.update(flat(v,p))
//       return o
//   print(json.dumps({k:v.strip('{}').replace('.','/')
//                     for k,v in flat(i['dark']).items() if v.startswith('{')}, indent=2))
//   EOF
//
// AFTERWARDS, three things need doing by hand:
//   1. CLAUDE.md says "never override Palette to Dark as well, or the whole
//      theme double-inverts". That was true of the OLD aliases and is false
//      after this runs. It must change in the same commit or it will mislead.
//   2. color.neutral-alpha-inverse.* becomes redundant — seven aliases move
//      off it here. Retire it once nothing references it.
//   3. `scrim` stays a literal (#00000080) in both the code and Figma. It is
//      the one role with no palette alias, so it is untouched.

const DRY_RUN = true;   // flip to false to write

/** Generated from packages/tokens/src/intent.json — see the header. */
const ALIASES = {
  "action/primary/default": "color/brand/500",
  "action/primary/hover": "color/brand/300",
  "action/primary/active": "color/brand/200",
  "action/primary/disabled": "color/brand/500",
  "action/primary/soft": "color/brand-alpha/300",
  "action/primary/foreground/default": "color/white",
  "action/primary/foreground/disabled": "color/neutral/500",
  "action/primary/border/default": "color/brand/500",
  "action/primary/border/hover": "color/brand/300",
  "action/primary/border/active": "color/brand/200",
  "action/primary/border/disabled": "color/brand/500",
  "action/secondary/default": "color/neutral/100",
  "action/secondary/hover": "color/neutral/200",
  "action/secondary/active": "color/neutral/400",
  "action/secondary/disabled": "color/neutral/50",
  "action/secondary/foreground/default": "color/neutral/900",
  "action/secondary/foreground/disabled": "color/neutral/500",
  "action/secondary/border/default": "color/neutral/200",
  "action/secondary/border/hover": "color/neutral/400",
  "action/secondary/border/active": "color/neutral/500",
  "action/secondary/border/disabled": "color/neutral/100",
  "action/ghost/hover": "color/neutral-alpha/200",
  "action/ghost/active": "color/neutral-alpha/300",
  "action/danger/foreground/default": "color/absolute-white",
  "action/danger/foreground/disabled": "color/neutral/500",
  "action/danger/default": "color/danger/500",
  "action/danger/hover": "color/danger/300",
  "action/danger/active": "color/danger/200",
  "action/danger/disabled": "color/danger/700",
  "action/danger/border/default": "color/danger/500",
  "action/danger/border/hover": "color/danger/300",
  "action/danger/border/active": "color/danger/200",
  "action/danger/border/disabled": "color/danger/700",
  "action/link/foreground/default": "color/brand/600",
  "action/link/foreground/hover": "color/brand/700",
  "action/link/foreground/active": "color/brand/800",
  "action/link/foreground/disabled": "color/brand/600",
  "action/link/foreground/visited": "color/brand/700",
  "feedback/neutral/soft/background": "color/neutral/100",
  "feedback/neutral/soft/foreground": "color/neutral/700",
  "feedback/success/soft/background": "color/success/100",
  "feedback/success/soft/foreground": "color/success/700",
  "feedback/success/soft/border": "color/success/700",
  "feedback/success/soft/hover": "color/success/200",
  "feedback/success/soft/active": "color/success/300",
  "feedback/success/solid/background": "color/success/500",
  "feedback/success/solid/foreground": "color/absolute-black",
  "feedback/warning/soft/background": "color/warning/100",
  "feedback/warning/soft/foreground": "color/warning/700",
  "feedback/warning/soft/border": "color/warning/700",
  "feedback/warning/soft/hover": "color/warning/200",
  "feedback/warning/soft/active": "color/warning/300",
  "feedback/warning/solid/background": "color/warning/500",
  "feedback/warning/solid/foreground": "color/absolute-black",
  "feedback/info/soft/background": "color/info/100",
  "feedback/info/soft/foreground": "color/info/700",
  "feedback/info/soft/border": "color/info/700",
  "feedback/info/soft/hover": "color/info/200",
  "feedback/info/soft/active": "color/info/300",
  "feedback/info/solid/background": "color/info/500",
  "feedback/info/solid/foreground": "color/absolute-black",
  "feedback/danger/soft/background": "color/danger/100",
  "feedback/danger/soft/foreground": "color/danger/700",
  "feedback/danger/soft/border": "color/danger/700",
  "feedback/danger/soft/hover": "color/danger/200",
  "feedback/danger/soft/active": "color/danger/300",
  "feedback/danger/solid/background": "color/danger/500",
  "feedback/danger/solid/foreground": "color/absolute-white",
  "choice-card/selected/background": "color/brand/100",
  "choice-card/selected/border": "color/brand/500",
  "surface/default": "color/black",
  "surface/floating": "color/neutral/100",
  "surface/subtle": "color/neutral/100",
  "surface/raised": "color/neutral/50",
  "surface/overlay": "color/neutral/900",
  "surface/inverse": "color/neutral/800",
  "surface/sunken": "color/neutral/100",
  "surface/selected": "color/neutral/900",
  "content/primary": "color/neutral/900",
  "content/secondary": "color/neutral/700",
  "content/muted": "color/neutral/600",
  "content/disabled": "color/neutral/500",
  "content/inverse": "color/black",
  "content/on-action": "color/absolute-white",
  "content/on-selected": "color/neutral/50",
  "content/error": "color/danger/500",
  "list/marker/foreground": "content/secondary",
  "table/row/stripe": "color/neutral/50",
  "table/row/hover": "color/neutral-alpha/100",
  "table/row/selected": "color/brand/100",
  "tree/row/hover": "color/neutral-alpha/100",
  "tree/row/selected": "color/neutral-alpha/200",
  "miller-columns/row/hover": "color/neutral-alpha/50",
  "miller-columns/row/ancestor": "color/neutral-alpha/100",
  "miller-columns/row/terminal": "color/neutral-alpha/300",
  "highlight/background": "color/brand/100",
  "border/subtle": "color/neutral/200",
  "border/default": "color/neutral/500",
  "border/strong": "color/neutral/600",
  "border/focus": "color/brand/500",
  "border/invalid": "color/danger/500",
  "focus/ring": "color/brand/500"
};


const INTENT_COLLECTION = "VariableCollectionId:346:4407";
const INTENT_DARK_MODE  = "372:1";
const PALETTE_COLLECTION = "VariableCollectionId:345:4376";
const PALETTE_DARK_MODE  = "371:0";

return (async function () {
  if (typeof figma.loadAllPagesAsync === "function") {
    try { await figma.loadAllPagesAsync(); } catch (e) {}
  }

  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const intent = cols.find((c) => c.id === INTENT_COLLECTION);
  const palette = cols.find((c) => c.id === PALETTE_COLLECTION);
  if (!intent || !palette) return { aborted: "Intent or Palette collection not found" };
  if (!palette.modes.some((m) => m.modeId === PALETTE_DARK_MODE)) {
    return { aborted: "Palette has no Dark mode — Option B is not available, use mirror families" };
  }

  // ── resolve every name up front; write nothing until all of them hold ──
  const byName = {};
  for (const c of cols) {
    for (const id of c.variableIds) {
      const v = await figma.variables.getVariableByIdAsync(id);
      if (v) byName[v.name] = v;
    }
  }
  const intentVars = {};
  for (const id of intent.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (v) intentVars[v.name] = v;
  }

  const planned = [], unresolved = [];
  for (const [role, target] of Object.entries(ALIASES)) {
    const rv = intentVars[role], tv = byName[target];
    if (!rv) { unresolved.push({ role, why: "role missing in Figma" }); continue; }
    if (!tv) { unresolved.push({ role, target, why: "target missing in Figma" }); continue; }
    const raw = rv.valuesByMode[INTENT_DARK_MODE];
    let current = null;
    if (raw && raw.type === "VARIABLE_ALIAS") {
      const a = await figma.variables.getVariableByIdAsync(raw.id);
      current = a ? a.name : null;
    }
    if (current !== target) planned.push({ role, from: current, to: target, rv, tv });
  }
  if (unresolved.length) {
    return { aborted: "some names did not resolve; nothing written", unresolved };
  }

  // ── collect the nodes that pin Intent=Dark and lack a Palette pin ──
  // Walk `children` explicitly with guarded reads: a broad findAll dies on
  // stale instance sublayers (root CLAUDE.md, gotcha 12), and an abort here
  // would leave phase 1 applied without phase 2 — the broken half-state.
  const needPin = [];
  let scanned = 0, skipped = 0;
  const visit = (n, page, depth) => {
    if (depth > 12) return;
    let modes;
    try { modes = n.explicitVariableModes || {}; scanned++; }
    catch (e) { skipped++; return; }
    if (modes[INTENT_COLLECTION] === INTENT_DARK_MODE && !modes[PALETTE_COLLECTION]) {
      needPin.push({ node: n, page, name: String(n.name).slice(0, 60) });
    }
    if (n.type === "INSTANCE") return;      // sublayers cannot pin modes
    let kids;
    try { kids = n.children; } catch (e) { skipped++; return; }
    if (kids) for (const c of kids) visit(c, page, depth + 1);
  };
  for (const p of figma.root.children) {
    let kids;
    try { kids = p.children; } catch (e) { continue; }
    for (const n of kids) visit(n, p.name, 0);
  }

  if (DRY_RUN) {
    return {
      dryRun: true,
      wouldChangeAliases: planned.length,
      wouldPinPaletteDark: needPin.length,
      nodesScanned: scanned, nodesSkipped: skipped,
      aliasChanges: planned.map(({ role, from, to }) => ({ role, from, to })),
      pinSample: needPin.slice(0, 15).map((n) => `${n.page} › ${n.name}`),
    };
  }

  // ── PHASE 1 — rewrite the aliases ──
  const aliasDone = [], aliasFailed = [];
  for (const p of planned) {
    try {
      p.rv.setValueForMode(INTENT_DARK_MODE, figma.variables.createVariableAlias(p.tv));
      aliasDone.push({ role: p.role, from: p.from, to: p.to });
    } catch (e) { aliasFailed.push({ role: p.role, why: e.message }); }
  }

  // ── PHASE 2 — pin Palette=Dark wherever Intent=Dark is pinned ──
  const pinDone = [], pinFailed = [];
  for (const t of needPin) {
    try {
      t.node.setExplicitVariableModeForCollection(palette, PALETTE_DARK_MODE);
      pinDone.push(`${t.page} › ${t.name}`);
    } catch (e) { pinFailed.push({ node: t.name, why: e.message }); }
  }

  return {
    dryRun: false,
    aliasesChanged: aliasDone.length, aliasFailed,
    palettePinsAdded: pinDone.length, pinFailed,
    nodesScanned: scanned, nodesSkipped: skipped,
    warning: (aliasFailed.length || pinFailed.length)
      ? "PARTIAL APPLY — the two phases must both complete. Undo in Figma and investigate."
      : null,
  };
})();
