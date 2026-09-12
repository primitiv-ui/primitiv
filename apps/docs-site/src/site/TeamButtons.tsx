"use client";

import type { CSSProperties } from "react";

import { Button } from "@/components/button";

import data from "@/content/team-buttons.generated.json";

import "./team-buttons.css";

/**
 * PROBLEM-01 — three teams' "Save changes" buttons, drifted.
 *
 * The brief's rhetorical job: make drift VISIBLE. Everyone nods along to
 * "inconsistent components" in the abstract and pictures something obvious; the
 * real thing is subtle, which is exactly why it survives review and ships.
 *
 * **These are real registry Buttons.** The brief's own `assets` calls for
 * "button (registry), primary variant, size md, deliberately mis-configured per
 * instance via inline overrides", and in code that is literally what this is —
 * one component, three teams' worth of hand-tuning, through the custom
 * properties the styled surface already publishes. A picture of three buttons
 * would make the same point less honestly.
 *
 * **The subtlety is a measured number, not a judgement.** The engine places
 * each colour in OkLCH off the brand seed and reports the pairwise Oklab ΔE;
 * the widest pair here is {@link data.widestDeltaE}, inside the brief's
 * 0.02–0.04 "edge of perceptible" band, and the generator FAILS if it drifts
 * above the ceiling. None of the three is the brand colour — the point is that
 * they were guessed rather than derived.
 *
 * **Nothing is annotated, deliberately.** No callouts, no measurement lines, no
 * "before and after", and no correct fourth button: the section is about the
 * cost of drift, not yet about the fix. In real life nothing labels the
 * differences either, which is the whole argument.
 */
const label = (weight: string) =>
  weight === "SemiBold"
    ? "var(--primitiv-font-weight-semibold)"
    : "var(--primitiv-font-weight-medium)";

export const TeamButtons = () => (
  <div
    className="docs-team-buttons"
    role="img"
    aria-label={
      'Three "Save changes" buttons from three different teams, each with a ' +
      "slightly different colour, height and corner radius."
    }
  >
    {data.buttons.map((b) => (
      <div className="docs-team-button" key={b.team}>
        <Button
          /* Overriding the component's own knobs, which is exactly how this
             happens in a real codebase — nobody forks the button, they tweak it
             in place until it looks right on their screen. */
          style={
            {
              "--primitiv-button-bg": b.hex,
              "--primitiv-button-height": `${b.height}px`,
              "--primitiv-button-radius": `${b.radius}px`,
              "--primitiv-button-padding-inline": `${b.paddingInline}px`,
              "--primitiv-button-font-weight": label(b.labelWeight),
            } as CSSProperties
          }
        >
          Save changes
        </Button>
        {/* Team names, not component names. That is what makes this
            organisational rather than technical — the register the whole
            section is written in, and the brief's own craft note. */}
        <span className="docs-team-caption">{b.team}</span>
      </div>
    ))}
  </div>
);
