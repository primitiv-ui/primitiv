import { render, screen } from "@testing-library/react";

import { Progress } from "../Progress";

describe("Progress basic rendering", () => {
  it('renders a <div role="progressbar">', () => {
    // Arrange & Act
    render(<Progress.Root aria-label="Loading" />);

    // Assert
    expect(screen.getByRole("progressbar", { name: "Loading" }).tagName).toBe(
      "DIV",
    );
  });
});
