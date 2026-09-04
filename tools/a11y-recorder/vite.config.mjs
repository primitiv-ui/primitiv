/*
 * Vite config for the A11Y-01 recorder.
 *
 * This tool is deliberately OUTSIDE the pnpm workspace and has no
 * `node_modules` of its own — adding one would mean a lockfile entry and an
 * install step for something that only ever runs to produce a video. Instead
 * every runtime dependency is aliased by absolute path into the store that
 * `packages/react` already has installed, and vite itself is invoked from
 * `packages/react/node_modules/.bin/vite`.
 *
 * `dedupe` is not enough on its own here (the aliases below already collapse
 * every specifier to one copy), but it is kept because `@primitiv-ui/react` is
 * consumed as SOURCE — the same reason the kitchen-sink's config gives for it:
 * two React copies produce "Cannot read properties of null (reading
 * 'useContext')" the moment a context provider crosses the boundary.
 *
 * The React surface is the workspace source, and the styled surface is the
 * registry as it ships — so what gets recorded is the code a consumer installs,
 * not a re-creation of it.
 */
import { fileURLToPath } from "node:url";

const at = (p) => fileURLToPath(new URL(p, import.meta.url));

export default {
  root: at("."),
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@primitiv-ui/react": at("../../packages/react/src/index.ts"),
      "@primitiv-ui/icons": at("../../packages/icons/src/index.ts"),
      "@registry": at("../../registry/components"),
      "@tokens": at("../../apps/docs-site/src/styles/primitiv"),
      react: at("../../packages/react/node_modules/react"),
      "react-dom": at("../../packages/react/node_modules/react-dom"),
      "class-variance-authority": at(
        "../../packages/react/node_modules/class-variance-authority",
      ),
    },
  },
  // No @vitejs/plugin-react: nothing here needs fast-refresh, and esbuild's
  // automatic runtime compiles the JSX on its own.
  esbuild: { jsx: "automatic" },
  optimizeDeps: {
    // React and its JSX runtimes are CJS. Aliasing them by absolute path skips
    // the dependency scan that would normally find them, so they are named
    // explicitly — without this the page dies on "does not provide an export
    // named 'jsxDEV'".
    include: [
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom",
      "react-dom/client",
      "class-variance-authority",
    ],
  },
  server: { host: "127.0.0.1", port: 5199, strictPort: true, fs: { strict: false } },
};
