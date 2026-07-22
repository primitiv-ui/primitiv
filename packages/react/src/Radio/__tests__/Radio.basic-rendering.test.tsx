import { render, screen } from "@testing-library/react";

import { Radio } from "../Radio";

describe("Radio basic rendering", () => {
  it("renders a real native <input type=radio> as the control", () => {
    // Arrange & Act
    render(<Radio.Root aria-label="Compact" />);
    const radio = screen.getByRole("radio", { name: "Compact" });

    // Assert
    expect(radio.tagName).toBe("INPUT");
    expect(radio).toHaveAttribute("type", "radio");
  });

  it("wraps the input in a <label> so the visible control is clickable", () => {
    // Arrange & Act
    render(<Radio.Root aria-label="Compact" />);
    const radio = screen.getByRole("radio", { name: "Compact" });

    // Assert
    expect(radio.closest("label")).not.toBeNull();
  });

  it("is unchecked by default", () => {
    // Arrange & Act
    render(<Radio.Root aria-label="Compact" />);

    // Assert
    expect(screen.getByRole("radio", { name: "Compact" })).not.toBeChecked();
  });

  it("forwards native input attributes (name, value, id) to the input", () => {
    // Arrange & Act
    render(
      <Radio.Root id="r1" name="density" value="compact" aria-label="Compact" />,
    );
    const radio = screen.getByRole("radio", { name: "Compact" });

    // Assert
    expect(radio).toHaveAttribute("id", "r1");
    expect(radio).toHaveAttribute("name", "density");
    expect(radio).toHaveAttribute("value", "compact");
  });

  it("applies className to the wrapper, not the hidden input", () => {
    // Arrange & Act
    render(<Radio.Root className="box" aria-label="Compact" />);
    const radio = screen.getByRole("radio", { name: "Compact" });

    // Assert
    expect(radio).not.toHaveClass("box");
    expect(radio.closest("label")).toHaveClass("box");
  });

  it('sets data-state="unchecked" on the wrapper when unchecked', () => {
    // Arrange & Act
    const { container } = render(<Radio.Root aria-label="Compact" />);

    // Assert
    expect(container.querySelector("label")).toHaveAttribute(
      "data-state",
      "unchecked",
    );
  });

  it("sets a displayName on the compound and the Indicator", () => {
    // Assert — empty displayNames would render each as anonymous in DevTools.
    // Root aliases the compound (Object.assign), so its name is "Radio".
    expect(Radio.displayName).toBe("Radio");
    expect(Radio.Indicator.displayName).toBe("RadioIndicator");
  });

  it("throws a helpful error when a sub-component renders outside Radio.Root", () => {
    // Assert — the strict-context guard names the required parent.
    expect(() => render(<Radio.Indicator />)).toThrow(
      "Radio sub-components must be rendered inside a <Radio.Root>.",
    );
  });
});
