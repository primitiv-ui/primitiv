import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
// Load the token layer first: it declares the canonical @layer order
// (reset → tokens → theme → base → variants → states) and imports the reset
// element styles. Pulling in App first would let the component stylesheets
// register @layer primitiv.base before this statement is seen, ordering the
// reset layer *after* base — which then zeroes the .primitiv-flow margins.
import "./styles/primitiv/tokens.css";
import { Shell } from "./Shell.tsx";

// Any sub-path deploy (the GitHub Pages docs build serves the app from
// /primitiv/kitchen-sink/ via KITCHEN_SINK_BASE) uses a hash router so deep
// links survive a hard refresh — GitHub Pages serves only the docs site's root
// 404.html, so it can't fall back to the kitchen-sink's index.html for
// path-based SPA routes. Keying off BASE_URL (derived from KITCHEN_SINK_BASE at
// build time) means the sub-path deploy always gets hash routing; dev (base
// "/") keeps clean BrowserRouter URLs. Mirrors the workbench.
const useHashRouter = import.meta.env.BASE_URL !== "/";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {useHashRouter ? (
      <HashRouter>
        <Shell />
      </HashRouter>
    ) : (
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Shell />
      </BrowserRouter>
    )}
  </StrictMode>,
);
