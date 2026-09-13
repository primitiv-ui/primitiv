"use client";

import { Arrow } from "./Arrow";

import "./figure-chrome.css";
import "./family-figure.css";

/**
 * FAMILY-01 — the four parts, and what they all rest on.
 *
 * Three surface blocks over one full-width token band, with Harmoni feeding
 * that band from below. **The band is full width under all three on purpose**:
 * it is the thing they share, and the layout is the argument — a fourth box in
 * the row would say the tokens are a sibling rather than the foundation.
 *
 * Built against the frame `FAMILY-01 — desktop`, which stays the design record
 * (plan §6.0.29).
 *
 * The arrow runs UP from Harmoni into the band, because that is the direction
 * the dependency actually goes: Harmoni generates the colour that the tokens
 * carry, and nothing flows back. The closing caption is where the open-source
 * line is drawn, and it is the only place the paid product is named.
 */
const PARTS = [
  { name: "@primitiv-ui/react (headless)", gives: "behaviour and accessibility" },
  { name: "The registry (styled, copied to you)", gives: "behaviour, accessibility and the design" },
  { name: "The Figma library", gives: "the design, to work with" },
] as const;

export const Family01 = () => (
  <figure className="docs-figure docs-family">
    <ul className="docs-family__row" aria-label="The parts of Primitiv">
      {PARTS.map((part) => (
        <li className="docs-family__part" key={part.name}>
          <p className="docs-figure__panel docs-family__box">{part.name}</p>
          <p className="docs-figure__note docs-family__gives">{part.gives}</p>
        </li>
      ))}
    </ul>

    <p className="docs-figure__panel docs-figure__panel--accent docs-family__band">
      Design tokens: colour, spacing, type, density
    </p>

    <div className="docs-family__feed">
      <Arrow className="docs-figure__arrow--up" />
      <div className="docs-figure__panel docs-family__engine">
        <p className="docs-figure__heading">Harmoni</p>
        <p className="docs-figure__note">generates the colour</p>
      </div>
    </div>

    <figcaption className="docs-figure__caption docs-figure__caption--center">
      Open source (MIT): the components, the tokens, the CLI, the colour engine.
      Paid: the Harmoni Figma plugin.
    </figcaption>
  </figure>
);
