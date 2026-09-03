// Step 1 of the dark-Intent reconciliation — READ ONLY, changes nothing.
//
// Decides between the two architectures in docs/dark-intent-figma-drift.md §4:
//
//   Option B (preferred) — make the Palette collection's mode follow the
//   Intent mode, and rewrite the dark aliases to use the code's own step
//   numbers. Requires the Palette collection to HAVE a Dark mode.
//
//   Option A (fallback)  — mirror `*-inverse` families, following the
//   precedent `color.neutral-alpha-inverse.*` already sets. Needed only if
//   Palette has no second mode.
//
// It also counts how big the "flag day" would be: every node that pins the
// Intent mode is a node that would need its Palette mode pinned in the same
// pass, or it renders wrong in between.

return (async function () {
  if (typeof figma.loadAllPagesAsync === "function") {
    try { await figma.loadAllPagesAsync(); } catch (e) {}
  }

  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const summary = cols.map((c) => ({
    name: c.name,
    modes: c.modes.map((m) => m.name),
    defaultMode: (c.modes.find((m) => m.modeId === c.defaultModeId) || {}).name,
    variables: c.variableIds.length,
  }));

  const intent = cols.find((c) => c.name === "Intent");
  // The palette lives in its own collection; match loosely, the file has
  // both "Primitives" and "Primitives / Palette".
  const palette = cols.find((c) => /palette/i.test(c.name));

  const intentDark = intent && intent.modes.find((m) => /dark/i.test(m.name));
  const paletteDark = palette && palette.modes.find((m) => /dark/i.test(m.name));

  // How many nodes pin a mode today? Each Intent=Dark pin is one node that
  // must gain a Palette=Dark pin in the same commit under Option B.
  let intentPins = 0, palettePins = 0, bothPins = 0;
  const darkNodes = [];
  const visit = (n, page) => {
    const modes = n.explicitVariableModes || {};
    const hasIntent = intent && modes[intent.id];
    const hasPalette = palette && modes[palette.id];
    if (hasIntent) {
      intentPins++;
      const isDark = intentDark && modes[intent.id] === intentDark.modeId;
      if (isDark && darkNodes.length < 40) {
        darkNodes.push({ page, node: n.name, type: n.type, alsoPinsPalette: !!hasPalette });
      }
    }
    if (hasPalette) palettePins++;
    if (hasIntent && hasPalette) bothPins++;
    if (n.children) for (const c of n.children) visit(c, page);
  };
  for (const p of figma.root.children) for (const n of p.children) visit(n, p.name);

  return {
    verdict: paletteDark
      ? "OPTION B IS VIABLE — the Palette collection has a Dark mode."
      : "OPTION B IS BLOCKED — the Palette collection has no Dark mode; use Option A (mirror families).",
    collections: summary,
    intent: intent ? { id: intent.id, modes: intent.modes.map((m) => m.name) } : null,
    palette: palette ? { id: palette.id, modes: palette.modes.map((m) => m.name) } : null,
    migrationSize: {
      nodesPinningIntent: intentPins,
      nodesPinningPalette: palettePins,
      nodesPinningBoth: bothPins,
      nodesNeedingAPaletteDarkPin: darkNodes.filter((d) => !d.alsoPinsPalette).length,
    },
    darkNodesSample: darkNodes,
  };
})();
