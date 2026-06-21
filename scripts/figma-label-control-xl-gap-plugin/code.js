/*
 * Throwaway sync dev plugin — adds the one missing Context variable
 * `label-control/xl/gap` so Figma (the upstream source of truth) matches the
 * DTCG that already ships it. The other label-control slots (xs–lg) already
 * carry a `gap`; only the xl slot's gap was absent. Mutates the Figma file.
 * Idempotent: re-running re-sets the same four mode aliases (and reuses the
 * variable if it already exists). Run from the plugin sandbox: Plugins →
 * Development → Import plugin from manifest… → pick this folder's manifest.json
 * → Plugins → Development → Primitiv label-control xl gap.
 *
 * Mode aliases (control↔label gap, per density), matching
 * packages/tokens/src/context.json:
 *   - Dense       -> space/space-4
 *   - Compact     -> space/space-6
 *   - Comfortable -> space/space-8
 *   - Spacious    -> space/space-12
 *
 * The new variable mirrors an existing sibling gap (`label-control/lg/gap`):
 * same FLOAT type and scopes, so a later Figma → DTCG sync re-exports it
 * exactly like the other gaps.
 */
(async () => {
  const log = [];
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const ctx = collections.find((c) => c.name === "Context");
  if (!ctx) {
    return show("No 'Context' collection. Found: " + collections.map((c) => c.name).join(", "));
  }
  const modeId = {};
  ctx.modes.forEach((m) => (modeId[m.name] = m.modeId));

  const vars = await figma.variables.getLocalVariablesAsync();
  const byName = {};
  vars.forEach((v) => (byName[v.name] = v));

  const TARGET = "label-control/xl/gap";
  // Per-density gap value (the space primitive each mode aliases to).
  const valueByMode = {
    Dense: "space/space-4",
    Compact: "space/space-6",
    Comfortable: "space/space-8",
    Spacious: "space/space-12",
  };

  // Find-or-create the variable, mirroring an existing sibling gap's shape.
  let v = byName[TARGET];
  if (v && v.variableCollectionId !== ctx.id) {
    return show("SKIP: '" + TARGET + "' exists outside the Context collection.");
  }
  if (!v) {
    v = figma.variables.createVariable(TARGET, ctx, "FLOAT");
    const sibling = byName["label-control/lg/gap"];
    if (sibling && sibling.scopes) v.scopes = sibling.scopes;
    log.push("CREATE  " + TARGET + (sibling ? "  (scopes copied from label-control/lg/gap)" : ""));
  } else {
    log.push("REUSE   " + TARGET);
  }

  for (const modeName of Object.keys(valueByMode)) {
    const mid = modeId[modeName];
    if (!mid) {
      log.push("SKIP (no mode '" + modeName + "')");
      continue;
    }
    const target = byName[valueByMode[modeName]];
    if (!target) {
      log.push("SKIP (primitive not found): " + valueByMode[modeName]);
      continue;
    }
    v.setValueForMode(mid, figma.variables.createVariableAlias(target));
    log.push("OK  " + TARGET + "  [" + modeName + "]  ->  " + valueByMode[modeName]);
  }

  const okCount = log.filter((l) => l.startsWith("OK")).length;
  show("Set " + okCount + " mode-values on " + TARGET + ".\n\n" + log.join("\n"));

  function show(text) {
    const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    figma.showUI(
      `<textarea readonly style="position:fixed;inset:0;width:100%;height:100%;box-sizing:border-box;margin:0;border:0;padding:8px;font:12px/1.4 monospace">${esc}</textarea>`,
      { width: 560, height: 480, title: "Primitiv label-control xl gap" },
    );
  }
})().catch((e) => {
  figma.showUI(`<pre style="margin:0;padding:8px;font:12px monospace;color:#c00">${e.message}</pre>`, {
    width: 480,
    height: 160,
  });
});
