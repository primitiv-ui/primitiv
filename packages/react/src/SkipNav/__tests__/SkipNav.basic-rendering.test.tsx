import { SkipNav } from "../SkipNav";
import { render, screen } from "@testing-library/react";

describe("SkipNav component", () => {
  it("should render a skip link as an anchor", () => {
    // Arrange
    render(<SkipNav.Link href="#main">Skip to content</SkipNav.Link>);

    // Assert
    const link = screen.getByRole("link", { name: "Skip to content" });
    expect(link).toHaveAttribute("href", "#main");
  });

  it("should render Content as a programmatically focusable region", () => {
    // Arrange
    render(<SkipNav.Content>Main content</SkipNav.Content>);

    // Assert
    const content = screen.getByText("Main content");
    expect(content).toHaveAttribute("id", "primitiv-skip-nav");
    expect(content).toHaveAttribute("tabindex", "-1");
  });

  it("sets displayName on each sub-component for React DevTools and stack traces", () => {
    // Assert — an empty displayName would render each as anonymous.
    expect(SkipNav.Link.displayName).toBe("SkipNavLink");
    expect(SkipNav.Content.displayName).toBe("SkipNavContent");
  });
});
