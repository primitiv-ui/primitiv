import { render } from "@testing-library/react";

import { Progress } from "../Progress";

describe("Progress error handling", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when Progress.Indicator is rendered outside a Progress.Root", () => {
    // Arrange & Act & Assert
    expect(() => render(<Progress.Indicator />)).toThrow(
      "Progress.Indicator must be rendered inside a <Progress.Root>.",
    );
  });

  it.each([0, -10, NaN, Infinity])(
    "throws when max is not a positive finite number (%s)",
    (max) => {
      // Arrange & Act & Assert
      expect(() =>
        render(<Progress.Root max={max} aria-label="Upload" />),
      ).toThrow(/`max` must be a positive, finite number/);
    },
  );

  it.each([-1, 101, NaN, Infinity])(
    "throws when value falls outside 0..max (%s)",
    (value) => {
      // Arrange & Act & Assert
      expect(() =>
        render(<Progress.Root value={value} aria-label="Upload" />),
      ).toThrow(/`value` must be a finite number between 0 and/);
    },
  );
});
