import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Radio } from "../Radio";

describe("Radio.Indicator", () => {
  it("does not render its children when the radio is unchecked", () => {
    // Arrange & Act
    render(
      <Radio.Root aria-label="Compact">
        <Radio.Indicator>dot</Radio.Indicator>
      </Radio.Root>,
    );

    // Assert
    expect(screen.queryByText("dot")).not.toBeInTheDocument();
  });

  it("renders its children when the radio is checked", () => {
    // Arrange & Act
    render(
      <Radio.Root defaultChecked aria-label="Compact">
        <Radio.Indicator>dot</Radio.Indicator>
      </Radio.Root>,
    );

    // Assert
    expect(screen.getByText("dot")).toBeInTheDocument();
  });

  it("mounts in response to selecting", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Radio.Root aria-label="Compact">
        <Radio.Indicator>dot</Radio.Indicator>
      </Radio.Root>,
    );
    expect(screen.queryByText("dot")).not.toBeInTheDocument();

    // Act
    await user.click(screen.getByRole("radio", { name: "Compact" }));

    // Assert
    expect(screen.getByText("dot")).toBeInTheDocument();
  });

  it('carries aria-hidden="true" since it is decorative', () => {
    // Arrange & Act
    render(
      <Radio.Root defaultChecked aria-label="Compact">
        <Radio.Indicator data-testid="indicator">dot</Radio.Indicator>
      </Radio.Root>,
    );

    // Assert
    expect(screen.getByTestId("indicator")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("mirrors the radio's data-state on the indicator", () => {
    // Arrange & Act
    render(
      <Radio.Root defaultChecked aria-label="Compact">
        <Radio.Indicator data-testid="indicator">dot</Radio.Indicator>
      </Radio.Root>,
    );

    // Assert
    expect(screen.getByTestId("indicator")).toHaveAttribute(
      "data-state",
      "checked",
    );
  });

  it("stays in the DOM while unchecked when forceMount is set", () => {
    // Arrange & Act
    render(
      <Radio.Root aria-label="Compact">
        <Radio.Indicator forceMount data-testid="indicator">
          dot
        </Radio.Indicator>
      </Radio.Root>,
    );
    const indicator = screen.getByTestId("indicator");

    // Assert
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute("data-state", "unchecked");
  });

  it("throws when rendered outside Radio.Root", () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Assert
    expect(() => render(<Radio.Indicator>dot</Radio.Indicator>)).toThrow();

    error.mockRestore();
  });
});
