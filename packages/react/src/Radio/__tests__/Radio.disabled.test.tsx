import { render, screen } from "@testing-library/react";

import { Radio } from "../Radio";

describe("Radio disabled state", () => {
  it('sets data-disabled="" on the root so CSS can target the disabled state', () => {
    // Arrange & Act
    render(<Radio.Root disabled aria-label="Compact" />);
    const radio = screen.getByRole("radio", { name: "Compact" });

    // Assert
    expect(radio).toHaveAttribute("data-disabled", "");
  });

  it("omits data-disabled when not disabled", () => {
    // Arrange & Act
    render(<Radio.Root aria-label="Compact" />);
    const radio = screen.getByRole("radio", { name: "Compact" });

    // Assert
    expect(radio).not.toHaveAttribute("data-disabled");
  });
});
