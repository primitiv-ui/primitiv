import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Load the token layer first: it declares the canonical @layer order
// (reset → tokens → theme → base → variants → states) and imports the reset
// element styles. Pulling in App first would let the component stylesheets
// register @layer primitiv.base before this statement is seen, ordering the
// reset layer *after* base — which then zeroes the .primitiv-flow margins.
import "./styles/primitiv/tokens.css";
import { App } from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
