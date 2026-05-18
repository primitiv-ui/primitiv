import { act, fireEvent, render, screen } from "@testing-library/react";

import { Avatar } from "../Avatar";

describe("Avatar fallback", () => {
  it("renders the fallback while no image has loaded", () => {
    // Arrange & Act
    render(
      <Avatar.Root>
        <Avatar.Fallback>AL</Avatar.Fallback>
      </Avatar.Root>,
    );

    // Assert
    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("renders the fallback as a <span>", () => {
    // Arrange & Act
    render(
      <Avatar.Root>
        <Avatar.Fallback data-testid="fb">AL</Avatar.Fallback>
      </Avatar.Root>,
    );

    // Assert
    expect(screen.getByTestId("fb").tagName).toBe("SPAN");
  });

  it("hides the fallback once the image has loaded", () => {
    // Arrange
    render(
      <Avatar.Root>
        <Avatar.Image src="/ada.png" alt="Ada" data-testid="img" />
        <Avatar.Fallback>AL</Avatar.Fallback>
      </Avatar.Root>,
    );

    // Act
    fireEvent.load(screen.getByTestId("img"));

    // Assert
    expect(screen.queryByText("AL")).not.toBeInTheDocument();
  });

  describe("with delayMs", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("withholds the fallback until the delay has elapsed", () => {
      // Arrange
      render(
        <Avatar.Root>
          <Avatar.Fallback delayMs={600}>AL</Avatar.Fallback>
        </Avatar.Root>,
      );

      // Assert — withheld before the delay elapses
      expect(screen.queryByText("AL")).not.toBeInTheDocument();

      // Act
      act(() => {
        vi.advanceTimersByTime(600);
      });

      // Assert — shown once the delay elapses
      expect(screen.getByText("AL")).toBeInTheDocument();
    });
  });
});
