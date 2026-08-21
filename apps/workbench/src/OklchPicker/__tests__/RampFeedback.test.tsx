import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { assess_brand_ramp, chroma_headroom } from "harmoni-wasm";

import { RampFeedback } from "../RampFeedback";

vi.mock("harmoni-wasm", () => ({
  chroma_headroom: vi.fn(),
  assess_brand_ramp: vi.fn(),
}));

const headroom = (rows: Array<[string, number, number]>) => ({
  steps: rows.map(([label, requested, granted]) => ({ label, requested, granted })),
});

/** A ramp where the gamut cut the light steps back, and the rest got everything. */
const LIMITED = headroom([
  ["50", 0.02, 0.02],
  ["100", 0.06, 0.03],
  ["200", 0.1, 0.05],
  ["500", 0.15, 0.15],
]);

/** The same ramp measured against a gamut with room to spare. */
const ROOMY = headroom([
  ["50", 0.02, 0.02],
  ["100", 0.06, 0.06],
  ["200", 0.1, 0.09],
  ["500", 0.15, 0.15],
]);

const coverage = (aaa: number, aa: number, fail: number) => ({
  steps: [],
  hue_span_intended: 0,
  hue_span_rendered: 1,
  min_delta_l: 0.05,
  mean_chroma_utilisation: 0.9,
  mean_chroma_demand: 0.9,
  foreground_coverage: { aaa, aa, fail },
  gamut: "Srgb",
});

beforeEach(() => {
  vi.mocked(chroma_headroom).mockImplementation((_l, _c, _h, gamut) =>
    (gamut === "DisplayP3" ? ROOMY : LIMITED) as never,
  );
  vi.mocked(assess_brand_ramp).mockReturnValue(coverage(7, 3, 0) as never);
});

const value = { l: 0.55, c: 0.15, h: 200 };

describe("RampFeedback", () => {
  it("names the steps the gamut held back, and by how much", () => {
    render(<RampFeedback value={value} />);

    const steps = screen.getByRole("list", { name: /chroma/i });
    const limited = within(steps).getAllByRole("listitem");

    expect(limited.map((item) => item.textContent)).toEqual(
      expect.arrayContaining([expect.stringContaining("100"), expect.stringContaining("50%")]),
    );
  });

  it("states the gamut trade-off rather than scoring the colour", () => {
    // RFC 0027 D5 — a hue that mutes in sRGB is not a bad hue. The picker's job
    // is to make the consequence visible before the decision, not grade it.
    render(<RampFeedback value={value} />);

    expect(screen.getByTestId("ramp-feedback-gamut")).toHaveTextContent(/sRGB/);
    expect(screen.getByTestId("ramp-feedback-gamut")).toHaveTextContent(/Display-P3/);
  });

  it("reports how many steps can carry text", () => {
    render(<RampFeedback value={value} />);

    expect(screen.getByTestId("ramp-feedback-contrast")).toHaveTextContent(/7/);
    expect(screen.getByTestId("ramp-feedback-contrast")).toHaveTextContent(/3/);
  });

  it("says so plainly when every step gets what it asked for", () => {
    vi.mocked(chroma_headroom).mockReturnValue({
      steps: ROOMY.steps.map((r) => ({ ...r, granted: r.requested })),
    } as never);

    render(<RampFeedback value={value} />);

    expect(screen.getByTestId("ramp-feedback-chroma")).toHaveTextContent(/every step/i);
  });

  it("counts a single held-back step in words, not as \"1 steps\"", () => {
    vi.mocked(chroma_headroom).mockReturnValue(
      headroom([
        ["50", 0.02, 0.02],
        ["100", 0.06, 0.03],
      ]) as never,
    );

    render(<RampFeedback value={value} />);

    expect(screen.getByTestId("ramp-feedback-chroma")).toHaveTextContent(/one step/);
  });

  it("says when a step has no accessible foreground at all", () => {
    // True of nothing the engine ships today, which is exactly why it has to be
    // stated rather than assumed — the guarantee is worth nothing unseen.
    vi.mocked(assess_brand_ramp).mockReturnValue(coverage(6, 3, 1) as never);

    render(<RampFeedback value={value} />);

    const block = screen.getByTestId("ramp-feedback-contrast");
    expect(block).toHaveTextContent(/no accessible foreground/);
    // ...and does not also claim every step is fine, which the one-sentence
    // version did: it appended the failure to "Every step carries readable text".
    expect(block).not.toHaveTextContent(/every step/i);
  });

  it("agrees its verb with the number of failing steps", () => {
    vi.mocked(assess_brand_ramp).mockReturnValue(coverage(6, 2, 2) as never);

    render(<RampFeedback value={value} />);

    expect(screen.getByTestId("ramp-feedback-contrast")).toHaveTextContent(/2 have no/);
  });

  it("renders nothing when the engine cannot answer", () => {
    // Better silent than confidently wrong: a failed measurement must not be
    // shown as a measured zero.
    vi.mocked(chroma_headroom).mockImplementation(() => {
      throw new Error("engine unavailable");
    });

    const { container } = render(<RampFeedback value={value} />);

    expect(container).toBeEmptyDOMElement();
  });
});
