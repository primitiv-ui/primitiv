import { render, screen } from "@testing-library/react";

import { RadioCard } from "../RadioCard";

describe("RadioCard.Item ref forwarding", () => {
  it("forwards the underlying button element to a consumer function ref", () => {
    // Arrange
    const received: (HTMLButtonElement | null)[] = [];
    const functionRef = (node: HTMLButtonElement | null) => {
      received.push(node);
    };

    // Act
    render(
      <RadioCard.Root aria-label="Plan">
        <RadioCard.Item value="pro" ref={functionRef}>
          Pro
        </RadioCard.Item>
      </RadioCard.Root>,
    );

    // Assert
    expect(received).toContain(screen.getByRole("radio", { name: "Pro" }));
  });

  it("re-attaches to a replacement ref when the ref prop changes", () => {
    // Arrange — the item's ref memo must depend on `ref`, or a changed ref
    // callback is never invoked with the element.
    const secondReceived: (HTMLButtonElement | null)[] = [];
    const firstRef = () => {};
    const secondRef = (node: HTMLButtonElement | null) => {
      secondReceived.push(node);
    };

    // Act — mount with the first ref, then re-render with a different one.
    const { rerender } = render(
      <RadioCard.Root aria-label="Plan">
        <RadioCard.Item value="pro" ref={firstRef}>
          Pro
        </RadioCard.Item>
      </RadioCard.Root>,
    );
    rerender(
      <RadioCard.Root aria-label="Plan">
        <RadioCard.Item value="pro" ref={secondRef}>
          Pro
        </RadioCard.Item>
      </RadioCard.Root>,
    );

    // Assert — the replacement ref received the button.
    expect(secondReceived).toContain(screen.getByRole("radio", { name: "Pro" }));
  });
});
