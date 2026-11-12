// Rename the doubled space/size primitive variables to bare steps:
// `space/space-4` -> `space/4`, `size/size-40` -> `size/40`, matching `radii/4`.
//
// Run via figma_execute (Desktop Bridge). Code-first counterpart of the
// packages/tokens rename (space.space-4 -> space.4). Deliberately NOT done by
// renaming and then running the sync-plugin backup: the backup writes colours
// as hex and would revert the OkLCH palette source.
//
// Aliases bind by variable id, so every Context/Elevation alias follows the
// rename automatically. A WEB code syntax that still names the old custom
// property is rewritten too. Idempotent: a second run finds nothing to do.
//
// APPLY = false reports what would change and touches nothing.
const APPLY = false;

const DOUBLED = /^(space|size)\/\1-(\d+)$/;
const OLD_CSS = /--primitiv-(space|size)-\1-(\d+)/g;

const variables = await figma.variables.getLocalVariablesAsync();
const names = new Set(variables.map((v) => v.name));
const renames = [];
const collisions = [];
const codeSyntax = [];

for (const v of variables) {
  const web = v.codeSyntax && v.codeSyntax.WEB;
  if (web && OLD_CSS.test(web)) codeSyntax.push({ v, web: web.replace(OLD_CSS, '--primitiv-$1-$2') });
  OLD_CSS.lastIndex = 0;

  const m = v.name.match(DOUBLED);
  if (!m) continue;
  const to = `${m[1]}/${m[2]}`;
  if (names.has(to)) collisions.push(`${v.name} -> ${to}`);
  else renames.push({ v, from: v.name, to });
}

if (APPLY && collisions.length === 0) {
  for (const { v, to } of renames) v.name = to;
  for (const { v, web } of codeSyntax) v.setVariableCodeSyntax('WEB', web);
}

const left = (await figma.variables.getLocalVariablesAsync()).filter((v) => DOUBLED.test(v.name)).length;
return {
  applied: APPLY && collisions.length === 0,
  renames: renames.length,
  sample: renames.slice(0, 4).map(({ from, to }) => `${from} -> ${to}`),
  collisions,
  codeSyntaxRewrites: codeSyntax.length,
  doubledRemaining: left,
};
