// How much of the chroma a ramp asks for it actually gets, per step (RFC 0027
// §6). The engine supplies the two numbers — what each step's scale requested
// and what the gamut granted — and this turns them into the thing a designer
// reads: "your light steps reach 60% of what they asked for."
//
// The distinction matters because a quiet step has two possible causes that look
// identical in the output: the ramp's chroma scale tapers the ends *on purpose*,
// and a hue the gamut cannot hold gets cut back. Only the second is a constraint
// worth surfacing, and only the request/grant pair separates them.

/** One step's chroma request and what the gamut allowed, as the engine reports it. */
export type ChromaHeadroomRow = {
  label: string;
  requested: number;
  granted: number;
};

export type StepReach = {
  label: string;
  /** Fraction of the requested chroma this step actually gets, `0..1`. */
  reach: number;
  /** Whether the gamut — rather than the ramp's own taper — held this step back. */
  limited: boolean;
};

export type RampReach = {
  steps: StepReach[];
  /** Mean reach across the ramp, `0..1`. */
  overall: number;
};

/**
 * Rounding slack, so a step held back by a float's last digit is not reported to
 * a designer as a gamut limit.
 */
const FULLY_REACHED = 1 - 1e-6;

export function summariseReach(rows: ChromaHeadroomRow[]): RampReach {
  const steps: StepReach[] = rows.map(({ label, requested, granted }) => {
    // A ramp seeded from a grey asks for no chroma anywhere. It is not short of
    // anything, so it reaches everything it asked for.
    const reach = requested > 0 ? granted / requested : 1;
    return { label, reach, limited: reach < FULLY_REACHED };
  });

  const overall =
    steps.length > 0 ? steps.reduce((total, step) => total + step.reach, 0) / steps.length : 1;

  return { steps, overall };
}
