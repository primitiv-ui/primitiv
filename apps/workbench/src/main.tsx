import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";

import App from "./App.tsx";

import "./index.css";
// The generated Primitiv token layer (custom-property defaults), ambient for
// every contract-styled example. Each example imports only its own registry
// styles.css, which resolves against these.
import "./primitiv-tokens.css";

// Any sub-path deploy (the GitHub Pages build serves the app from
// /primitiv/workbench/ via WORKBENCH_BASE) uses a hash router so deep links
// survive a hard refresh — GitHub Pages only serves one root 404.html (the docs
// site's), so it can't fall back to the workbench's index.html for path-based
// SPA routes. Keying off BASE_URL — which vite.config derives from WORKBENCH_BASE
// at build time — rather than a separate flag means the sub-path deploy always
// gets hash routing. Dev (base "/") keeps clean BrowserRouter URLs.
const useHashRouter = import.meta.env.BASE_URL !== "/";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {useHashRouter ? (
      <HashRouter>
        <App />
      </HashRouter>
    ) : (
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <App />
      </BrowserRouter>
    )}
  </StrictMode>,
);
