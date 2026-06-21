import { render, screen } from "@testing-library/react";

import { Switch } from "../Switch";

describe("Switch asChild", () => {
  it("renders the Thumb as the consumer element when asChild is set", () => {
    // Arrange & Act
    render(
      <Switch.Root aria-label="Enable notifications">
        <Switch.Thumb asChild>
          <span data-testid="custom-thumb" />
        </Switch.Thumb>
      </Switch.Root>,
    );
    const thumb = screen.getByTestId("custom-thumb");

    // Assert — our span rendered; aria-hidden and data-state merged onto it
    expect(thumb).toHaveAttribute("aria-hidden", "true");
    expect(thumb).toHaveAttribute("data-state", "unchecked");
  });

  it("merges the checked data-state onto the asChild Thumb", () => {
    // Arrange & Act
    render(
      <Switch.Root aria-label="Enable notifications" defaultChecked>
        <Switch.Thumb asChild>
          <span data-testid="custom-thumb" />
        </Switch.Thumb>
      </Switch.Root>,
    );

    // Assert
    expect(screen.getByTestId("custom-thumb")).toHaveAttribute(
      "data-state",
      "checked",
    );
  });
});
