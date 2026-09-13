"use client";

import { useId } from "react";

import "./figure-chrome.css";
import "./parity-figure.css";

/**
 * FIGMA-P02 — one source, two places it can be used.
 *
 * A single definition branching into two arms of identical weight. **Neither
 * arm is the source and no arrow runs BETWEEN them** — that is the whole point,
 * and it is the mistake the figure exists to prevent: Figma does not export to
 * CSS and CSS does not import from Figma. Both read the same definitions, which
 * is why the same name appears on both sides.
 *
 * Built against the frame `FIGMA-P02 — desktop`, which stays the design record
 * (plan §6.0.29).
 *
 * The swatch beside the Figma token is a real token-coloured square rather than
 * a picture of one, so it tracks a palette regeneration like everything else —
 * and it is `aria-hidden`, because the name beside it already says which role
 * it is.
 */
export const FigmaP02 = () => {
  const id = useId();

  return (
    <figure className="docs-figure docs-parity">
      <div className="docs-figure__panel docs-figure__panel--accent docs-parity__source" id={id}>
        <p className="docs-figure__heading">Token definitions</p>
        <p className="docs-figure__note">one source, in the repository</p>
      </div>

      {/* The fork. One path with a stem and two shoulders, so the split is a
          single shape rather than three that could fall out of alignment.
          The shoulders sit at 25% and 75% of the viewBox — the CENTRES of the
          two arms below. A first pass put them at 10% and 90%, which drew a
          bar wider than the thing it was branching into. */}
      <svg
        className="docs-parity__fork"
        viewBox="0 0 200 40"
        preserveAspectRatio="none"
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M100 0 V20 M50 20 H150 M50 20 V40 M150 20 V40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <ul className="docs-parity__arms" aria-labelledby={id}>
        <li className="docs-parity__arm">
          <p className="docs-figure__panel docs-parity__box">Figma variables</p>
          <p className="docs-figure__chip docs-parity__token">
            <span className="docs-parity__swatch" aria-hidden="true" />
            action/primary/default
          </p>
        </li>
        <li className="docs-parity__arm">
          <p className="docs-figure__panel docs-parity__box">CSS custom properties</p>
          <p className="docs-figure__chip docs-parity__token">--primitiv-action-primary-default</p>
        </li>
      </ul>

      <figcaption className="docs-figure__caption docs-figure__caption--center">
        Same name. Same value. Two places it can be used.
      </figcaption>
    </figure>
  );
};
