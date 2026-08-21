import { describe, expect, it } from "vitest";

import { summariseReach } from "../rampReach";
import type { ChromaHeadroomRow } from "../rampReach";

const row = (label: string, requested: number, granted: number): ChromaHeadroomRow => ({
  label,
  requested,
  granted,
});

describe("summariseReach", () => {
  it("reports a step that got everything it asked for as fully reached", () => {
    const [step] = summariseReach([row("500", 0.12, 0.12)]).steps;

    expect(step.reach).toBe(1);
    expect(step.limited).toBe(false);
  });

  it("reports the fraction a gamut-limited step actually got", () => {
    // The number RFC 0027 §6 wants stated: "your light steps reach 60% of the
    // chroma they asked for". A designer learns their cyan mutes here, rather
    // than after building a system on it.
    const [step] = summariseReach([row("200", 0.10, 0.06)]).steps;

    expect(step.reach).toBeCloseTo(0.6, 5);
    expect(step.limited).toBe(true);
  });

  it("does not call a step limited when the ramp asked for nothing", () => {
    // A grey seed asks for no chroma at every step. Dividing by that request
    // would report every step as infinitely short of a target it never had.
    const [step] = summariseReach([row("50", 0, 0)]).steps;

    expect(step.reach).toBe(1);
    expect(step.limited).toBe(false);
  });

  it("averages reach across the ramp", () => {
    const summary = summariseReach([row("50", 0.1, 0.1), row("100", 0.1, 0.05)]);

    expect(summary.overall).toBeCloseTo(0.75, 5);
  });

  it("reports full reach for a ramp with no steps at all", () => {
    // Averaging an empty ramp is a divide by zero; nothing was held back, so
    // there is nothing to warn about.
    expect(summariseReach([]).overall).toBe(1);
  });
});
