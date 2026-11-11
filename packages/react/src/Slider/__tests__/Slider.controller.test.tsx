import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, createRef } from "react";

import { Slider } from "../Slider";

// Slider's keys and press-and-drag run in the shared SliderController from
// @primitiv-ui/web (RFC 0033 §3.4). These cover what hosting it adds: one
// controller per root under StrictMode, the root's ref still reaching the
// consumer, and consumer handlers running beside the controller's.

describe("Slider on the shared controller", () => {
  it("steps once per key press under StrictMode, whose effects run twice", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StrictMode>
        <Slider.Root value={[50]} onValueChange={onValueChange}>
          <Slider.Thumb aria-label="Volume" />
        </Slider.Root>
      </StrictMode>,
    );
    screen.getByRole("slider").focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith([51]);
  });

  it("keeps handling presses when the root is given a ref, which still reaches the consumer, beside its onPointerDown", () => {
    // Arrange
    const ref = createRef<HTMLSpanElement>();
    const onPointerDown = vi.fn();
    render(
      <Slider.Root defaultValue={[10]} ref={ref} onPointerDown={onPointerDown} data-testid="root">
        <Slider.Thumb aria-label="Volume" />
      </Slider.Root>,
    );
    const root = screen.getByTestId("root");
    root.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 100, bottom: 10, width: 100, height: 10, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

    // Act
    fireEvent.pointerDown(root, { clientX: 40 });

    // Assert
    expect(ref.current).toBe(root);
    expect(onPointerDown).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "40");
  });
});
