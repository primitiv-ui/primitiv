import { render, screen } from "@testing-library/react";

import { ToggleGroup } from "../ToggleGroup";

describe("ToggleGroup.Item ref forwarding", () => {
  it("forwards the underlying button element to a consumer function ref", () => {
    // Arrange
    const received: (HTMLButtonElement | null)[] = [];
    const functionRef = (node: HTMLButtonElement | null) => {
      received.push(node);
    };

    // Act
    render(
      <ToggleGroup.Root type="single" aria-label="Alignment">
        <ToggleGroup.Item value="left" ref={functionRef}>
          Left
        </ToggleGroup.Item>
      </ToggleGroup.Root>,
    );

    // Assert
    expect(received).toContain(screen.getByRole("button", { name: "Left" }));
  });

  it("re-attaches to a replacement ref when the ref prop changes", () => {
    // Arrange — the item's ref memo must depend on `ref`, or a changed ref
    // callback is never invoked with the element.
    const firstReceived: (HTMLButtonElement | null)[] = [];
    const secondReceived: (HTMLButtonElement | null)[] = [];
    const firstRef = (node: HTMLButtonElement | null) => {
      firstReceived.push(node);
    };
    const secondRef = (node: HTMLButtonElement | null) => {
      secondReceived.push(node);
    };

    // Act — mount with the first ref, then re-render with a different one.
    const { rerender } = render(
      <ToggleGroup.Root type="single" aria-label="Alignment">
        <ToggleGroup.Item value="left" ref={firstRef}>
          Left
        </ToggleGroup.Item>
      </ToggleGroup.Root>,
    );
    rerender(
      <ToggleGroup.Root type="single" aria-label="Alignment">
        <ToggleGroup.Item value="left" ref={secondRef}>
          Left
        </ToggleGroup.Item>
      </ToggleGroup.Root>,
    );

    // Assert — the replacement ref received the button.
    const button = screen.getByRole("button", { name: "Left" });
    expect(secondReceived).toContain(button);
  });
});
