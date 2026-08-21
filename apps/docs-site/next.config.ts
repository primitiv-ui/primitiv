import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");

/*
 * Sub-path deploys: GitHub Pages serves the docs under /primitiv/, and the
 * sibling apps already follow this pattern (KITCHEN_SINK_BASE, WORKBENCH_BASE).
 * Unset in dev, so local URLs stay at the root.
 */
const basePath = process.env.DOCS_SITE_BASE_PATH;

const nextConfig: NextConfig = {
  /*
   * Fully static output — every route is prerendered to HTML at build time and
   * the result is a directory of files with no Node server.
   *
   * Set UNCONDITIONALLY rather than only for the deploy, deliberately: it makes
   * the constraint fail fast. If someone reaches for a route handler,
   * middleware, ISR or a dynamic API, the build breaks here rather than working
   * locally and then silently 404ing on GitHub Pages.
   *
   * Note this is compatible with the `"use client"` on every page — a client
   * component is still prerendered to HTML and then hydrated, so the static
   * export contains the full semantic markup (which is what makes the a11y and
   * SEO story work). `"use client"` is a hydration boundary, not CSR.
   */
  output: "export",

  /*
   * Image Optimization needs a server, which `output: "export"` does not have.
   * Any <Image> must therefore be pre-sized/pre-optimised at source.
   */
  images: { unoptimized: true },

  /*
   * Emits `components/button/index.html` rather than `components/button.html`,
   * which is what lets a static host resolve `/components/button/` (and a hard
   * refresh on a deep link) without per-route rewrite rules.
   */
  trailingSlash: true,

  ...(basePath ? { basePath, assetPrefix: basePath } : {}),

  /*
   * @primitiv-ui/react and @primitiv-ui/icons ship RAW TypeScript — their
   * package `exports` resolve to `./src/index.ts` and there is no build step
   * (`files: ["src"]`). A consumer has to compile them itself, so these are not
   * optional: without them every import fails on the first untranspiled .ts.
   */
  transpilePackages: ["@primitiv-ui/react", "@primitiv-ui/icons"],

  /*
   * Both are `link:` deps resolving to ../../packages/*, i.e. OUTSIDE this
   * app's directory. Next needs the real root it may read from, or file tracing
   * stops at the app boundary and treats the symlinked source as missing.
   */
  outputFileTracingRoot: repoRoot,

  typescript: {
    // A type error here is a real defect on a docs site for a typed library.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
