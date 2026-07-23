// POC docs-data extractor — the shape the real pipeline (§1.12) will take.
//
// Headless half: for each sub-component, walk its *Props type with the
// TypeScript compiler API and emit per-prop {name,type,required,default,
// description}. Applies the propFilter validated in §1.14/§1.16 — a prop is
// dropped only when EVERY declaration resolves into node_modules (native DOM
// attributes fall away; a redeclared `children`/`ref`/narrowed attr is kept).
// `extends` comes from the type's `@extends` tag if present, else from the
// contract element → interface map (§1.14 styled side). Union-excluded `never`
// branches (controlled/uncontrolled) are dropped.
//
// Styled half: read the registry contract.json directly (§1.6, no diff) —
// root + sub-component modifiers[] → per-sub contractProps, dataAttributes, and
// the top-level customProperties.
//
// Output: scripts/docs-data/<name>.docs.json in the §1.7 schema (denormalised:
// each headless sub-component also carries its contractProps/dataAttributes, so
// the docs layout can render one section per sub-component).
//
// Run: node scripts/docs-data/extract-docs-data.mjs button
//      node scripts/docs-data/extract-docs-data.mjs tabs

import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(join(ROOT, "packages/react/"));
const ts = require("typescript");

const REGISTRY = {
  button: {
    displayName: "Button", kind: "registry", status: "stable",
    propsFile: "packages/react/src/Button/types.ts",
    subComponents: [{ name: "Button", propsType: "ButtonProps", element: "button" }],
    contract: "registry/components/button/contract.json",
    figmaComponentSetKey: "347:14161", importPath: "@primitiv-ui/react",
  },
  tabs: {
    displayName: "Tabs", kind: "registry", status: "stable",
    propsFile: "packages/react/src/Tabs/types.ts",
    subComponents: [
      { name: "Tabs.Root", propsType: "TabsRootProps", element: "div", component: "Root" },
      { name: "Tabs.List", propsType: "TabsListProps", element: "div", component: "List" },
      { name: "Tabs.Trigger", propsType: "TabsTriggerProps", element: "button", component: "Trigger" },
      { name: "Tabs.Content", propsType: "TabsContentProps", element: "div", component: "Content" },
    ],
    contract: "registry/components/tabs/contract.json",
    figmaComponentSetKey: "425:5528", importPath: "@primitiv-ui/react",
  },
};

const EL_IFACE = {
  a: "HTMLAnchorElement", button: "HTMLButtonElement", div: "HTMLDivElement",
  input: "HTMLInputElement", span: "HTMLSpanElement", ul: "HTMLUListElement",
  li: "HTMLLIElement", label: "HTMLLabelElement", select: "HTMLSelectElement",
  textarea: "HTMLTextAreaElement", p: "HTMLParagraphElement", nav: "HTMLElement",
};

const name = process.argv[2] || "button";
const cfg = REGISTRY[name];
if (!cfg) throw new Error(`no registry entry for "${name}"`);

const tsconfigPath = join(ROOT, "packages/react/tsconfig.json");
const raw = ts.readConfigFile(tsconfigPath, ts.sys.readFile).config;
const parsed = ts.parseJsonConfigFileContent(raw, ts.sys, dirname(tsconfigPath));
const program = ts.createProgram(parsed.fileNames, { ...parsed.options, noEmit: true });
const checker = program.getTypeChecker();
const FMT = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
const partsToString = (parts) => Array.isArray(parts) ? parts.map((p) => p.text).join("") : String(parts ?? "");
const inNodeModules = (d) => d.getSourceFile().fileName.includes("node_modules");

const sf = program.getSourceFile(join(ROOT, cfg.propsFile));
if (!sf) throw new Error(`source file not found: ${cfg.propsFile}`);

function findAlias(typeName) {
  let sym;
  ts.forEachChild(sf, (node) => {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) sym = checker.getSymbolAtLocation(node.name);
  });
  return sym;
}

function extractSub(sc) {
  const sym = findAlias(sc.propsType);
  if (!sym) throw new Error(`type ${sc.propsType} not found`);
  const extTag = sym.getJsDocTags(checker).find((t) => t.name === "extends");
  const ext = extTag ? partsToString(extTag.text).trim() : (EL_IFACE[sc.element] || null);
  const type = checker.getDeclaredTypeOfSymbol(sym);
  const props = [];
  for (const prop of checker.getPropertiesOfType(type)) {
    const decls = prop.getDeclarations() || [];
    if (decls.length > 0 && decls.every(inNodeModules)) continue;
    const at = prop.valueDeclaration || decls[0];
    if (!at) continue;
    const required = (prop.getFlags() & ts.SymbolFlags.Optional) === 0;
    const t = checker.getTypeOfSymbolAtLocation(prop, at);
    // Expand a string-literal-union alias (TabsOrientation → "horizontal" | "vertical")
    // rather than leaking the alias name; ignore the synthetic `undefined` member.
    let propType;
    const members = (typeof t.isUnion === "function" && t.isUnion())
      ? t.types.filter((x) => !(x.flags & ts.TypeFlags.Undefined)) : null;
    if (members && members.length && members.every((x) => typeof x.isStringLiteral === "function" && x.isStringLiteral())) {
      propType = members.map((x) => JSON.stringify(x.value)).join(" | ");
    } else {
      // drop native-intersection artifacts from narrowing an inherited attr
      // without Omit-ting it first (§1.16) — e.g. `string | (readonly string[] & string)`
      propType = checker.typeToString(t, at, FMT).replace(/\s*\|\s*\(readonly [^)]*\)/g, "");
    }
    if (propType === "never") continue; // union-excluded branch (controlled/uncontrolled)
    if (!required) propType = propType.replace(/\s*\|\s*undefined$/, "");
    // unwrap a single outer paren around a function type (after `| undefined` is gone)
    propType = propType.replace(/^\((\(.*\) => .*)\)$/, "$1");
    const defTag = prop.getJsDocTags().find((t) => t.name === "default");
    props.push({
      name: prop.getName(), type: propType, required,
      default: defTag ? partsToString(defTag.text).trim() : null,
      description: ts.displayPartsToString(prop.getDocumentationComment(checker)).trim(),
    });
  }
  props.sort((a, b) => Number(b.required) - Number(a.required) || a.name.localeCompare(b.name));
  return { name: sc.name, extends: ext, props };
}

// ---- styled half from contract.json ----
const contract = JSON.parse(readFileSync(join(ROOT, cfg.contract), "utf8"));
const modsFor = (mods) => (mods || []).map((m) => ({
  name: m.prop || m.name,
  type: (m.options || []).map((o) => `"${o.name}"`).join(" | "),
  default: m.default ?? null,
  description: m.description || "",
}));
// component-name → { contractProps, dataAttributes }
const styledByComponent = {};
const rootComp = contract.root?.component || cfg.subComponents[0].component || cfg.subComponents[0].name;
styledByComponent[rootComp] = {
  contractProps: modsFor(contract.modifiers),
  dataAttributes: (contract.dataAttributes || []).map((d) => d.name),
};
for (const sub of contract.subcomponents || []) {
  styledByComponent[sub.component] = {
    contractProps: modsFor(sub.modifiers),
    dataAttributes: (sub.dataAttributes || []).map((d) => d.name),
  };
}

// ---- merge ----
const subComponents = cfg.subComponents.map((sc) => {
  const head = extractSub(sc);
  const key = sc.component || sc.name;
  const styled = styledByComponent[key] || { contractProps: [], dataAttributes: [] };
  // dedupe dataAttributes, drop the styled contract-prop names that duplicate nothing
  return {
    ...head,
    contractProps: styled.contractProps,
    dataAttributes: [...new Set(styled.dataAttributes)],
  };
});

const out = {
  id: name, displayName: cfg.displayName, kind: cfg.kind, status: cfg.status,
  description: contract.description,
  headless: { package: "@primitiv-ui/react", importPath: cfg.importPath, subComponents },
  styled: {
    installCommand: `primitiv add ${name}`,
    rootClass: contract.root?.class,
    customProperties: (contract.customProperties || []).map((c) => ({ name: c.name, defaultsTo: c.defaultsTo })),
  },
  figma: { componentSetKey: cfg.figmaComponentSetKey },
};

const outPath = join(ROOT, `scripts/docs-data/${name}.docs.json`);
writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");

const totalProps = subComponents.reduce((n, s) => n + s.props.length, 0);
const totalContract = subComponents.reduce((n, s) => n + s.contractProps.length, 0);
console.log(`✓ ${cfg.displayName}: ${subComponents.length} sub-component(s), ${totalProps} headless props, ` +
  `${totalContract} contract props, ${out.styled.customProperties.length} css vars`);
for (const s of subComponents) {
  console.log(`  ${s.name}  (extends ${s.extends})  props: ${s.props.map((p) => p.name).join(", ") || "—"}` +
    (s.contractProps.length ? `  · contract: ${s.contractProps.map((p) => p.name).join(", ")}` : ""));
}
console.log(`  → ${outPath.replace(ROOT + "/", "")}`);
