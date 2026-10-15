import { describe, expect, it } from "vitest";

import { chunks } from "./chunks.mjs";

describe("chunks", () => {
  it("covers every frame exactly once, in order", () => {
    const parts = chunks(55, 4, 60);
    expect(parts[0].from).toBe(0);
    expect(parts.at(-1).to).toBe(3300);
    for (let i = 1; i < parts.length; i++) expect(parts[i].from).toBe(parts[i - 1].to);
  });

  it("splits as evenly as whole frames allow", () => {
    const sizes = chunks(55, 4, 60).map((p) => p.to - p.from);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });

  it("works in whole frames even when the duration is not a frame multiple", () => {
    const parts = chunks(1.005, 2, 60);
    expect(parts.every((p) => Number.isInteger(p.from) && Number.isInteger(p.to))).toBe(true);
    expect(parts.at(-1).to).toBe(60);
  });

  it("never makes more chunks than there are frames", () => {
    expect(chunks(2 / 60, 8, 60)).toHaveLength(2);
  });
});
