import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Checkbox } from "../Checkbox";

describe("Checkbox.Indicator", () => {
  it("is always mounted, regardless of checked state", () => {
    // Arrange & Act — unchecked, yet the mark is in the DOM (CSS hides it).
    render(
      <Checkbox.Root aria-label="Accept terms">
        <Checkbox.Indicator data-testid="mark" />
      </Checkbox.Root>,
    );

    // Assert
    expect(screen.getByTestId("mark")).toBeInTheDocument();
  });

  it("is decorative, carrying aria-hidden", () => {
    // Arrange & Act
    render(
      <Checkbox.Root aria-label="Accept terms">
        <Checkbox.Indicator data-testid="mark" />
      </Checkbox.Root>,
    );

    // Assert
    expect(screen.getByTestId("mark")).toHaveAttribute("aria-hidden", "true");
  });

  it("mirrors the checkbox's data-state for CSS to key off", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Checkbox.Root aria-label="Accept terms">
        <Checkbox.Indicator data-testid="mark" />
      </Checkbox.Root>,
    );
    const mark = screen.getByTestId("mark");
    expect(mark).toHaveAttribute("data-state", "unchecked");

    // Act
    await user.click(screen.getByRole("checkbox", { name: "Accept terms" }));

    // Assert
    expect(mark).toHaveAttribute("data-state", "checked");
  });

  it("mirrors the indeterminate data-state", () => {
    // Arrange & Act
    render(
      <Checkbox.Root defaultChecked="indeterminate" aria-label="Accept terms">
        <Checkbox.Indicator data-testid="mark" />
      </Checkbox.Root>,
    );

    // Assert
    expect(screen.getByTestId("mark")).toHaveAttribute(
      "data-state",
      "indeterminate",
    );
  });

  it("delegates to the consumer's element (e.g. an svg tick) via asChild", () => {
    // Arrange & Act
    render(
      <Checkbox.Root defaultChecked aria-label="Accept terms">
        <Checkbox.Indicator asChild>
          <svg data-testid="tick" viewBox="0 0 10 10">
            <path d="M1 5l3 3 5-7" />
          </svg>
        </Checkbox.Indicator>
      </Checkbox.Root>,
    );
    const tick = screen.getByTestId("tick");

    // Assert
    expect(tick.tagName.toLowerCase()).toBe("svg");
    expect(tick).toHaveAttribute("aria-hidden", "true");
    expect(tick).toHaveAttribute("data-state", "checked");
  });

  it("throws when rendered outside Checkbox.Root", () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Assert
    expect(() => render(<Checkbox.Indicator />)).toThrow();

    error.mockRestore();
  });
});
