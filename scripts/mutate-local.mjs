#!/usr/bin/env node
/**
 * A local stand-in for Stryker, for machines where `pnpm install` can't run and
 * so `@stryker-mutator/core` isn't available.
 *
 *   node scripts/mutate-local.mjs NavigationMenu          # run every mutant
 *   node scripts/mutate-local.mjs NavigationMenu --list    # just enumerate them
 *   node scripts/mutate-local.mjs NavigationMenu --only useNavigationMenuRoot
 *   node scripts/mutate-local.mjs NavigationMenu --start 120
 *
 * It walks each source file's TypeScript AST, generates the mutants Stryker's
 * mutators would, applies them one at a time, runs the component's vitest suite,
 * and reports the survivors — the same signal, produced with only `typescript`
 * and `vitest`, both of which are already installed.
 *
 * **Stryker remains the source of truth.** `.github/workflows/mutation.yml` is
 * the gate; this is a fast local loop for getting a component *to* 100% before
 * pushing. Known differences:
 *
 * - It **over-generates slightly** (~283 mutants vs Stryker's 251 for
 *   NavigationMenu): where an `if` test is itself a comparison or logical
 *   expression, both the statement and the expression get a `true`/`false`
 *   mutant. Over-generating is the safe direction — a survivor here is at worst
 *   a mutant CI won't even ask about.
 * - There is no `perTest` coverage analysis, so every mutant runs the whole
 *   component suite. Expect ~10s per mutant, i.e. tens of minutes.
 * - `Timeout` isn't modelled: a mutant that hangs shows up as a vitest failure,
 *   which counts as killed — the same verdict Stryker gives it.
 *
 * It reads its file list from `packages/react/stryker.config.mjs`, so the set of
 * mutated files (including the SHARED_MODULES re-homing) cannot drift from CI.
 * `// Stryker disable next-line <mutators>` comments are honoured exactly as
 * Stryker honours them, `all` included.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const REACT_DIR = fileURLToPath(new URL("../packages/react/", import.meta.url));
const require = createRequire(REACT_DIR + "package.json");
/** @type {import("typescript")} */
const ts = require("typescript");

const args = process.argv.slice(2);
const component = args.find((a) => !a.startsWith("--"));
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : (args[i + 1] ?? true);
};
if (!component) {
  console.error(
    "Usage: node scripts/mutate-local.mjs <Component> [--list] [--only <substring>] [--start <n>]",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Which files to mutate — taken from the Stryker config so the two can't drift.
// ---------------------------------------------------------------------------
process.env.STRYKER_COMPONENT = component;
const strykerConfig = (
  await import(new URL("../packages/react/stryker.config.mjs", import.meta.url))
).default;

/** Converts one Stryker `mutate` glob to a RegExp over a src-relative path. */
function globToRegExp(glob) {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        // `**/` matches zero or more path segments; a trailing `**` matches all.
        if (glob[i + 2] === "/") {
          out += "(?:[^/]+/)*";
          i += 2;
        } else {
          out += ".*";
          i += 1;
        }
      } else {
        out += "[^/]*";
      }
    } else if (c === "{") {
      const close = glob.indexOf("}", i);
      out += `(?:${glob
        .slice(i + 1, close)
        .split(",")
        .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|")})`;
      i = close;
    } else {
      out += c.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${out}$`);
}

const includes = [];
const excludes = [];
for (const pattern of strykerConfig.mutate) {
  (pattern.startsWith("!") ? excludes : includes).push(
    globToRegExp(pattern.replace(/^!/, "")),
  );
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(resolve(REACT_DIR, "src"))
  .map((f) => relative(REACT_DIR, f))
  .filter(
    (f) =>
      includes.some((r) => r.test(f)) && !excludes.some((r) => r.test(f)),
  )
  .sort();

if (files.length === 0) {
  console.error(
    `No mutable files matched for "${component}" — is the name spelled as the src directory?`,
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Mutant generation
// ---------------------------------------------------------------------------
const COMPARISON = new Set([
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.LessThanToken,
  ts.SyntaxKind.LessThanEqualsToken,
  ts.SyntaxKind.GreaterThanToken,
  ts.SyntaxKind.GreaterThanEqualsToken,
]);
const EQUALITY_SWAP = {
  [ts.SyntaxKind.EqualsEqualsToken]: ["!="],
  [ts.SyntaxKind.ExclamationEqualsToken]: ["=="],
  [ts.SyntaxKind.EqualsEqualsEqualsToken]: ["!=="],
  [ts.SyntaxKind.ExclamationEqualsEqualsToken]: ["==="],
  [ts.SyntaxKind.LessThanToken]: ["<=", ">="],
  [ts.SyntaxKind.LessThanEqualsToken]: ["<", ">"],
  [ts.SyntaxKind.GreaterThanToken]: [">=", "<="],
  [ts.SyntaxKind.GreaterThanEqualsToken]: [">", "<"],
};
const LOGICAL_SWAP = {
  [ts.SyntaxKind.AmpersandAmpersandToken]: "||",
  [ts.SyntaxKind.BarBarToken]: "&&",
  [ts.SyntaxKind.QuestionQuestionToken]: "&&",
};
const ARITHMETIC_SWAP = {
  [ts.SyntaxKind.PlusToken]: "-",
  [ts.SyntaxKind.MinusToken]: "+",
  [ts.SyntaxKind.AsteriskToken]: "/",
  [ts.SyntaxKind.SlashToken]: "*",
  [ts.SyntaxKind.PercentToken]: "*",
};

/** Mutators switched off for a line by the `// Stryker disable next-line` above it. */
function disabledByLine(source) {
  const map = new Map();
  source.split("\n").forEach((line, index) => {
    const match = line.match(/\/\/\s*Stryker disable next-line\s+([^:]+)/);
    if (!match) return;
    map.set(
      index + 2,
      new Set(
        match[1]
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean),
      ),
    );
  });
  return map;
}

/** Type positions produce no runtime behaviour, so Stryker leaves them alone. */
function inTypePosition(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (
      ts.isTypeNode(p) ||
      ts.isTypeAliasDeclaration(p) ||
      ts.isInterfaceDeclaration(p) ||
      ts.isAsExpression(p) ||
      ts.isSatisfiesExpression(p)
    )
      return true;
  }
  return false;
}

function collect(file) {
  const abs = resolve(REACT_DIR, file);
  const source = readFileSync(abs, "utf8");
  const sf = ts.createSourceFile(
    abs,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const disabled = disabledByLine(source);
  const mutants = [];

  const add = (mutator, node, replacement) => {
    const start = node.getStart(sf);
    const end = node.getEnd();
    const line = sf.getLineAndCharacterOfPosition(start).line + 1;
    const off = disabled.get(line);
    if (off && (off.has("all") || off.has(mutator))) return;
    mutants.push({
      file,
      abs,
      source,
      mutator,
      line,
      start,
      end,
      replacement,
      label: source
        .slice(start, Math.min(end, start + 60))
        .replace(/\s+/g, " "),
    });
  };
  const addCondition = (node) => {
    add("ConditionalExpression", node, "true");
    add("ConditionalExpression", node, "false");
  };

  const visit = (node) => {
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      !inTypePosition(node)
    ) {
      const p = node.parent;
      const skip =
        ts.isImportDeclaration(p) ||
        ts.isExportDeclaration(p) ||
        ts.isModuleDeclaration(p) ||
        ts.isJsxAttribute(p) ||
        ts.isLiteralTypeNode(p) ||
        ((ts.isPropertyAssignment(p) || ts.isPropertySignature(p)) &&
          p.name === node);
      if (!skip)
        add("StringLiteral", node, node.text === "" ? '"Stryker was here!"' : '""');
    }
    if (ts.isTemplateExpression(node) && !inTypePosition(node))
      add("StringLiteral", node, "``");

    if (node.kind === ts.SyntaxKind.TrueKeyword && !inTypePosition(node))
      add("BooleanLiteral", node, "false");
    if (node.kind === ts.SyntaxKind.FalseKeyword && !inTypePosition(node))
      add("BooleanLiteral", node, "true");
    if (
      ts.isPrefixUnaryExpression(node) &&
      node.operator === ts.SyntaxKind.ExclamationToken
    )
      add("BooleanLiteral", node, node.operand.getText(sf));

    if (ts.isIfStatement(node)) addCondition(node.expression);
    if (ts.isConditionalExpression(node)) addCondition(node.condition);
    if (ts.isWhileStatement(node) || ts.isDoStatement(node))
      add("ConditionalExpression", node.expression, "false");
    if (ts.isForStatement(node) && node.condition)
      add("ConditionalExpression", node.condition, "false");
    if (ts.isBinaryExpression(node)) {
      if (COMPARISON.has(node.operatorToken.kind)) {
        addCondition(node);
        for (const op of EQUALITY_SWAP[node.operatorToken.kind] ?? [])
          add("EqualityOperator", node.operatorToken, op);
      }
      if (LOGICAL_SWAP[node.operatorToken.kind]) {
        addCondition(node);
        add(
          "LogicalOperator",
          node.operatorToken,
          LOGICAL_SWAP[node.operatorToken.kind],
        );
      }
      if (ARITHMETIC_SWAP[node.operatorToken.kind])
        add(
          "ArithmeticOperator",
          node.operatorToken,
          ARITHMETIC_SWAP[node.operatorToken.kind],
        );
    }

    if (ts.isArrayLiteralExpression(node))
      add(
        "ArrayDeclaration",
        node,
        node.elements.length ? "[]" : '["Stryker was here"]',
      );
    if (ts.isObjectLiteralExpression(node) && !inTypePosition(node))
      add(
        "ObjectLiteral",
        node,
        node.properties.length ? "{}" : '{ "StrykerWasHere": "" }',
      );

    if (ts.isArrowFunction(node) && !ts.isBlock(node.body))
      add(
        "ArrowFunction",
        node,
        `${
          node.parameters.length
            ? `(${node.parameters.map((_p, i) => `_a${i}`).join(", ")})`
            : "()"
        } => undefined`,
      );
    if (ts.isBlock(node) && node.statements.length > 0)
      add("BlockStatement", node, "{}");

    if (
      (ts.isPropertyAccessExpression(node) ||
        ts.isElementAccessExpression(node) ||
        ts.isCallExpression(node)) &&
      node.questionDotToken
    )
      add("OptionalChaining", node.questionDotToken, "");

    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sf, visit);
  return mutants;
}

const only = flag("only");
let mutants = files.flatMap(collect);
if (typeof only === "string") mutants = mutants.filter((m) => m.file.includes(only));
const start = Number(flag("start") ?? 0);

console.log(
  `${mutants.length} mutants across ${files.length} file(s) for ${component}`,
);
if (flag("list")) {
  let current = "";
  for (const m of mutants) {
    if (m.file !== current) console.log(`\n${(current = m.file)}`);
    console.log(`  L${m.line}\t${m.mutator}\t-> ${m.replacement}\t| ${m.label}`);
  }
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
/** The file currently holding a mutant, so an interrupt can't leave it behind. */
let inFlight = null;
const restore = () => {
  if (inFlight) writeFileSync(inFlight.abs, inFlight.source);
  inFlight = null;
};
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    restore();
    process.exit(130);
  });
}
process.on("uncaughtException", (error) => {
  restore();
  throw error;
});

const survivors = [];
for (let i = start; i < mutants.length; i++) {
  const m = mutants[i];
  inFlight = m;
  writeFileSync(m.abs, m.source.slice(0, m.start) + m.replacement + m.source.slice(m.end));
  const run = spawnSync(
    "./node_modules/.bin/vitest",
    ["run", `src/${component}`, "--silent", "--bail=1", "--reporter=dot"],
    { cwd: REACT_DIR, encoding: "utf8" },
  );
  restore();
  if (run.status === 0) {
    survivors.push(m);
    console.log(
      `SURVIVED [${i + 1}/${mutants.length}] ${m.file}:${m.line} ${m.mutator} -> ${m.replacement}  | ${m.label}`,
    );
  } else if ((i + 1) % 25 === 0) {
    console.log(`  ...${i + 1}/${mutants.length} (${survivors.length} survivors)`);
  }
}

console.log(`\n=== ${survivors.length} survivor(s) of ${mutants.length - start} run ===`);
for (const m of survivors)
  console.log(`${m.file}:${m.line}\t${m.mutator}\t-> ${m.replacement}\t| ${m.label}`);
process.exit(survivors.length === 0 ? 0 : 1);
