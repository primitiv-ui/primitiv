import { render, screen } from "@testing-library/react";

import { Progress } from "../Progress";

describe("Progress asChild", () => {
  it("renders the Root as the consumer element when asChild is set", () => {
    // Arrange & Act
    render(
      <Progress.Root asChild value={50} aria-label="Upload">
        <section>fill</section>
      </Progress.Root>,
    );
    const bar = screen.getByRole("progressbar", { name: "Upload" });

    // Assert — section rendered, not div; ARIA merged onto it
    expect(bar.tagName).toBe("SECTION");
    expect(bar).toHaveAttribute("aria-valuenow", "50");
    expect(bar).toHaveAttribute("data-state", "loading");
  });

  it("renders the Indicator as the consumer element when asChild is set", () => {
    // Arrange & Act
    render(
      <Progress.Root value={50} aria-label="Upload">
        <Progress.Indicator asChild>
          <span data-testid="custom-fill" />
        </Progress.Indicator>
      </Progress.Root>,
    );
    const fill = screen.getByTestId("custom-fill");

    // Assert — our span rendered; data-* hooks merged onto it
    expect(fill.tagName).toBe("SPAN");
    expect(fill).toHaveAttribute("data-state", "loading");
    expect(fill).toHaveAttribute("data-value", "50");
  });
});
