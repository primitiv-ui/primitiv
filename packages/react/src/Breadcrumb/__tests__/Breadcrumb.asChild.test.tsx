import { render, screen } from "@testing-library/react";

import { Breadcrumb } from "../Breadcrumb";

describe("Breadcrumb asChild", () => {
  it("renders Breadcrumb.Link as the consumer element, with no wrapping <a>", () => {
    // Arrange & Act
    render(
      <Breadcrumb.Link asChild>
        <button type="button">Library</button>
      </Breadcrumb.Link>,
    );
    const link = screen.getByRole("button", { name: "Library" });

    // Assert — the native <a> is dropped entirely
    expect(link.closest("a")).toBeNull();
  });

  it("merges Breadcrumb.Link props onto the asChild element", () => {
    // Arrange & Act
    render(
      <Breadcrumb.Link asChild className="crumb" data-testid="link">
        <a href="/library">Library</a>
      </Breadcrumb.Link>,
    );
    const link = screen.getByTestId("link");

    // Assert — consumer's <a> kept; className and href both present on it
    expect(link.tagName).toBe("A");
    expect(link).toHaveClass("crumb");
    expect(link).toHaveAttribute("href", "/library");
  });
});
