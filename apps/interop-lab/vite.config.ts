import { fileURLToPath } from "node:url";

import angular from "@analogjs/vite-plugin-angular";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import { defineConfig, type Plugin } from "vite";

import { fragments } from "./src/htmx-fragments.ts";

const workspace = (path: string) => fileURLToPath(new URL(`../../packages/${path}`, import.meta.url));

/** Stands in for the server an HTMX page talks to: GET /fragments/<name>. */
function htmxFragments(): Plugin {
  return {
    name: "interop-lab:htmx-fragments",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const match = request.url?.match(/^\/fragments\/([a-z-]+)/);
        const body = match ? fragments[match[1]] : undefined;
        if (body === undefined) return next();
        response.setHeader("Content-Type", "text/html");
        response.end(typeof body === "function" ? body(request.url ?? "") : body);
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    // Vue must leave every primitiv- tag to the browser as a custom element.
    vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("primitiv-") } } }),
    svelte(),
    // Angular's own compiler, ahead of time, over the one program in its tsconfig.
    angular({ tsconfig: "./tsconfig.angular.json" }),
    htmxFragments(),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "vue", "svelte"],
    // The lab tests the workspace SOURCE, so it needs no release to exercise
    // unpublished work (the kitchen-sink does the same for @primitiv-ui/react).
    // The subpaths mirror packages/web's `exports` map.
    alias: [
      { find: /^@primitiv-ui\/web\/define\/tabs$/, replacement: workspace("web/src/define/tabs.ts") },
      { find: /^@primitiv-ui\/web\/define\/accordion$/, replacement: workspace("web/src/define/accordion.ts") },
      { find: /^@primitiv-ui\/web\/define\/collapsible$/, replacement: workspace("web/src/define/collapsible.ts") },
      { find: /^@primitiv-ui\/web\/define\/modal$/, replacement: workspace("web/src/define/modal.ts") },
      { find: /^@primitiv-ui\/web\/define$/, replacement: workspace("web/src/define/index.ts") },
      { find: /^@primitiv-ui\/web\/svelte$/, replacement: workspace("web/src/frameworks/svelte.ts") },
      { find: /^@primitiv-ui\/web\/tabs$/, replacement: workspace("web/src/tabs/index.ts") },
      { find: /^@primitiv-ui\/web$/, replacement: workspace("web/src/index.ts") },
      { find: /^@primitiv-ui\/core$/, replacement: workspace("core/src/index.ts") },
    ],
  },
  server: { port: 4320, strictPort: true },
});
