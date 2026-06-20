/*
 * Throwaway diagnostic — run in the Figma DESKTOP developer console
 * (Plugins → Development → Open console; type `allow pasting`, Enter; paste; run).
 *
 * Dumps every variable in the `Context` collection that still holds a RAW NUMBER
 * in any density mode (the signature of the unitless-emit bug — a length value
 * that was authored as a number instead of an alias to a size/radii primitive),
 * plus a focused watchlist showing the alias target (or raw value) per mode for
 * the checkbox/radio anatomy tokens under investigation.
 *
 * Copy everything the console prints between PRIMITIV_TOKEN_AUDIT_START and
 * PRIMITIV_TOKEN_AUDIT_END and hand it back for diagnosis. Not wired into any
 * build — safe to delete once the audit is done.
 */
(async () => {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const ctx = collections.find((c) => c.name === "Context");
  if (!ctx) {
    console.log("No 'Context' collection. Found: " + collections.map((c) => c.name).join(", "));
    return;
  }
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

  console.log("PRIMITIV_TOKEN_AUDIT_START");
  console.log(
    JSON.stringify(
      {
        contextCollection: ctx.name,
        modes: ctx.modes.map((m) => m.name),
        totalContextVariables: ctxVars.length,
        rawNumberVariables: raw,
        watchlist: watchOut,
      },
      null,
      2,
    ),
  );
  console.log("PRIMITIV_TOKEN_AUDIT_END");
})().catch((e) => console.error(e.message));
