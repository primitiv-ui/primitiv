/*
 * Throwaway diagnostic dev plugin — runs in the Figma plugin sandbox, where the
 * `figma.*` API exists (the bare DevTools console does NOT have `figma`, hence
 * the "Cannot read properties of undefined (reading 'variables')" error).
 *
 * Import via: Plugins → Development → Import plugin from manifest… → pick this
 * folder's manifest.json. Then Plugins → Development → Primitiv Token Audit.
 *
 * It opens a panel with a JSON dump of every `Context` variable that still holds
 * a RAW NUMBER in any density mode (the unitless-emit bug signature), plus a
 * focused checkbox/radio watchlist (alias target vs raw, per mode). Select all
 * in the textarea, copy, and hand it back. Not wired into any build — delete the
 * folder once the audit is done.
 */
(async () => {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const ctx = collections.find((c) => c.name === "Context");
  let out;
  if (!ctx) {
    out = { error: "No 'Context' collection", collectionsFound: collections.map((c) => c.name) };
  } else {
    const modeName = {};
    ctx.modes.forEach((m) => (modeName[m.modeId] = m.name));
    const vars = await figma.variables.getLocalVariablesAsync();
    const byId = {};
    vars.forEach((v) => (byId[v.id] = v.name));
    const ctxVars = vars.filter((v) => v.variableCollectionId === ctx.id);

    const describe = (val) =>
      val && val.type === "VARIABLE_ALIAS" ? { alias: byId[val.id] || val.id } : { raw: val };

    // 1) Every Context variable that holds a RAW NUMBER in any mode (the bug signature).
    const raw = [];
    for (const v of ctxVars) {
      const rawModes = {};
      for (const [modeId, val] of Object.entries(v.valuesByMode))
        if (typeof val === "number") rawModes[modeName[modeId] || modeId] = val;
      if (Object.keys(rawModes).length) raw.push({ name: v.name, rawModes });
    }
    raw.sort((a, b) => a.name.localeCompare(b.name));

    // 2) Focused watchlist — alias target vs raw, per mode.
    const watch = [
      "checkbox/xl/box-size",
      "checkbox/xs/mark-size",
      "radio/md/box-radius",
      "radio/md/dot-size",
      "radio/md/focus-ring-radius",
    ];
    const watchOut = {};
    for (const name of watch) {
      const v = ctxVars.find((x) => x.name === name);
      if (!v) {
        watchOut[name] = "NOT FOUND";
        continue;
      }
      watchOut[name] = {};
      for (const [modeId, val] of Object.entries(v.valuesByMode))
        watchOut[name][modeName[modeId] || modeId] = describe(val);
    }

    out = {
      contextCollection: ctx.name,
      modes: ctx.modes.map((m) => m.name),
      totalContextVariables: ctxVars.length,
      rawNumberVariables: raw,
      watchlist: watchOut,
    };
  }

  const json = JSON.stringify(out, null, 2);
  const esc = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  figma.showUI(
    `<textarea readonly style="position:fixed;inset:0;width:100%;height:100%;box-sizing:border-box;margin:0;border:0;padding:8px;font:12px/1.4 monospace">${esc}</textarea>`,
    { width: 560, height: 680, title: "Primitiv token audit" },
  );
})().catch((e) => {
  figma.showUI(`<pre style="margin:0;padding:8px;font:12px monospace;color:#c00">${e.message}</pre>`, {
    width: 480,
    height: 160,
  });
});
