import { defineConfig } from "vitepress";
// @ts-expect-error - plain .mjs data module shared with the page generator
import { reactComponents, slugFor } from "./components.mjs";

/** Build the React sidebar, grouped exactly like packages/react/README.md. */
function reactSidebar() {
  const order: string[] = [];
  const byGroup = new Map<string, { text: string; link: string }[]>();
  for (const { name, group } of reactComponents as {
    name: string;
    group: string;
  }[]) {
    if (!byGroup.has(group)) {
      byGroup.set(group, []);
      order.push(group);
    }
    byGroup.get(group)!.push({ text: name, link: `/react/${slugFor(name)}` });
  }
  return order.map((group) => ({
    text: group,
    collapsed: true,
    items: byGroup.get(group)!,
  }));
}

export default defineConfig({
  base: "/primitiv/",
  title: "Primitiv",
  description:
    "Primitiv design system — headless React components and the Harmoni palette engine.",
  lang: "en-GB",
  // README includes carry repo-relative links that don't resolve as site
  // routes yet; tightening these is a post-v1 polish task.
  ignoreDeadLinks: true,
  head: [
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    [
      "link",
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
    ],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Asta+Sans:wght@300..800&family=Khand:wght@300;400;500;600;700&display=swap",
      },
    ],
    ["link", { rel: "icon", href: "/primitiv/favicon.svg", type: "image/svg+xml" }],
  ],
  themeConfig: {
    logo: { src: "/primitiv-logo.svg", alt: "Primitiv" },
    siteTitle: "Primitiv",
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "React", link: "/react/" },
      { text: "Harmoni", link: "/harmoni/" },
      // Lives in the same Pages deployment, served by the workbench build.
      { text: "Workbench", link: "/workbench/", target: "_self" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Guide",
          items: [
            { text: "Introduction", link: "/guide/" },
            { text: "Getting started", link: "/guide/getting-started" },
          ],
        },
      ],
      "/react/": [
        { text: "Overview", items: [{ text: "All components", link: "/react/" }] },
        ...reactSidebar(),
        {
          text: "Packages",
          items: [
            { text: "Icons", link: "/react/icons" },
            { text: "Tokens", link: "/react/tokens" },
          ],
        },
      ],
      "/harmoni/": [
        {
          text: "Harmoni",
          items: [
            { text: "Overview", link: "/harmoni/" },
            { text: "harmoni-core (Rust)", link: "/harmoni/core" },
            { text: "harmoni-wasm (JS/TS)", link: "/harmoni/wasm" },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/primitiv-ui/primitiv" },
    ],
    search: { provider: "local" },
    outline: { level: [2, 3] },
  },
});
