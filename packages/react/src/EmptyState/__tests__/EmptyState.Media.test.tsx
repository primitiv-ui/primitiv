import { EmptyState } from "../index.ts";
import { render } from "@testing-library/react";

describe("EmptyState.Media component", () => {
  it("should render a div hidden from assistive technology", () => {
    // Arrange
    const { container } = render(
      <EmptyState.Media>
        <svg />
      </EmptyState.Media>,
    );

    // Assert
    const media = container.firstChild as HTMLElement;
    expect(media.tagName).toBe("DIV");
    expect(media).toHaveAttribute("aria-hidden", "true");
  });

  it("should render the consumer element with asChild, keeping it hidden", () => {
    // Arrange
    const { container } = render(
      <EmptyState.Media asChild>
        <span>
          <svg />
        </span>
      </EmptyState.Media>,
    );

    // Assert
    const media = container.firstChild as HTMLElement;
    expect(media.tagName).toBe("SPAN");
    expect(media).toHaveAttribute("aria-hidden", "true");
  });
});
