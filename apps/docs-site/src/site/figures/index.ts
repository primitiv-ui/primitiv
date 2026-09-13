import type { ComponentType } from "react";

import { A11yC01 } from "./A11yC01";
import { Cli01 } from "./Cli01";
import { Compose01 } from "./Compose01";
import { DensityC01 } from "./DensityC01";
import { DensityC02 } from "./DensityC02";
import { Family01 } from "./Family01";
import { FigmaP02 } from "./FigmaP02";
import { Start01 } from "./Start01";

/**
 * The content-page figures, keyed by the brief id the Figma frames carry.
 *
 * **These replace raster illustrations, one at a time** (plan §6.0.29). A `gap`
 * block in the page data names a brief id; `ContentIllustration` renders a
 * figure from this map when there is one and falls back to the exported PNGs
 * when there is not, so the ten ids migrate independently and the page never
 * has a hole in it.
 *
 * Why the DOM at all, when forty approved PNGs already exist: they are drawings
 * of things the design system does natively, rasterised. Small text in a PNG
 * reads soft beside the browser-rendered text next to it at any export scale;
 * a figure's type is the page's own type. And a figure follows the theme, the
 * density and a palette regeneration for free, where a raster needs a human to
 * re-export four files.
 *
 * The Figma frames on "Docs Site — Content illustrations" remain the DESIGN
 * RECORD — the same relationship a component set has to its registry component.
 * Build each figure against its frame, not against this file's prose.
 *
 * **Every value is a token.** A figure carries no colour, length, radius or
 * duration of its own: its stylesheet resolves `--primitiv-*`, or names a
 * `--docs-*` constant once where the system genuinely has none.
 * `scripts/check-tokens.mjs` enforces that, and rule 4 additionally forbids
 * inline styling here beyond setting a custom property from data.
 */
export const FIGURES: Record<string, ComponentType> = {
  "A11Y-C01": A11yC01,
  "CLI-01": Cli01,
  "COMPOSE-01": Compose01,
  "DENSITY-C01": DensityC01,
  "DENSITY-C02": DensityC02,
  "FAMILY-01": Family01,
  "FIGMA-P02": FigmaP02,
  "START-01": Start01,
};

export const hasFigure = (id: string): boolean => id in FIGURES;
