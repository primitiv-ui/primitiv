/**
 * Prism, loaded only when a block needs it, and each grammar only when a block
 * names its language — so a page showing only TSX downloads only TSX, and a
 * page with no code block downloads none of it. Each `import()` is a separate
 * file in the CDN build.
 */
import type PrismType from "prismjs";

type Prism = typeof PrismType;
type Grammar = PrismType.Grammar;

// Stryker disable all: static — both tables are built once at import, so runtime mutant switching never reaches them; every entry is pinned by a per-language highlighting test instead.
/*
 * Prism's grammar files ship no types: each extends the global `Prism` as a
 * side effect and exports nothing. Each import says so where it is made, rather
 * than in an ambient `declare module`, which JSR rejects as a change to global
 * types.
 */
/** Each grammar Primitiv highlights: how to load it, and the grammars it builds on. */
const GRAMMARS: Record<string, { load: () => Promise<unknown>; requires: readonly string[] }> = {
  // @ts-expect-error -- an untyped grammar file (see above).
  markup: { load: () => import("prismjs/components/prism-markup.js"), requires: [] },
  // @ts-expect-error -- an untyped grammar file (see above).
  css: { load: () => import("prismjs/components/prism-css.js"), requires: [] },
  // @ts-expect-error -- an untyped grammar file (see above).
  clike: { load: () => import("prismjs/components/prism-clike.js"), requires: [] },
  // @ts-expect-error -- an untyped grammar file (see above).
  javascript: { load: () => import("prismjs/components/prism-javascript.js"), requires: ["clike"] },
  // @ts-expect-error -- an untyped grammar file (see above).
  jsx: { load: () => import("prismjs/components/prism-jsx.js"), requires: ["markup", "javascript"] },
  // @ts-expect-error -- an untyped grammar file (see above).
  typescript: { load: () => import("prismjs/components/prism-typescript.js"), requires: ["javascript"] },
  // @ts-expect-error -- an untyped grammar file (see above).
  tsx: { load: () => import("prismjs/components/prism-tsx.js"), requires: ["jsx", "typescript"] },
  // @ts-expect-error -- an untyped grammar file (see above).
  json: { load: () => import("prismjs/components/prism-json.js"), requires: [] },
  // @ts-expect-error -- an untyped grammar file (see above).
  bash: { load: () => import("prismjs/components/prism-bash.js"), requires: [] },
  // @ts-expect-error -- an untyped grammar file (see above).
  yaml: { load: () => import("prismjs/components/prism-yaml.js"), requires: [] },
  // @ts-expect-error -- an untyped grammar file (see above).
  markdown: { load: () => import("prismjs/components/prism-markdown.js"), requires: ["markup"] },
  // @ts-expect-error -- an untyped grammar file (see above).
  python: { load: () => import("prismjs/components/prism-python.js"), requires: [] },
  // @ts-expect-error -- an untyped grammar file (see above).
  diff: { load: () => import("prismjs/components/prism-diff.js"), requires: [] },
  // @ts-expect-error -- an untyped grammar file (see above).
  sql: { load: () => import("prismjs/components/prism-sql.js"), requires: [] },
  // @ts-expect-error -- an untyped grammar file (see above).
  scss: { load: () => import("prismjs/components/prism-scss.js"), requires: ["css"] },
  // @ts-expect-error -- an untyped grammar file (see above).
  rust: { load: () => import("prismjs/components/prism-rust.js"), requires: [] },
  // @ts-expect-error -- an untyped grammar file (see above).
  go: { load: () => import("prismjs/components/prism-go.js"), requires: ["clike"] },
  // @ts-expect-error -- an untyped grammar file (see above).
  graphql: { load: () => import("prismjs/components/prism-graphql.js"), requires: [] },
};

/** The other names a language goes by, as Prism's own classes spell them. */
const ALIASES: Record<string, string> = {
  html: "markup",
  xml: "markup",
  svg: "markup",
  js: "javascript",
  ts: "typescript",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  md: "markdown",
  py: "python",
};
// Stryker restore all

let core: Promise<Prism> | undefined;
const loaded = new Map<string, Promise<void>>();

/**
 * The global `Prism` the grammar files extend. A page that already has Prism
 * keeps it — the grammars are added to it — so its own setup and plugins go on
 * working. Otherwise Prism's core is loaded, told it is `manual` first: without
 * that it highlights every `language-*` element on the page by itself,
 * Primitiv's or not.
 */
function prism(): Promise<Prism> {
  return (core ??= (async () => {
    const scope = globalThis as { Prism?: Partial<Prism> };
    if (typeof scope.Prism?.highlight === "function") return scope.Prism as Prism;
    // Stryker disable next-line ObjectLiteral,BooleanLiteral: jsdom never runs Prism's own pass, so only a browser shows what this prevents — the interop lab's "leaves the page's other language-* blocks alone" test pins it.
    scope.Prism = { ...scope.Prism, manual: true };
    // @ts-expect-error -- Prism's core file is untyped too; its export is Prism itself.
    const instance = (await import("prismjs/components/prism-core.js")).default as Prism;
    scope.Prism = instance;
    return instance;
  })());
}

/** Load `name`'s grammar after those it builds on, once however often it is asked for. */
function load(name: string): Promise<void> {
  let done = loaded.get(name);
  // Stryker disable next-line ConditionalExpression: equivalent — loading again re-imports a cached module, which does not run the grammar file twice.
  if (!done) {
    const { load: file, requires } = GRAMMARS[name]!;
    done = (async () => {
      for (const required of requires) await load(required);
      await file();
    })();
    loaded.set(name, done);
  }
  return done;
}

/** Prism and the grammar for `language`, or null for a language Primitiv does not highlight. */
export async function grammarFor(language: string): Promise<{ prism: Prism; grammar: Grammar; name: string } | null> {
  const name = ALIASES[language] ?? language;
  if (!Object.hasOwn(GRAMMARS, name)) return null;
  const instance = await prism();
  await load(name);
  return { prism: instance, grammar: instance.languages[name]!, name };
}
