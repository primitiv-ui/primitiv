#!/usr/bin/env node
// Type-check every generated registry wrapper against the real
// `@primitiv-ui/react` types.
//
// Why this exists: the `registry/components/**/*.tsx` wrappers are
// `include_str!`'d into the CLI binary as opaque strings (see RELEASING.md
// "embedded-registry gotcha"), so nothing ever type-checks them. Two type
// bugs shipped because of that gap: `interface XProps extends <union>` (a
// TS2312 error TypeScript can't widen) and a `Ref<HTMLDivElement>` leaking
// from `ComponentProps<"div">` into `Tabs.Root`, whose ref is the imperative
// handle (D58).
//
// How it works: the wrappers can only resolve React's types when they sit
// inside the `@primitiv-ui/react` package's module scope (pnpm doesn't hoist
// `@types/react` anywhere a file under `registry/` can reach). So we copy the
// wrappers + recipes into a temp dir under `packages/react`, point
// `@primitiv-ui/react` at the package source, stub `class-variance-authority`
// (the recipes' only external import — not what we're checking), and run
// `tsc --noEmit`. Exit code propagates.
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const reactPkg = join(repoRoot, "packages", "react");
const workDir = join(reactPkg, ".registry-typecheck");
const tsc = join(reactPkg, "node_modules", ".bin", "tsc");

rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });

try {
  // Flatten every component's TS/TSX into ONE dir, mirroring how `add` installs
  // components (all flat under src/components/*). Each wrapper's `./<name>.recipe`
  // import resolves as a sibling — and so does a wrapper that imports another
  // component: code-block's copy control does `import { Button } from "./button"`,
  // which must resolve here exactly as it does in the consumer. Filenames are
  // unique across components (<name>.tsx / <name>.recipe.ts), so flattening is
  // collision-free; only .ts/.tsx are type-checked (css/scss/json/md are skipped).
  const componentsSrc = join(repoRoot, "registry", "components");
  const componentsDst = join(workDir, "components");
  mkdirSync(componentsDst, { recursive: true });
  for (const entry of readdirSync(componentsSrc, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(componentsSrc, entry.name);
    for (const file of readdirSync(dir)) {
      if (file.endsWith(".ts") || file.endsWith(".tsx")) {
        cpSync(join(dir, file), join(componentsDst, file));
      }
    }
  }

  writeFileSync(
    join(workDir, "cva-stub.d.ts"),
    `declare module "class-variance-authority" {\n` +
      `  export type VariantProps<T> = T extends (props?: infer P) => string ? NonNullable<P> : never;\n` +
      `  export function cva(base?: string, config?: unknown): (props?: Record<string, unknown>) => string;\n` +
      `}\n`,
  );

  // `code-block` highlights with prism-react-renderer. Stub its surface (not
  // what we're checking) so the wrapper resolves. The stub is a committed file
  // shared with scripts/docs-data/extract-docs-data.mjs rather than a string
  // built here, so a change to it cannot fix one caller and leave the other
  // behind — which is exactly what happened while this script stubbed and the
  // extractor resolved through apps/docs-site/node_modules instead.
  cpSync(
    join(repoRoot, "scripts", "stubs", "prism-react-renderer.d.ts"),
    join(workDir, "prism-stub.d.ts"),
  );

  writeFileSync(
    join(workDir, "tsconfig.json"),
    JSON.stringify(
      {
        extends: "../tsconfig.json",
        compilerOptions: {
          types: [],
          noUnusedLocals: false,
          noUnusedParameters: false,
          paths: {
            "@primitiv-ui/react": ["../src/index.ts"],
            "class-variance-authority": ["./cva-stub.d.ts"],
            "prism-react-renderer": ["./prism-stub.d.ts"],
          },
        },
        include: [
          "components/**/*.ts",
          "components/**/*.tsx",
          "cva-stub.d.ts",
          "prism-stub.d.ts",
        ],
      },
      null,
      2,
    ),
  );

  execFileSync(tsc, ["-p", join(workDir, "tsconfig.json")], {
    stdio: "inherit",
    cwd: reactPkg,
  });
  console.log("✓ registry wrappers type-check against @primitiv-ui/react");
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
