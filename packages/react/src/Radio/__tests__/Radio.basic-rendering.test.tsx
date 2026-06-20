import { render, screen } from "@testing-library/react";

import { Radio } from "../Radio";

describe("Radio basic rendering", () => {
  it('renders a <button> with role="radio"', () => {
    // Arrange & Act
    render(<Radio.Root aria-label="Compact" />);
    const radio = screen.getByRole("radio", { name: "Compact" });

    // Assert
    expect(radio.tagName).toBe("BUTTON");
  });

  it('defaults aria-checked to "false"', () => {
    // Arrange & Act
    render(<Radio.Root aria-label="Compact" />);
    const radio = screen.getByRole("radio", { name: "Compact" });

    // Assert
    expect(radio).toHaveAttribute("aria-checked", "false");
  });

  it('defaults type="button" so the radio never submits an enclosing form', () => {
    // Arrange & Act
    render(<Radio.Root aria-label="Compact" />);
    const radio = screen.getByRole("radio", { name: "Compact" });

    // Assert
    expect(radio).toHaveAttribute("type", "button");
  });

  it('sets data-state="unchecked" on the root when unchecked', () => {
    // Arrange & Act
    render(<Radio.Root aria-label="Compact" />);
    const radio = screen.getByRole("radio", { name: "Compact" });

    // Assert
    expect(radio).toHaveAttribute("data-state", "unchecked");
  });
});
