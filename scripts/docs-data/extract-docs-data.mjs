// POC docs-data extractor — the shape the real pipeline (§1.12) will take.
//
// Headless half: walk the component's *Props type with the TypeScript compiler
// API and emit per-prop {name,type,required,default,description} + the
// component's `@extends` tag. Applies the propFilter rule validated in
// docs/docs-site-planning.md §1.14/§1.16 — a prop is dropped only when EVERY
// one of its declarations resolves into node_modules (so native DOM attributes
// fall away but a redeclared `children`/`ref`/narrowed `type` is kept).
//
// Styled half: read the registry component's contract.json directly (§1.6) —
// modifiers[] → contractProps, plus customProperties / dataAttributes.
//
// Output: scripts/docs-data/<name>.docs.json in the §1.7 schema. The Figma
// wireframe script then lays the component page out FROM this file, proving the
// "docs site is a consumer of generated data" constraint end to end.
//
// Run: node scripts/docs-data/extract-docs-data.mjs button
// (TypeScript is resolved from packages/react, which pins the repo's TS 6.x.)

import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(join(ROOT, "packages/react/"));
const ts = require("typescript");

const REGISTRY = {
  button: {
    displayName: "Button",
    kind: "registry",
    status: "stable",
    propsFile: "packages/react/src/Button/types.ts",
    propsType: "ButtonProps",
    importPath: "@primitiv-ui/react",
    contract: "registry/components/button/contract.json",
    figmaComponentSetKey: "347:14161",
  },
};

const name = process.argv[2] || "button";
const cfg = REGISTRY[name];
if (!cfg) throw new Error(`no registry entry for "${name}"`);

// ---- TS program over packages/react ----
const tsconfigPath = join(ROOT, "packages/react/tsconfig.json");
const raw = ts.readConfigFile(tsconfigPath, ts.sys.readFile).config;
const parsed = ts.parseJsonConfigFileContent(raw, ts.sys, dirname(tsconfigPath));
const program = ts.createProgram(parsed.fileNames, {
  ...parsed.options,
  noEmit: true,
});
const checker = program.getTypeChecker();

const partsToString = (parts) =>
  Array.isArray(parts) ? parts.map((p) => p.text).join("") : String(parts ?? "");

// ---- locate the *Props type alias ----
const sf = program.getSourceFile(join(ROOT, cfg.propsFile));
if (!sf) throw new Error(`source file not found: ${cfg.propsFile}`);
let propsSymbol;
ts.forEachChild(sf, (node) => {
  if (ts.isTypeAliasDeclaration(node) && node.name.text === cfg.propsType) {
    propsSymbol = checker.getSymbolAtLocation(node.name);
  }
});
if (!propsSymbol) throw new Error(`type ${cfg.propsType} not found`);

// @extends tag off the Props type's own JSDoc (§1.14)
const extendsTag = propsSymbol
  .getJsDocTags(checker)
  .find((t) => t.name === "extends");
const extendsInterface = extendsTag ? partsToString(extendsTag.text).trim() : null;

// ---- enumerate + filter props ----
const type = checker.getDeclaredTypeOfSymbol(propsSymbol);
const inNodeModules = (d) => d.getSourceFile().fileName.includes("node_modules");

const props = [];
for (const prop of checker.getPropertiesOfType(type)) {
  const decls = prop.getDeclarations() || [];
  // Drop ONLY when every declaration is in node_modules (native DOM attrs).
  if (decls.length > 0 && decls.every(inNodeModules)) continue;

  const at = prop.valueDeclaration || decls[0];
  const required = (prop.getFlags() & ts.SymbolFlags.Optional) === 0;
  let propType = checker.typeToString(
    checker.getTypeOfSymbolAtLocation(prop, at),
    at,
    ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
  );
  // optionality is carried by `required`; drop the synthetic `| undefined`.
  if (!required) propType = propType.replace(/\s*\|\s*undefined$/, "");
  const defTag = prop.getJsDocTags().find((t) => t.name === "default");
  props.push({
    name: prop.getName(),
    type: propType,
    required,
    default: defTag ? partsToString(defTag.text).trim() : null,
    description: ts.displayPartsToString(prop.getDocumentationComment(checker)).trim(),
  });
}
// stable, readable order: own custom props first, alphabetical
props.sort((a, b) => a.name.localeCompare(b.name));

// ---- styled half from contract.json (§1.6, no diff needed) ----
const contract = JSON.parse(readFileSync(join(ROOT, cfg.contract), "utf8"));
const contractProps = (contract.modifiers || []).map((m) => ({
  name: m.prop || m.name,
  type: (m.options || []).map((o) => `"${o.name}"`).join(" | "),
  default: m.default ?? null,
  description: m.description || "",
}));

const out = {
  id: name,
  displayName: cfg.displayName,
  kind: cfg.kind,
  status: cfg.status,
  description: contract.description,
  headless: {
    package: "@primitiv-ui/react",
    importPath: cfg.importPath,
    extends: extendsInterface,
    props,
  },
  styled: {
    installCommand: `primitiv add ${name}`,
    rootClass: contract.root?.class,
    contractProps,
    customProperties: (contract.customProperties || []).map((c) => ({
      name: c.name,
      defaultsTo: c.defaultsTo,
    })),
    dataAttributes: (contract.dataAttributes || []).map((d) => d.name),
  },
  figma: { componentSetKey: cfg.figmaComponentSetKey },
};

const outPath = join(ROOT, `scripts/docs-data/${name}.docs.json`);
writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");

console.log(`✓ ${cfg.displayName}: ${props.length} headless props, ` +
  `${contractProps.length} contract props, ` +
  `${out.styled.customProperties.length} css vars, extends ${extendsInterface}`);
console.log(`  headless props: ${props.map((p) => p.name).join(", ")}`);
console.log(`  → ${outPath.replace(ROOT + "/", "")}`);
