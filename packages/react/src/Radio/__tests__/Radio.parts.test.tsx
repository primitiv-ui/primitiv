import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Radio } from "../Radio";

describe("Radio.Indicator", () => {
  it("is always mounted, regardless of checked state", () => {
    // Arrange & Act — unchecked, yet the dot is in the DOM (CSS hides it).
    render(
      <Radio.Root aria-label="Compact">
        <Radio.Indicator data-testid="dot" />
      </Radio.Root>,
    );

    // Assert
    expect(screen.getByTestId("dot")).toBeInTheDocument();
  });

  it("is decorative, carrying aria-hidden", () => {
    // Arrange & Act
    render(
      <Radio.Root aria-label="Compact">
        <Radio.Indicator data-testid="dot" />
      </Radio.Root>,
    );

    // Assert
    expect(screen.getByTestId("dot")).toHaveAttribute("aria-hidden", "true");
  });

  it("mirrors the radio's data-state for CSS to key off", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Radio.Root aria-label="Compact">
        <Radio.Indicator data-testid="dot" />
      </Radio.Root>,
    );
    const dot = screen.getByTestId("dot");
    expect(dot).toHaveAttribute("data-state", "unchecked");

    // Act
    await user.click(screen.getByRole("radio", { name: "Compact" }));

    // Assert
    expect(dot).toHaveAttribute("data-state", "checked");
  });

  it("delegates to the consumer's element (e.g. an svg dot) via asChild", () => {
    // Arrange & Act
    render(
      <Radio.Root defaultChecked aria-label="Compact">
        <Radio.Indicator asChild>
          <svg data-testid="dot" viewBox="0 0 10 10">
            <circle cx="5" cy="5" r="3" />
          </svg>
        </Radio.Indicator>
      </Radio.Root>,
    );
    const dot = screen.getByTestId("dot");

    // Assert
    expect(dot.tagName.toLowerCase()).toBe("svg");
    expect(dot).toHaveAttribute("data-state", "checked");
  });

  it("throws when rendered outside Radio.Root", () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Assert
    expect(() => render(<Radio.Indicator />)).toThrow();

    error.mockRestore();
  });
});
