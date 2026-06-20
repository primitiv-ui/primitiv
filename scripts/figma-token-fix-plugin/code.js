/*
 * Throwaway fix-it dev plugin — rebinds the raw-number Context variables that
 * caused the unitless-emit bug to their proper primitive aliases. Mutates the
 * Figma file. Idempotent (re-running re-sets the same aliases). Run from the
 * plugin sandbox: Plugins → Development → Import plugin from manifest… → pick
 * this folder's manifest.json → Plugins → Development → Primitiv Token Fix.
 *
 * Scope (agreed: checkbox + radio):
 *   - checkbox/xl/box-size   [Spacious] → size/size-32   (single-cell slip)
 *   - checkbox/xs/mark-size  [Dense]    → size/size-6     (single-cell slip)
 *   - radio/{xs,sm,md,lg,xl}/{box-radius, focus-ring-gap-radius, focus-ring-radius}
 *       -> radii/full (a circle), all 4 modes
 *   - radio dot-size is left raw on purpose: it is box-size/2, and there is no
 *     size-5 / size-7 primitive to bind to (the registry stylesheet derives it).
 *
 * After running, re-run the audit plugin: rawNumberVariables should no longer
 * list any checkbox or radio box-radius / focus-ring radii; only the radio
 * dot-size values and the modal anatomy should remain.
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
  const allModes = ctx.modes.map((m) => m.name);

  const vars = await figma.variables.getLocalVariablesAsync();
  const byName = {};
  vars.forEach((v) => (byName[v.name] = v));

  const rebind = (varName, modeName, targetName) => {
    const v = byName[varName];
    if (!v) return log.push("SKIP (var not found): " + varName);
    if (v.variableCollectionId !== ctx.id) return log.push("SKIP (not in Context): " + varName);
    const target = byName[targetName];
    if (!target) return log.push("SKIP (primitive not found): " + targetName);
    const mid = modeId[modeName];
    if (!mid) return log.push("SKIP (no mode '" + modeName + "'): " + varName);
    v.setValueForMode(mid, figma.variables.createVariableAlias(target));
    log.push("OK  " + varName + "  [" + modeName + "]  ->  " + targetName);
  };

  // 1) Checkbox single-cell slips.
  rebind("checkbox/xl/box-size", "Spacious", "size/size-32");
  rebind("checkbox/xs/mark-size", "Dense", "size/size-6");

  // 2) Radio box + focus-ring radii -> radii/full (circle), every size, every mode.
  const sizes = ["xs", "sm", "md", "lg", "xl"];
  const radiusProps = ["box-radius", "focus-ring-gap-radius", "focus-ring-radius"];
  for (const s of sizes)
    for (const p of radiusProps)
      for (const m of allModes) rebind("radio/" + s + "/" + p, m, "radii/full");

  const okCount = log.filter((l) => l.startsWith("OK")).length;
  show("Rebound " + okCount + " mode-values.\n\n" + log.join("\n"));

  function show(text) {
    const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    figma.showUI(
      `<textarea readonly style="position:fixed;inset:0;width:100%;height:100%;box-sizing:border-box;margin:0;border:0;padding:8px;font:12px/1.4 monospace">${esc}</textarea>`,
      { width: 560, height: 680, title: "Primitiv token fix" },
    );
  }
})().catch((e) => {
  figma.showUI(`<pre style="margin:0;padding:8px;font:12px monospace;color:#c00">${e.message}</pre>`, {
    width: 480,
    height: 160,
  });
});
