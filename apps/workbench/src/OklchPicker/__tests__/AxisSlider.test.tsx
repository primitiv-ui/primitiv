import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AxisSlider } from "../AxisSlider";

function renderSlider(
  over: Partial<Parameters<typeof AxisSlider>[0]> = {},
  onChange = vi.fn(),
) {
  const stripRef = createRef<HTMLCanvasElement>();
  render(
    <AxisSlider
      label="Hue"
      value={250}
      min={0}
      max={360}
      step={1}
      onChange={onChange}
      stripRef={stripRef}
      width={360}
      {...over}
    />,
  );
  return { onChange, stripRef };
}

describe("AxisSlider", () => {
  it("reflects the current value as the slider value", () => {
    renderSlider();

    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "250");
  });

  it("labels the slider with the axis name", () => {
    renderSlider();

    expect(screen.getByRole("slider", { name: "Hue" })).toBeInTheDocument();
  });

  it("attaches the strip canvas to the supplied ref", () => {
    const { stripRef } = renderSlider();

    expect(stripRef.current).toBeInstanceOf(HTMLCanvasElement);
  });

  it("emits the new value stepped when moved by keyboard", async () => {
    const user = userEvent.setup();
    const { onChange } = renderSlider({
      label: "Chroma",
      value: 0.15,
      min: 0,
      max: 0.4,
      step: 0.005,
    });

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith(0.155);
  });
});
