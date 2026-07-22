import { VisuallyHidden } from "../index.ts";
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

    // Assert — the full WCAG C7 clip set; every property matters, so each is
    // asserted (a missing one lets a mutant blank that value undetected).
    const hidden = screen.getByText("Loading complete");
    expect(hidden).toHaveStyle({
      position: "absolute",
      width: "1px",
      height: "1px",
      padding: "0px",
      margin: "-1px",
      overflow: "hidden",
      whiteSpace: "nowrap",
      borderWidth: "0px",
    });
    // jsdom's computed style doesn't surface clip/clip-path, so assert them on
    // the inline style directly.
    // jsdom normalises `rect(0 0 0 0)` to `rect(0px)`.
    expect(hidden.style.clip).toBe("rect(0px)");
    expect(hidden.style.clipPath).toBe("inset(50%)");
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

  it('sets displayName to "VisuallyHidden" for React DevTools and stack traces', () => {
    // Assert — an empty displayName would render it as an anonymous component.
    expect(VisuallyHidden.displayName).toBe("VisuallyHidden");
  });
});
