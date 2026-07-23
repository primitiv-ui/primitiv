// Type-hygiene scan for the §1.16 pattern: a custom prop that narrows/redefines
// a same-named native HTML attribute WITHOUT `Omit`-ting it from the base
// `ComponentProps<T>` first. Such a prop keeps BOTH declarations — its own (in
// packages/react/src) and the native one (in node_modules) — and TypeScript
// resolves the two into an intersection (e.g. `string | (readonly string[] &
// string)`), which loses the clean narrowed type and can drop JSDoc in docgen.
//
// Detection: walk every exported `*Props` type alias under packages/react/src,
// enumerate its properties, and flag any property whose declarations span BOTH
// own-source and node_modules. Classify NARROW (types differ → real artifact)
// vs REDEFINE (same type → benign redundancy).
//
// Run: node scripts/docs-data/scan-prop-collisions.mjs

import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(join(ROOT, "packages/react/"));
const ts = require("typescript");

const tsconfigPath = join(ROOT, "packages/react/tsconfig.json");
const raw = ts.readConfigFile(tsconfigPath, ts.sys.readFile).config;
const parsed = ts.parseJsonConfigFileContent(raw, ts.sys, dirname(tsconfigPath));
const program = ts.createProgram(parsed.fileNames, { ...parsed.options, noEmit: true });
const checker = program.getTypeChecker();
const FMT = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;

const SRC = join(ROOT, "packages/react/src") + "/";
const isNM = (d) => d.getSourceFile().fileName.includes("node_modules");
const isOwn = (d) => d.getSourceFile().fileName.startsWith(SRC);
const artifact = (s) => / & /.test(s); // intersection leaking into the resolved type

const findings = [];
for (const sf of program.getSourceFiles()) {
  const fn = sf.fileName;
  if (!fn.startsWith(SRC)) continue;
  if (/\.(test|spec|stories|fixtures)\.tsx?$/.test(fn)) continue;
  ts.forEachChild(sf, (node) => {
    if (!ts.isTypeAliasDeclaration(node)) return;
    if (!/Props$/.test(node.name.text)) return;
    const isExported = (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0;
    if (!isExported) return;
    const sym = checker.getSymbolAtLocation(node.name);
    let type;
    try { type = checker.getDeclaredTypeOfSymbol(sym); } catch { return; }
    let props;
    try { props = checker.getPropertiesOfType(type); } catch { return; }
    for (const prop of props) {
      const decls = prop.getDeclarations() || [];
      const own = decls.filter(isOwn);
      const native = decls.filter(isNM);
      if (own.length === 0 || native.length === 0) continue; // Omit'd or purely native/own
      const at = own[0];
      let resolved = "";
      try { resolved = checker.typeToString(checker.getTypeOfSymbolAtLocation(prop, at), at, FMT); } catch {}
      findings.push({
        type: node.name.text,
        file: fn.replace(SRC, ""),
        prop: prop.getName(),
        resolved,
        kind: artifact(resolved) ? "NARROW" : "redefine",
      });
    }
  });
}

const narrow = findings.filter((f) => f.kind === "NARROW");
const redefine = findings.filter((f) => f.kind === "redefine");

console.log(`Scanned exported *Props under packages/react/src.\n`);
console.log(`NARROW — native attr narrowed without Omit (real artifact, fix these): ${narrow.length}`);
for (const f of narrow) console.log(`  ✗ ${f.type}.${f.prop}   →   ${f.resolved}      [${f.file}]`);
console.log(`\nredefine — same-named native attr re-declared, types compatible (benign): ${redefine.length}`);
const byType = {};
for (const f of redefine) (byType[f.type] ||= []).push(f.prop);
for (const [t, ps] of Object.entries(byType)) console.log(`  · ${t}: ${ps.join(", ")}`);

// Guard: fail if any NARROW artifact exists (a custom prop narrowing a native
// attribute without Omit — the §1.16 pattern). Add `"qa:prop-collisions"` to CI
// to keep the headless package's prop types clean.
if (narrow.length > 0) {
  console.error(`\n✗ ${narrow.length} narrowing artifact(s) — Omit the native attribute from the base ComponentProps first.`);
  process.exitCode = 1;
} else {
  console.log(`\n✓ no narrowing artifacts.`);
}
