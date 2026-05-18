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
});
