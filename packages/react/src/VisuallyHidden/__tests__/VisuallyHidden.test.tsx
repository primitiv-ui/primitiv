import { VisuallyHidden } from "..";
import { render, screen } from "@testing-library/react";

describe("VisuallyHidden component", () => {
  it("should render a span containing its children", () => {
    // Arrange
    render(<VisuallyHidden>Loading complete</VisuallyHidden>);

    // Assert
    const hidden = screen.getByText("Loading complete");
    expect(hidden.tagName).toBe("SPAN");
  });

  it("should apply the screen-reader-only clip styles", () => {
    // Arrange
    render(<VisuallyHidden>Loading complete</VisuallyHidden>);

    // Assert
    const hidden = screen.getByText("Loading complete");
    expect(hidden).toHaveStyle({
      position: "absolute",
      width: "1px",
      height: "1px",
      overflow: "hidden",
      whiteSpace: "nowrap",
    });
  });

  it("should merge a consumer style over the clip styles", () => {
    // Arrange
    render(
      <VisuallyHidden style={{ position: "static", display: "block" }}>
        Loading complete
      </VisuallyHidden>,
    );

    // Assert
    const hidden = screen.getByText("Loading complete");
    expect(hidden).toHaveStyle({
      position: "static",
      display: "block",
      whiteSpace: "nowrap",
    });
  });

  it("should render the consumer element with asChild, keeping the clip styles", () => {
    // Arrange
    render(
      <VisuallyHidden asChild>
        <label>Search</label>
      </VisuallyHidden>,
    );

    // Assert
    const hidden = screen.getByText("Search");
    expect(hidden.tagName).toBe("LABEL");
    expect(hidden).toHaveStyle({ position: "absolute", overflow: "hidden" });
  });
});
