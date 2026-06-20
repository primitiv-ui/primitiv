/*
 * Throwaway fix-it dev plugin for the modal anatomy. The modal variables are
 * raw numbers in the Context collection (not yet aliased), so they would hit the
 * same unitless-emit bug once a modal component ships. This rebinds each raw
 * cell to its matching primitive, computed from the current value:
 *
 *   - <size>/radius                                  -> radii/<value>
 *   - <size>/gap, padding-block, padding-inline      -> space/space-<value>
 *
 * The one off-scale value (modal/lg/gap Spacious = 18, the space scale jumps
 * 16 -> 20) is rounded up to space/space-20; that single change is flagged in
 * the log. Mutates the Figma file. Idempotent: already-aliased cells are skipped.
 *
 * Run from the plugin sandbox: Plugins -> Development -> Import plugin from
 * manifest... -> pick this folder's manifest.json -> Plugins -> Development ->
 * Primitiv Modal Token Fix.
 */
(async () => {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const ctx = collections.find((c) => c.name === "Context");
  if (!ctx) return show("No 'Context' collection. Found: " + collections.map((c) => c.name).join(", "));
  const modeName = {};
  ctx.modes.forEach((m) => (modeName[m.modeId] = m.name));
  const vars = await figma.variables.getLocalVariablesAsync();
  const byName = {};
  vars.forEach((v) => (byName[v.name] = v));

  const SPACE = new Set(["gap", "padding-block", "padding-inline"]);
  const log = [];
  let ok = 0;

  for (const v of vars) {
    if (v.variableCollectionId !== ctx.id) continue;
    const parts = v.name.split("/");
    if (parts[0] !== "modal") continue;
    const prop = parts[parts.length - 1];
    for (const [modeId, val] of Object.entries(v.valuesByMode)) {
      if (typeof val !== "number") continue; // already aliased — leave it
      let targetName;
      let note = "";
      if (prop === "radius") {
        targetName = "radii/" + val;
      } else if (SPACE.has(prop)) {
        const n = val === 18 ? 20 : val;
        if (n !== val) note = "  (rounded " + val + " -> " + n + ")";
        targetName = "space/space-" + n;
      } else {
        log.push("SKIP (unhandled prop): " + v.name);
        continue;
      }
      const target = byName[targetName];
      if (!target) {
        log.push("SKIP (no primitive " + targetName + "): " + v.name + " [" + (modeName[modeId] || modeId) + "] = " + val);
        continue;
      }
      v.setValueForMode(modeId, figma.variables.createVariableAlias(target));
      log.push("OK  " + v.name + "  [" + (modeName[modeId] || modeId) + "]  ->  " + targetName + note);
      ok++;
    }
  }

  log.sort();
  show("Rebound " + ok + " modal mode-values.\n\n" + log.join("\n"));

  function show(text) {
    const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    figma.showUI(
      `<textarea readonly style="position:fixed;inset:0;width:100%;height:100%;box-sizing:border-box;margin:0;border:0;padding:8px;font:12px/1.4 monospace">${esc}</textarea>`,
      { width: 560, height: 680, title: "Primitiv modal token fix" },
    );
  }
})().catch((e) => {
  figma.showUI(`<pre style="margin:0;padding:8px;font:12px monospace;color:#c00">${e.message}</pre>`, {
    width: 480,
    height: 160,
  });
});
