import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import "./custom.css";

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp() {
    if (typeof window === "undefined") return;

    // Reload safety net. A hard refresh of a *path-based* workbench deep link
    // (e.g. /primitiv/workbench/plugin-frame) has no file on GitHub Pages and
    // falls through to this docs 404.html. Bounce it into the workbench's hash
    // route so the SPA restores the page instead of showing the VitePress 404.
    // (Hash deep links never reach here — their path is always /workbench/.)
    const workbenchRoot = `${import.meta.env.BASE_URL}workbench/`;
    const { pathname, search } = window.location;
    if (
      pathname.startsWith(workbenchRoot) &&
      pathname.length > workbenchRoot.length
    ) {
      const route = pathname.slice(workbenchRoot.length);
      window.location.replace(`${workbenchRoot}#/${route}${search}`);
      return;
    }

    // The bundled workbench (/primitiv/workbench/) is a separate static app, not
    // a VitePress route. VitePress's router intercepts every same-origin link on
    // a window capture-phase listener and would render its own 404 — UNLESS the
    // anchor carries a `target` attribute, in which case it bails out (the same
    // reason the nav "Workbench" link already works). So tag every workbench
    // link with target="_self" to force a real page load into the app.
    //
    // A MutationObserver re-applies this after hydration and every client
    // navigation, so it's robust regardless of render timing.
    const workbenchPrefix = `${import.meta.env.BASE_URL}workbench`;

    const tagWorkbenchLinks = () => {
      document
        .querySelectorAll<HTMLAnchorElement>("a[href]")
        .forEach((anchor) => {
          const href = anchor.getAttribute("href");
          if (
            href &&
            href.startsWith(workbenchPrefix) &&
            !anchor.hasAttribute("target")
          ) {
            anchor.setAttribute("target", "_self");
          }
        });
    };

    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        tagWorkbenchLinks();
      });
    };

    new MutationObserver(schedule).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    schedule();
  },
};

export default theme;
