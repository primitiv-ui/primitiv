import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";

import App from "./App.tsx";

import "./index.css";

// The GitHub Pages build (VITE_HASH_ROUTER=true) uses a hash router so deep
// links survive a hard refresh — GitHub Pages only serves one root 404.html
// (the docs site's), so it can't fall back to the workbench's index.html for
// path-based SPA routes. Dev keeps clean BrowserRouter URLs.
const useHashRouter = import.meta.env.VITE_HASH_ROUTER === "true";

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
