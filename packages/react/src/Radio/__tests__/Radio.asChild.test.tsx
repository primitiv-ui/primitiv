import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Radio } from "../Radio";

describe("Radio asChild composition", () => {
  it("Root asChild delegates to the child element while keeping ARIA and select wiring", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Radio.Root asChild onCheckedChange={onCheckedChange} aria-label="Compact">
        <li>Compact</li>
      </Radio.Root>,
    );
    const radio = screen.getByRole("radio", { name: "Compact" });

    // Assert element is the consumer's <li>
    expect(radio.tagName).toBe("LI");
    expect(radio).toHaveAttribute("aria-checked", "false");
    expect(radio).toHaveAttribute("data-state", "unchecked");

    // Act
    await user.click(radio);

    // Assert select still fires through composed onClick
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(radio).toHaveAttribute("aria-checked", "true");
  });

  it("Root asChild lets the consumer override the role for menu-item contexts", () => {
    // Arrange & Act
    render(
      <Radio.Root asChild aria-label="Compact">
        <li role="menuitemradio">Compact</li>
      </Radio.Root>,
    );

    // Assert
    const item = screen.getByRole("menuitemradio", { name: "Compact" });
    expect(item).toHaveAttribute("aria-checked", "false");
    expect(item).toHaveAttribute("data-state", "unchecked");
  });

  it("Indicator asChild delegates rendering to the consumer's element", () => {
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

    // Assert
    const dot = screen.getByTestId("dot");
    expect(dot.tagName.toLowerCase()).toBe("svg");
    expect(dot).toHaveAttribute("aria-hidden", "true");
    expect(dot).toHaveAttribute("data-state", "checked");
  });
});
