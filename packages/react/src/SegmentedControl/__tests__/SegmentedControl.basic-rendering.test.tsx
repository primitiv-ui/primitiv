import { render, screen } from "@testing-library/react";

import { SegmentedControl } from "../SegmentedControl";

describe("SegmentedControl basic rendering", () => {
  it('renders a container with role="radiogroup"', () => {
    // Arrange & Act
    render(
      <SegmentedControl.Root aria-label="Mode">
        <SegmentedControl.Item value="headless">Headless</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );

    // Assert
    expect(screen.getByRole("radiogroup", { name: "Mode" })).toBeInTheDocument();
  });
});
