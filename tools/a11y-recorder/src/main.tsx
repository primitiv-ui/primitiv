/*
 * A11Y-01 recorder — entry point.
 *
 * Pulls the token layer, the base element styles and the registry stylesheets
 * for exactly the components the scene uses, in the order a consumer's app
 * would: `tokens.css` first (it @imports primitiv-base.css and declares the
 * @layer order), then each component sheet.
 */
import { createRoot } from "react-dom/client";
import "@tokens/tokens.css";
import "@registry/card/styles.css";
import "@registry/field/styles.css";
import "@registry/input/styles.css";
import "@registry/select/styles.css";
import "@registry/checkbox/styles.css";
import "@registry/switch/styles.css";
import "@registry/button/styles.css";
import "@registry/kbd/styles.css";
import "./scene.css";
import { Scene } from "./Scene";

// Theme and density come off the query string so one build records every
// variant — `?theme=dark` is the fourth commitment's proof, and `?density=`
// exists because the same sequence at another density is a free second image.
const params = new URLSearchParams(window.location.search);
const root = document.documentElement;
root.dataset.theme = params.get("theme") ?? "light";
root.dataset.density = params.get("density") ?? "comfortable";

createRoot(document.getElementById("root")!).render(<Scene />);
