import { render, screen } from "@testing-library/react";

import { Progress } from "../Progress";

import { determinateStateCases } from "./Progress.fixtures";

describe("Progress value", () => {
  it("sets aria-valuenow and data-value from value", () => {
    // Arrange & Act
    render(<Progress.Root value={42} aria-label="Upload" />);
    const bar = screen.getByRole("progressbar", { name: "Upload" });

    // Assert
    expect(bar).toHaveAttribute("aria-valuenow", "42");
    expect(bar).toHaveAttribute("data-value", "42");
  });

  it("defaults aria-valuetext to a rounded percentage", () => {
    // Arrange & Act
    render(<Progress.Root value={1} max={3} aria-label="Upload" />);

    // Assert
    expect(screen.getByRole("progressbar", { name: "Upload" })).toHaveAttribute(
      "aria-valuetext",
      "33%",
    );
  });

  it("honours a custom max for aria-valuemax and the percentage label", () => {
    // Arrange & Act
    render(<Progress.Root value={25} max={50} aria-label="Upload" />);
    const bar = screen.getByRole("progressbar", { name: "Upload" });

    // Assert
    expect(bar).toHaveAttribute("aria-valuemax", "50");
    expect(bar).toHaveAttribute("aria-valuetext", "50%");
  });

  it("uses a custom getValueLabel for aria-valuetext", () => {
    // Arrange & Act
    render(
      <Progress.Root
        value={3}
        max={10}
        getValueLabel={(v, m) => `${v} of ${m} files`}
        aria-label="Upload"
      />,
    );

    // Assert
    expect(screen.getByRole("progressbar", { name: "Upload" })).toHaveAttribute(
      "aria-valuetext",
      "3 of 10 files",
    );
  });

  it("mirrors data-value onto the Indicator when determinate", () => {
    // Arrange & Act
    render(
      <Progress.Root value={70} aria-label="Upload">
        <Progress.Indicator data-testid="indicator" />
      </Progress.Root>,
    );

    // Assert
    expect(screen.getByTestId("indicator")).toHaveAttribute("data-value", "70");
  });

  describe.each(determinateStateCases)(
    "value $value of $max",
    ({ value, max, expectedState }) => {
      it(`derives data-state="${expectedState}"`, () => {
        // Arrange & Act
        render(<Progress.Root value={value} max={max} aria-label="Upload" />);

        // Assert
        expect(
          screen.getByRole("progressbar", { name: "Upload" }),
        ).toHaveAttribute("data-state", expectedState);
      });
    },
  );
});
