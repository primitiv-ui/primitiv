import { describe, expect, it } from "vitest";

import { glideAt } from "./glide";

const linear = (p: number) => p;
const STEPS = [
  { at: 1, to: "dense" },
  { at: 3, to: "spacious" },
] as const;

describe("glideAt", () => {
  it("rests on the initial value before the first step", () => {
    expect(glideAt(0, "comfortable", STEPS, 1, linear)).toEqual({
      from: "comfortable",
      to: "comfortable",
      p: 1,
    });
  });

  it("is part-way through the step whose window contains t", () => {
    expect(glideAt(1.5, "comfortable", STEPS, 1, linear)).toEqual({
      from: "comfortable",
      to: "dense",
      p: 0.5,
    });
  });

  it("holds the arrived value between steps", () => {
    expect(glideAt(2.5, "comfortable", STEPS, 1, linear)).toEqual({
      from: "comfortable",
      to: "dense",
      p: 1,
    });
  });

  it("chains from the previous step's destination", () => {
    expect(glideAt(3.25, "comfortable", STEPS, 1, linear)).toEqual({
      from: "dense",
      to: "spacious",
      p: 0.25,
    });
  });
});
