import { render, screen } from "@testing-library/react";

import { Breadcrumb } from "../Breadcrumb";

describe("Breadcrumb basic rendering", () => {
  it('renders a <nav aria-label="Breadcrumb">', () => {
    // Arrange & Act
    render(<Breadcrumb.Root />);

    // Assert
    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }).tagName,
    ).toBe("NAV");
  });
});
