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
import "@registry/code-block/styles.css";
import "./scene.css";
import { SCENES } from "./frames.mjs";
import { Scene } from "./Scene";
import { CodeOne } from "./CodeOne";

// Scene, frame, theme and density all come off the query string so one build
// records every variant — `?theme=dark` is A11Y-01's fourth-commitment proof,
// `?frame=mobile` is its below-48rem composition, and `?scene=` picks which
// illustration is on screen.
const params = new URLSearchParams(window.location.search);
const root = document.documentElement;
root.dataset.theme = params.get("theme") ?? "light";
root.dataset.density = params.get("density") ?? "comfortable";

const scene = (params.get("scene") ?? "a11y-01") as keyof typeof SCENES;
const frame = params.get("frame") ?? "desktop";
root.dataset.scene = scene;
root.dataset.frame = frame;

const config = SCENES[scene].frames[frame as keyof (typeof SCENES)[typeof scene]["frames"]];

const app = document.getElementById("root")!;
if (scene === "code-01") {
  createRoot(app).render(<CodeOne />);
} else {
  const { size, controls, options, rowGap } = config;
  root.style.setProperty("--scene-row-gap", `var(--primitiv-space-space-${rowGap})`);
  createRoot(app).render(<Scene size={size} controls={controls} options={options} />);
}
