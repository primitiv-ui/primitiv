import { render } from "@testing-library/react";

import { SegmentedControl } from "../SegmentedControl";

describe("SegmentedControl error handling", () => {
  it("throws a helpful error when SegmentedControl.Item is rendered outside Root", () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Assert
    expect(() =>
      render(<SegmentedControl.Item value="a">A</SegmentedControl.Item>),
    ).toThrow(/SegmentedControl sub-components must be rendered inside/);

    error.mockRestore();
  });
});
