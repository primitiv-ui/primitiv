// What the picked hue can and cannot do as a ramp (RFC 0027 §6).
//
// The picker already shows a designer *what a colour is*. It has never shown
// them what that colour can do once the engine builds ten steps out of it — so
// the fact that a cyan mutes at the light end, or that a yellow holds its hue
// only in Display-P3, was discovered months later by eye, if ever.
//
// It states constraints; it does not score the colour (RFC 0027 D5). A hue that
// mutes in sRGB is not a bad hue, it is a hue with a known consequence, and the
// job here is to make that consequence visible *before* the decision.

import { useMemo } from "react";

import { assess_brand_ramp, chroma_headroom } from "harmoni-wasm";

import { summariseReach } from "./rampReach";
import type { RampReach } from "./rampReach";
import type { OklchValue } from "./types";

export type RampFeedbackProps = {
  value: OklchValue;
};

type Reading = {
  srgb: RampReach;
  p3: RampReach;
  coverage: { aaa: number; aa: number; fail: number };
};

const percent = (fraction: number) => `${Math.round(fraction * 100)}%`;

/**
 * Asks the engine what this colour's ramp would look like in both gamuts.
 * Returns `null` when the engine cannot answer — a failed measurement must not
 * be rendered as a measured zero.
 */
function read({ l, c, h }: OklchValue): Reading | null {
  try {
    return {
      srgb: summariseReach(chroma_headroom(l, c, h, "Srgb").steps),
      p3: summariseReach(chroma_headroom(l, c, h, "DisplayP3").steps),
      coverage: assess_brand_ramp(l, c, h, "Srgb").foreground_coverage,
    };
  } catch {
    return null;
  }
}

export function RampFeedback({ value }: RampFeedbackProps) {
  const reading = useMemo(() => read(value), [value]);

  if (!reading) return null;

  const { srgb, p3, coverage } = reading;
  const limited = srgb.steps.filter((step) => step.limited);
  const widerInP3 = p3.overall > srgb.overall;

  return (
    <section className="ramp-feedback" aria-label="What this colour can do as a ramp">
      <div className="ramp-feedback__block" data-testid="ramp-feedback-chroma">
        <h3 className="ramp-feedback__heading">Chroma headroom</h3>
        {limited.length === 0 ? (
          <p className="ramp-feedback__note">
            sRGB has room for every step of this ramp at the chroma it asks for.
          </p>
        ) : (
          <>
            <p className="ramp-feedback__note">
              sRGB cannot hold {limited.length === 1 ? "one step" : `${limited.length} steps`} of
              this ramp at full strength. Those steps render muted:
            </p>
            <ul className="ramp-feedback__steps" aria-label="Steps short of their requested chroma">
              {limited.map((step) => (
                <li className="ramp-feedback__step" key={step.label}>
                  <span className="ramp-feedback__step-label">{step.label}</span>
                  <span
                    className="ramp-feedback__bar"
                    style={{ ["--reach" as string]: String(step.reach) }}
                  />
                  <span className="ramp-feedback__step-reach">{percent(step.reach)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="ramp-feedback__block" data-testid="ramp-feedback-gamut">
        <h3 className="ramp-feedback__heading">Gamut</h3>
        <p className="ramp-feedback__note">
          In sRGB this ramp reaches {percent(srgb.overall)} of the chroma it asks for; in
          Display-P3, {percent(p3.overall)}.{" "}
          {widerInP3
            ? "Display-P3 has more room for this hue — worth knowing if the work targets wide-gamut displays."
            : "This hue is not constrained by sRGB, so a wide-gamut display buys it nothing."}
        </p>
      </div>

      <div className="ramp-feedback__block" data-testid="ramp-feedback-contrast">
        <h3 className="ramp-feedback__heading">Contrast reach</h3>
        {coverage.fail === 0 ? (
          <p className="ramp-feedback__note">
            Every step carries readable text: {coverage.aaa} at AAA, {coverage.aa} at AA.
          </p>
        ) : (
          <p className="ramp-feedback__note">
            {coverage.aaa} steps carry text at AAA and {coverage.aa} at AA, but {coverage.fail}{" "}
            {coverage.fail === 1 ? "has" : "have"} no accessible foreground at all.
          </p>
        )}
      </div>
    </section>
  );
}
