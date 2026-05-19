import { render, screen } from "@testing-library/react";

import { useDirection } from "..";

function DirectionProbe() {
  return <span data-testid="probe">{useDirection()}</span>;
}

describe("DirectionProvider", () => {
  it("should default useDirection to ltr when no provider is present", () => {
    // Arrange
    render(<DirectionProbe />);

    // Assert
    expect(screen.getByTestId("probe")).toHaveTextContent("ltr");
  });
});
