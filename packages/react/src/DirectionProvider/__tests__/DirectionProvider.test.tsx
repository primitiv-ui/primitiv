import { render, screen } from "@testing-library/react";

import { DirectionProvider, useDirection } from "../index.ts";

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

  it("should provide its dir to descendants via useDirection", () => {
    // Arrange
    render(
      <DirectionProvider dir="rtl">
        <DirectionProbe />
      </DirectionProvider>,
    );

    // Assert
    expect(screen.getByTestId("probe")).toHaveTextContent("rtl");
  });

  it('sets displayName to "DirectionProvider" for React DevTools and stack traces', () => {
    // Assert — an empty displayName would render it as an anonymous component.
    expect(DirectionProvider.displayName).toBe("DirectionProvider");
  });
});
