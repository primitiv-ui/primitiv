import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import "./custom.css";

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp() {
    if (typeof window === "undefined") return;

    // The bundled workbench (/primitiv/workbench/) is a separate static app, not
    // a VitePress route. VitePress's router intercepts every same-origin "html"
    // link and would render its own 404 for these. Catch such clicks in the
    // capture phase and stop propagation so the browser performs a real
    // navigation into the workbench instead. Covers every workbench link on the
    // site (nav, hero, features, prose, per-component deep links).
    const workbenchPrefix = `${import.meta.env.BASE_URL}workbench`;
    document.addEventListener(
      "click",
      (event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        const anchor = (event.target as HTMLElement | null)?.closest?.("a");
        const href = anchor?.getAttribute("href");
        if (href && href.startsWith(workbenchPrefix)) {
          event.stopImmediatePropagation();
        }
      },
      true,
    );
  },
};

export default theme;
