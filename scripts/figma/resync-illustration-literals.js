/*
 * Re-resolve every bound colour literal inside the docs-site illustrations.
 *
 * WHY THIS EXISTS
 * ---------------
 * The brand seed, the neutral anchors (soft white / soft black) and the four
 * feedback ramps (info / warning / success / danger) are all expected to be
 * regenerated once the Harmoni plugin can produce fresh palettes. When that
 * happens, `Primitives / Palette` in Figma gets new values and everything in
 * the file that *aliases* those variables should follow.
 *
 * The illustrations are the one place that needs a tool rather than trust,
 * for a reason documented in the root CLAUDE.md (Figma gotcha 3): a paint
 * written through `setBoundVariableForPaint` carries BOTH a binding and a
 * literal `color` snapshot, and the snapshot is what the plugin API reads
 * back. Any literal written against today's palette is a value frozen at the
 * moment it was authored. This script walks every illustration, reads each
 * paint's bound variable, re-resolves it against the frame's own pinned modes,
 * and rewrites the literal to match.
 *
 * It is idempotent: a run against an unchanged palette reports zero writes.
 * That is also what makes it a useful *audit* — run it before a palette swap
 * to see whether anything has already drifted, and after one to land the new
 * values.
 *
 * It cannot fix a paint with no binding at all. Those are reported separately
 * as `unbound`, and every one is a hazard: a raw hex will silently keep the
 * old brand colour after a swap. The fix for an unbound paint is to bind it,
 * not to hand-edit the hex.
 *
 * USAGE
 * -----
 *   1. Pair the Desktop Bridge.
 *   2. Paste this file into `figma_execute` and `return await resync();`
 *      — or `return await resync({ dryRun: true });` to audit without writing.
 *
 * The mode rule is the house rule and must not be "simplified": a dark frame
 * pins `Intent = Dark` and leaves `Primitives / Palette` on Light. Resolution
 * here reads each frame's own `explicitVariableModes` and falls back to a
 * collection's `defaultModeId`, so it reproduces exactly what Figma renders
 * rather than imposing a second opinion.
 */

const ILLUSTRATION_IDS = [
  'A11Y-C01', 'CLI-01', 'COMPOSE-01', 'DENSITY-C01', 'DENSITY-C02',
  'FAMILY-01', 'FIGMA-P01', 'FIGMA-P02', 'START-01', 'TOKENS-01',
];

/* A frame is an illustration if its name is one of the ids, optionally with a
   ` — desktop` / ` — mobile` / ` — light` suffix. Deliberately anchored so a
   section frame called "02 — ..." can never match. */
const isIllustrationRoot = (name) =>
  ILLUSTRATION_IDS.some((id) => name === id || name.startsWith(id + ' —'));

const PAGES = [
  'Docs Site — Content illustrations',
  'Docs Site — Content pages (v3)',
  'Docs Site — Home (v3)',
];

const toHex = (c) =>
  '#' + ['r', 'g', 'b'].map((k) => Math.round(c[k] * 255).toString(16).padStart(2, '0')).join('');

async function resync(options) {
  const dryRun = !!(options && options.dryRun);

  const collections = {};
  for (const c of await figma.variables.getLocalVariableCollectionsAsync()) collections[c.id] = c;

  /* Walk the alias chain to a raw value, taking each collection's mode from
     the nearest ancestor pin and otherwise its default. */
  const resolve = async (variable, pins) => {
    let cur = variable;
    for (let hop = 0; hop < 16; hop++) {
      const cid = cur.variableCollectionId;
      const collection = collections[cid];
      if (!collection) return null;
      const modeId = pins[cid] || collection.defaultModeId;
      const value = cur.valuesByMode[modeId];
      if (value && value.type === 'VARIABLE_ALIAS') {
        cur = await figma.variables.getVariableByIdAsync(value.id);
        continue;
      }
      return value;
    }
    return null;
  };

  const variableCache = {};
  const getVariable = async (id) => {
    if (!(id in variableCache)) variableCache[id] = await figma.variables.getVariableByIdAsync(id);
    return variableCache[id];
  };

  const report = { rewritten: [], unbound: [], frames: 0, checked: 0, dryRun };

  const visit = async (node, pins, frameLabel) => {
    /* An ancestor's pins are inherited; a node's own pins override them. */
    const scoped = node.explicitVariableModes
      ? Object.assign({}, pins, node.explicitVariableModes)
      : pins;

    for (const prop of ['fills', 'strokes']) {
      let paints;
      try { paints = node[prop]; } catch (e) { continue; }
      if (!Array.isArray(paints)) continue;

      let next = null;
      for (let i = 0; i < paints.length; i++) {
        const paint = paints[i];
        if (paint.type !== 'SOLID') continue;
        report.checked++;
        const bound = paint.boundVariables && paint.boundVariables.color;
        if (!bound) {
          report.unbound.push({ frame: frameLabel, node: node.name, prop, hex: toHex(paint.color) });
          continue;
        }
        const variable = await getVariable(bound.id);
        if (!variable) continue;
        const value = await resolve(variable, scoped);
        if (!value || typeof value.r !== 'number') continue;
        const was = toHex(paint.color);
        const now = toHex(value);
        if (was === now) continue;
        report.rewritten.push({ frame: frameLabel, node: node.name, prop, token: variable.name, from: was, to: now });
        if (!next) next = JSON.parse(JSON.stringify(paints));
        /* Keep every other field (opacity, blend mode) and the binding itself;
           only the frozen literal moves. */
        next[i] = Object.assign({}, next[i], { color: { r: value.r, g: value.g, b: value.b } });
      }
      if (next && !dryRun) node[prop] = next;
    }

    for (const child of (node.children || [])) await visit(child, scoped, frameLabel);
  };

  for (const pageName of PAGES) {
    const page = figma.root.children.find((p) => p.name === pageName);
    if (!page) continue;
    await page.loadAsync();

    const roots = [];
    const findRoots = (node, pins) => {
      const scoped = node.explicitVariableModes
        ? Object.assign({}, pins, node.explicitVariableModes)
        : pins;
      for (const child of (node.children || [])) {
        if (isIllustrationRoot(child.name)) roots.push({ node: child, pins: scoped });
        else findRoots(child, scoped);
      }
    };
    findRoots(page, {});

    for (const { node, pins } of roots) {
      report.frames++;
      await visit(node, pins, pageName.replace('Docs Site — ', '') + ' / ' + node.name);
    }
  }

  return report;
}
