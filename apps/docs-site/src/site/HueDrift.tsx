"use client";

import type { CSSProperties } from "react";

import data from "@/content/hue-drift.generated.json";

import "./hue-drift.css";

/**
 * COLOUR-02 — two ten-step blue ramps, one drifting in hue and one holding.
 *
 * The one claim in section 5 a reader cannot verify from the proof sheet:
 * drift is invisible unless you see the alternative beside it. Every colour and
 * every hue here is the engine's (`colour-02-hue-drift.json`); nothing is
 * computed in this file.
 *
 * **The track underneath is doing all the work.** Without it these are two blue
 * ramps that look broadly similar and the reader shrugs. Three details make it
 * work, all of them findings from building this in Figma rather than choices:
 *
 * 1. **Both rows share ONE hue domain.** Scaling each to its own data would rig
 *    the comparison — the held row's ten identical hues would spread across the
 *    full width and prove the opposite.
 * 2. **The track is a painted hue sweep, not a rule.** A plain rule invites the
 *    eye to map a marker to the tile above it, a different quantity entirely:
 *    the held row's marker sits at 260°, which lands under the 300 tile, and the
 *    diagram read as broken. The sweep makes the axis explain itself.
 * 3. **The markers are semi-opaque, so coincident ones accumulate.** Ten stacked
 *    at full opacity look like one; at 0.55 the held row's single point reads
 *    dense and the drifting row's spread reads sparse. That is how the diagram
 *    states its case without the degree figures the brief forbids.
 *
 * **The swatches are meant to look similar, and pushing them apart was tried and
 * reverted.** Hue is invisible at both ends of a ten-step ramp — at step 50 the
 * real ramp's chroma is near zero, so a 14° shift moves no channel by more than
 * 2/255. Lifting chroma to compensate made the drifting row *more vivid* than
 * the real one, which argues the wrong case. That invisibility is the
 * phenomenon: drift goes unnoticed in real products precisely because it hides
 * where chroma cannot show it.
 */
const ALT =
  "Two ten-step blue ramps compared. The upper one drifts in hue across the " +
  "scale, shown by scattered markers on a hue track beneath it. The lower one, " +
  "Primitiv's own, holds a single hue, its markers stacked on one point.";

const { hueMin, hueMax } = data.track;

/** Where a hue sits on the shared track, 0–100%. */
const position = (hue: number) => ((hue - hueMin) / (hueMax - hueMin)) * 100;

/* The sweep as gradient stops. Built once — it is the same axis under both
   rows, which is the point of a shared domain. */
const sweep = `linear-gradient(to right, ${data.track.samples.join(", ")})`;

const Row = ({
  label,
  row,
}: {
  label: string;
  row: { readonly steps: readonly { step: string; hex: string; hue: number }[] };
}) => (
  <div className="docs-hue-row">
    <span className="docs-hue-label">{label}</span>
    {/* Flush, like the proof sheet: a gap would stop it reading as one scale. */}
    <div className="docs-hue-ramp">
      {row.steps.map((s) => (
        <span className="docs-hue-swatch" key={s.step} style={{ background: s.hex }} />
      ))}
    </div>
    <div className="docs-hue-track" style={{ backgroundImage: sweep }}>
      {row.steps.map((s) => (
        <span
          className="docs-hue-marker"
          key={s.step}
          style={{ "--docs-hue-at": `${position(s.hue)}%` } as CSSProperties}
        />
      ))}
    </div>
  </div>
);

export const HueDrift = () => (
  <figure className="docs-hue-drift" role="img" aria-label={ALT}>
    <Row label="drifting" row={data.drifting} />
    <Row label="held" row={data.held} />
    {/* The brief's own closing line. No degree figures anywhere on the diagram:
        the scatter is the argument, and a number would invite arithmetic
        instead of looking. */}
    <figcaption className="docs-hue-caption">
      The same ten steps. One of them is a family.
    </figcaption>
  </figure>
);
