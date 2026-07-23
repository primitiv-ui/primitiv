import { createRef } from "react";
import { render, screen } from "@testing-library/react";

import { RadioGroup } from "../RadioGroup";

describe("RadioGroup.Item ref forwarding", () => {
  it("forwards the underlying button element to a consumer function ref", () => {
    // Arrange
    const received: (HTMLButtonElement | null)[] = [];
    const functionRef = (node: HTMLButtonElement | null) => {
      received.push(node);
    };

    // Act
    render(
      <RadioGroup.Root aria-label="Colour">
        <RadioGroup.Item value="red" ref={functionRef}>
          Red
        </RadioGroup.Item>
      </RadioGroup.Root>,
    );

    // Assert
    const button = screen.getByRole("radio", { name: "Red" });
    expect(received).toContain(button);
  });

  it("forwards the underlying button element to a consumer object ref", () => {
    // Arrange
    const objectRef = createRef<HTMLButtonElement>();

    // Act
    render(
      <RadioGroup.Root aria-label="Colour">
        <RadioGroup.Item value="red" ref={objectRef}>
          Red
        </RadioGroup.Item>
      </RadioGroup.Root>,
    );

    // Assert
    const button = screen.getByRole("radio", { name: "Red" });
    expect(objectRef.current).toBe(button);
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
      <RadioGroup.Root aria-label="Colour">
        <RadioGroup.Item value="red" ref={firstRef}>
          Red
        </RadioGroup.Item>
      </RadioGroup.Root>,
    );
    rerender(
      <RadioGroup.Root aria-label="Colour">
        <RadioGroup.Item value="red" ref={secondRef}>
          Red
        </RadioGroup.Item>
      </RadioGroup.Root>,
    );

    // Assert — the replacement ref received the button.
    expect(secondReceived).toContain(screen.getByRole("radio", { name: "Red" }));
  });
});
