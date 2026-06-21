import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { HueSlider } from "../HueSlider";

function renderSlider(hue = 250, onChange = vi.fn()) {
  const stripRef = createRef<HTMLCanvasElement>();
  render(
    <HueSlider hue={hue} onChange={onChange} stripRef={stripRef} width={360} />,
  );
  return { onChange, stripRef };
}

describe("HueSlider", () => {
  it("reflects the current hue as the slider value", () => {
    renderSlider(250);

    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "250");
  });

  it("attaches the strip canvas to the supplied ref", () => {
    const { stripRef } = renderSlider();

    expect(stripRef.current).toBeInstanceOf(HTMLCanvasElement);
  });

  it("emits the new hue when the thumb is moved by keyboard", async () => {
    const user = userEvent.setup();
    const { onChange } = renderSlider(250);

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith(251);
  });
});
