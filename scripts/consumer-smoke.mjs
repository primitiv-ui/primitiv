#!/usr/bin/env node
// Consumer smoke test: does a brand-new app build once it depends on the
// packages exactly as npm would serve them?
//
// Packs @primitiv-ui/react and @primitiv-ui/icons with `pnpm pack` (so
// `publishConfig`, `files` and `prepack` all apply, as on a real publish),
// scaffolds a fresh app from each supported framework's own starter with its
// default settings, installs the tarballs, imports from both packages, and
// runs the app's own `npm run build` — type-check included. A starter's
// defaults are the point: a consumer who just ran `npm create vite` has
// `verbatimModuleSyntax` on, and `create-next-app` uses Turbopack, neither of
// which our own workspace apps exercise.
//
// The `node` target imports both packages with no bundler at all — what Vite
// SSR does (it externalises node_modules), as do test runners and scripts.
//
// Usage: node scripts/consumer-smoke.mjs [vite|next|node]...   (default: all)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const packages = ["react", "icons"];

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: "inherit", env: { ...process.env, CI: "1" } });

// Rendered from the page itself — in Next that is a Server Component, the
// default a consumer starts from, so every import has to cross the RSC
// boundary. React cannot dot into a client reference from the server, so a
// Server Component uses a compound's flat exports (`TabsRoot`, not
// `Tabs.Root`) — the documented RSC form, exercised here.
const usage = `import { Button, TabsContent, TabsList, TabsRoot, TabsTrigger } from "@primitiv-ui/react";
import { Check } from "@primitiv-ui/icons";

export function Smoke() {
  return (
    <TabsRoot defaultValue="one">
      <TabsList label="Smoke">
        <TabsTrigger value="one">One</TabsTrigger>
      </TabsList>
      <TabsContent value="one">
        <Button>
          <Check aria-hidden /> Save
        </Button>
      </TabsContent>
    </TabsRoot>
  );
}
`;

const frameworks = {
  vite: {
    create: (dir) =>
      run("npm", ["create", "-y", "vite@latest", "app", "--", "--template", "react-ts", "--no-interactive"], dir),
    usageFile: "src/Smoke.tsx",
    page: ["src/App.tsx", `import { Smoke } from "./Smoke";\n\nexport default function App() {\n  return <Smoke />;\n}\n`],
  },
  next: {
    create: (dir) =>
      run(
        "npx",
        ["-y", "create-next-app@latest", "app", "--ts", "--app", "--eslint", "--no-tailwind", "--src-dir",
          "--import-alias", "@/*", "--use-npm", "--yes"],
        dir,
      ),
    usageFile: "src/app/Smoke.tsx",
    page: ["src/app/page.tsx", `import { Smoke } from "./Smoke";\n\nexport default function Page() {\n  return <Smoke />;\n}\n`],
  },
  node: {
    create: (dir) => {
      mkdirSync(join(dir, "app"));
      writeFileSync(join(dir, "app", "package.json"), JSON.stringify({ name: "app", private: true, type: "module" }));
      run("npm", ["install", "react", "react-dom"], join(dir, "app"));
    },
    build: (app) => {
      const script = `import("@primitiv-ui/react").then(r => import("@primitiv-ui/icons").then(i => {
        if (typeof r.Button === "undefined" || typeof i.Check === "undefined") throw new Error("missing exports");
      }))`;
      run("node", ["--input-type=module", "-e", script], app);
    },
  },
};

const requested = process.argv.slice(2);
const selected = requested.length ? requested : Object.keys(frameworks);

const work = mkdtempSync(join(tmpdir(), "primitiv-consumer-"));
const tarballs = join(work, "tarballs");
for (const pkg of packages) {
  run("pnpm", ["pack", "--pack-destination", tarballs], join(root, "packages", pkg));
}
const packed = readdirSync(tarballs).map((file) => join(tarballs, file));

const failures = [];
for (const name of selected) {
  const framework = frameworks[name];
  if (!framework) throw new Error(`unknown framework "${name}" — expected one of ${Object.keys(frameworks).join(", ")}`);
  const dir = mkdtempSync(join(work, `${name}-`));
  console.log(`\n::group::consumer smoke — ${name}`);
  try {
    framework.create(dir);
    const app = join(dir, "app");
    run("npm", ["install", ...packed], app);
    if (framework.build) {
      framework.build(app);
    } else {
      writeFileSync(join(app, framework.usageFile), usage);
      writeFileSync(join(app, framework.page[0]), framework.page[1]);
      run("npm", ["run", "build"], app);
    }
  } catch {
    failures.push(name);
  }
  console.log("::endgroup::");
}

if (failures.length) {
  console.error(`\nconsumer smoke FAILED for: ${failures.join(", ")}`);
  process.exit(1);
}
console.log(`\nconsumer smoke passed for: ${selected.join(", ")}`);
