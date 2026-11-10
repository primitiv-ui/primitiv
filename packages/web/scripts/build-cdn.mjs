#!/usr/bin/env node
// The per-component browser files for pages with no build step (RFC 0033 §7.3):
// `dist/cdn/<component>.js` defines that component's elements and nothing else.
//
//   <script type="module"
//     src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/cdn/tabs.js"></script>
//
// One esbuild run over every `src/define/<component>.ts`, with code splitting,
// so what components share (@primitiv-ui/core) lands once in `dist/cdn/chunks/`
// and each component file imports it by a relative URL. A page loading two
// components fetches the shared code once, and the relative imports resolve on
// any static host or CDN with no import map. `dist/primitiv-web.js` remains the
// everything-in-one-file option.
import { readdirSync, readFileSync } from "node:fs";
import { build } from "esbuild";

// esbuild splits by FILE: a file any two entries reach goes in a shared chunk.
// Every component imports `@primitiv-ui/core`'s one barrel, which reaches every
// policy in core, so without this each component's page would download every
// other component's policy too, and the shared chunk would grow with each one.
// So each `import { … } from "@primitiv-ui/core"` in the web source is pointed
// at the core files that define those names, read from core's barrel: a
// component's file then reaches only the policy it uses, and only what two
// components really share is split out. A name the barrel does not map fails
// the build rather than quietly pulling the barrel back in.
const coreIndex = new URL("../../core/src/index.ts", import.meta.url);
const coreFiles = new Map();
for (const [, names, from] of readFileSync(coreIndex, "utf8").matchAll(/export\s*\{([^}]*)\}\s*from\s*"([^"]+)"/g)) {
  for (const name of names.split(",").map((part) => part.trim()).filter((part) => part && !part.startsWith("type "))) {
    coreFiles.set(name, new URL(from, coreIndex).pathname);
  }
}
const directCoreImports = {
  name: "direct-core-imports",
  setup(context) {
    context.onLoad({ filter: /packages\/web\/src\/.*\.ts$/ }, ({ path }) => {
      const source = readFileSync(path, "utf8");
      const contents = source.replace(/import\s*\{([^}]*)\}\s*from\s*"@primitiv-ui\/core";/g, (_, names) => {
        const byFile = new Map();
        for (const name of names.split(",").map((part) => part.trim()).filter((part) => part && !part.startsWith("type "))) {
          const file = coreFiles.get(name);
          if (!file) throw new Error(`${path}: @primitiv-ui/core's barrel does not export ${name}`);
          byFile.set(file, [...(byFile.get(file) ?? []), name]);
        }
        return [...byFile].map(([file, used]) => `import { ${used.join(", ")} } from ${JSON.stringify(file)};`).join("\n");
      });
      return { contents, loader: "ts" };
    });
  },
};

const define = new URL("../src/define/", import.meta.url);
const components = readdirSync(define).filter((file) => file.endsWith(".ts") && file !== "index.ts");

await build({
  entryPoints: components.map((file) => new URL(file, define).pathname),
  outdir: new URL("../dist/cdn/", import.meta.url).pathname,
  chunkNames: "chunks/[name]-[hash]",
  bundle: true,
  splitting: true,
  format: "esm",
  minify: true,
  target: "es2022",
  plugins: [directCoreImports],
});
console.log(`dist/cdn: ${components.map((file) => file.replace(/\.ts$/, ".js")).join(", ")}`);
