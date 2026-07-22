import { render, screen } from "@testing-library/react";

import { Progress } from "../Progress";
import { ProgressContext } from "../ProgressContext";

describe("Progress basic rendering", () => {
  it('renders a <div role="progressbar">', () => {
    // Arrange & Act
    render(<Progress.Root aria-label="Loading" />);
    const bar = screen.getByRole("progressbar", { name: "Loading" });

    // Assert
    expect(bar.tagName).toBe("DIV");
  });

  it('defaults aria-valuemin="0" and aria-valuemax="100"', () => {
    // Arrange & Act
    render(<Progress.Root aria-label="Loading" />);
    const bar = screen.getByRole("progressbar", { name: "Loading" });

    // Assert
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it('is indeterminate when value is omitted: data-state="indeterminate", no aria-valuenow', () => {
    // Arrange & Act
    render(<Progress.Root aria-label="Loading" />);
    const bar = screen.getByRole("progressbar", { name: "Loading" });

    // Assert
    expect(bar).toHaveAttribute("data-state", "indeterminate");
    expect(bar).not.toHaveAttribute("aria-valuenow");
    expect(bar).not.toHaveAttribute("aria-valuetext");
    expect(bar).not.toHaveAttribute("data-value");
  });

  it("renders Progress.Indicator as a <div> inside the root", () => {
    // Arrange & Act
    render(
      <Progress.Root aria-label="Loading">
        <Progress.Indicator data-testid="indicator" />
      </Progress.Root>,
    );
    const indicator = screen.getByTestId("indicator");

    // Assert
    expect(indicator.tagName).toBe("DIV");
    expect(indicator).toBeInTheDocument();
  });

  it("mirrors data-state and data-max from the root onto the Indicator", () => {
    // Arrange & Act
    render(
      <Progress.Root aria-label="Loading">
        <Progress.Indicator data-testid="indicator" />
      </Progress.Root>,
    );

    // Assert
    expect(screen.getByTestId("indicator")).toHaveAttribute(
      "data-state",
      "indeterminate",
    );
    expect(screen.getByTestId("indicator")).toHaveAttribute("data-max", "100");
  });

  it("sets a displayName on the compound, indicator, and context", () => {
    // Assert — empty displayNames would render each as anonymous in DevTools.
    // Root aliases the compound (Object.assign), so its name is "Progress".
    expect(Progress.displayName).toBe("Progress");
    expect(Progress.Indicator.displayName).toBe("ProgressIndicator");
    expect(ProgressContext.displayName).toBe("ProgressContext");
  });
});
