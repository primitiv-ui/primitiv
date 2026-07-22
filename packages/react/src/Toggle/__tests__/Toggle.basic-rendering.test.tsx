import { render, screen } from "@testing-library/react";

import { Toggle } from "../Toggle";

describe("Toggle basic rendering", () => {
  it('renders a <button type="button">', () => {
    render(<Toggle aria-label="Bold" />);
    const button = screen.getByRole("button", { name: "Bold" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
  });

  it('defaults aria-pressed to false', () => {
    render(<Toggle aria-label="Bold" />);
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it('defaults data-state to "off"', () => {
    render(<Toggle aria-label="Bold" />);
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "data-state",
      "off",
    );
  });

  it('sets displayName to "Toggle" for React DevTools and stack traces', () => {
    // Assert — an empty displayName would render it as an anonymous component.
    expect(Toggle.displayName).toBe("Toggle");
  });
});
