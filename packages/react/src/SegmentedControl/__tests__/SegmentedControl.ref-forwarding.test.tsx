import { createRef } from "react";
import { render, screen } from "@testing-library/react";

import { SegmentedControl } from "../SegmentedControl";

describe("SegmentedControl.Item ref forwarding", () => {
  it("forwards the underlying button element to a consumer function ref", () => {
    // Arrange
    const received: (HTMLButtonElement | null)[] = [];
    const functionRef = (node: HTMLButtonElement | null) => {
      received.push(node);
    };

    // Act
    render(
      <SegmentedControl.Root aria-label="Mode">
        <SegmentedControl.Item value="a" ref={functionRef}>
          A
        </SegmentedControl.Item>
      </SegmentedControl.Root>,
    );

    // Assert
    const button = screen.getByRole("radio", { name: "A" });
    expect(received).toContain(button);
  });

  it("forwards the underlying button element to a consumer object ref", () => {
    // Arrange
    const objectRef = createRef<HTMLButtonElement>();

    // Act
    render(
      <SegmentedControl.Root aria-label="Mode">
        <SegmentedControl.Item value="a" ref={objectRef}>
          A
        </SegmentedControl.Item>
      </SegmentedControl.Root>,
    );

    // Assert
    const button = screen.getByRole("radio", { name: "A" });
    expect(objectRef.current).toBe(button);
  });
});
