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

import { REGISTRY } from "./registry.mjs";

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
/*
 * A part's data attributes as full { name, value, when } rows.
 *
 * These used to be names only, with the whole triple living in a single flat
 * top-level list — which is what made the Tabs page unreadable: `data-orientation`
 * is emitted by all four parts, so the one table showed it four times over with
 * nothing saying which part each row belonged to (and, since the table keys rows
 * on name+value, four React children with the same key). Per-part rows let the
 * page render a table per part instead.
 */
const rowsFor = (attrs) =>
  (attrs || []).map((d) => ({
    name: d.name,
    value: d.value ?? "",
    when: d.when ?? "",
  }));

const dedupeRows = (rows) => {
  const seen = new Set();
  return rows.filter((r) => {
    const key = `${r.name}\u0000${r.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/*
 * Joins a REGISTRY entry's part to its contract entry.
 *
 * Normalised because the two files disagreed on spelling and nothing said so:
 * `registry.mjs` wrote Select's parts as the contract's `name` (`value`,
 * `item-indicator`) while this map was keyed by its `component` (`Value`,
 * `ItemIndicator`), so every Select sub-component silently resolved to no
 * contract props and no data attributes. Tabs happened to use PascalCase and
 * worked, which is why the failure stayed hidden. Both spellings now key the
 * same entry, and anything still unmatched is reported below rather than
 * quietly emitting an empty part.
 */
const partKey = (k) => String(k ?? "").replace(/[-_]/g, "").toLowerCase();

// component-name → { contractProps, dataAttributes }
const styledByComponent = {};
const rootComp = contract.root?.component || cfg.subComponents[0].component || cfg.subComponents[0].name;
styledByComponent[partKey(rootComp)] = {
  contractProps: modsFor(contract.modifiers),
  /* Both shapes: a top-level `dataAttributes` (the canonical one, 32 contracts)
     and `root.dataAttributes` (toggle-group, segmented-control). Reading only
     the first would drop those two components' root attributes from their page
     without a word — the same silent-omission class as the part-name casing. */
  dataAttributes: rowsFor([
    ...(contract.dataAttributes || []),
    ...(contract.root?.dataAttributes || []),
  ]),
  class: contract.root?.class ?? null,
};
for (const sub of contract.subcomponents || []) {
  const entry = {
    contractProps: modsFor(sub.modifiers),
    dataAttributes: rowsFor(sub.dataAttributes),
    /* The class a styled-mode reader actually writes in their CSS. In headless
       mode there is no class — the element is theirs — so the page shows the
       part name instead. */
    class: sub.class ?? null,
  };
  /* Both spellings, so a registry entry can name the part either way. */
  styledByComponent[partKey(sub.component)] = entry;
  styledByComponent[partKey(sub.name)] = entry;
}

/*
 * The full data-attribute rows, for the page's "Data attributes" table.
 *
 * The per-sub `dataAttributes` above is a list of NAMES only, which is all the
 * props tables need. The table wants the whole triple — attribute, value, and
 * the state that emits it — and `value` is load-bearing rather than decorative:
 * `data-state` appears twice with different values (`checked`/`unchecked`), so a
 * name-only list silently collapses two rows into one.
 *
 * Read from the contract's own declarations, root and sub-components together,
 * because an attribute belongs to the COMPONENT rather than to any one part —
 * `data-placeholder` is emitted on the value part while `aria-expanded` is on
 * the trigger, and the reader wants one table, not nine.
 *
 * `source` is dropped: every entry in every contract is `"auto"`, so a column
 * of identical values is noise. Reinstate it if a `"manual"` ever appears.
 */
const dataAttributes = [
  ...(contract.dataAttributes || []),
  ...(contract.subcomponents || []).flatMap((s) => s.dataAttributes || []),
].map((d) => ({ name: d.name, value: d.value ?? "", when: d.when ?? "" }));

// ---- merge ----
/* Parts with no contract entry at all. Legitimate for a headless-only part, but
   worth printing: an accidental one used to produce a silently empty part. */
const unmatchedParts = [];

const subComponents = cfg.subComponents.map((sc) => {
  const head = extractSub(sc);
  const key = partKey(sc.component || sc.name);
  const styled = styledByComponent[key];
  if (!styled) unmatchedParts.push(sc.name);
  // dedupe dataAttributes, drop the styled contract-prop names that duplicate nothing
  return {
    ...head,
    contractProps: styled?.contractProps ?? [],
    /* Keyed on name+value, not name: `data-state` legitimately appears twice
       with different values, and deduping by name alone dropped one of them. */
    dataAttributes: dedupeRows(styled?.dataAttributes ?? []),
    class: styled?.class ?? null,
  };
});

const out = {
  id: name, displayName: cfg.displayName, kind: cfg.kind, status: cfg.status,
  category: cfg.category,
  description: contract.description,
  headless: { package: "@primitiv-ui/react", importPath: cfg.importPath, subComponents },
  styled: {
    installCommand: `primitiv add ${name}`,
    rootClass: contract.root?.class,
    customProperties: (contract.customProperties || []).map((c) => ({ name: c.name, defaultsTo: c.defaultsTo })),
    dataAttributes,
  },
  figma: { componentSetKey: cfg.figmaComponentSetKey },
};

const outPath = join(ROOT, `scripts/docs-data/${name}.docs.json`);
writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");

const totalProps = subComponents.reduce((n, s) => n + s.props.length, 0);
const totalContract = subComponents.reduce((n, s) => n + s.contractProps.length, 0);
console.log(`✓ ${cfg.displayName}: ${subComponents.length} sub-component(s), ${totalProps} headless props, ` +
  `${totalContract} contract props, ${out.styled.customProperties.length} css vars, ` +
  `${dataAttributes.length} data attribute(s)`);
for (const s of subComponents) {
  console.log(`  ${s.name}  (extends ${s.extends})  props: ${s.props.map((p) => p.name).join(", ") || "—"}` +
    (s.contractProps.length ? `  · contract: ${s.contractProps.map((p) => p.name).join(", ")}` : ""));
}
if (unmatchedParts.length) {
  console.log(`  ! no contract entry for: ${unmatchedParts.join(", ")}` +
    ` — fine for a headless-only part, a typo otherwise`);
}
console.log(`  → ${outPath.replace(ROOT + "/", "")}`);
