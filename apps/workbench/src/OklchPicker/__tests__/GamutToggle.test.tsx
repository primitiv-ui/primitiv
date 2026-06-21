import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GamutToggle } from "../GamutToggle";

function renderToggle(gamut: "Srgb" | "DisplayP3" = "Srgb", onChange = vi.fn()) {
  render(<GamutToggle gamut={gamut} onChange={onChange} />);
  return { onChange };
}

describe("GamutToggle", () => {
  it("offers an sRGB and a P3 option", () => {
    renderToggle();

    expect(screen.getByRole("button", { name: "sRGB" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "P3" })).toBeInTheDocument();
  });

  it("marks the current gamut as pressed", () => {
    renderToggle("DisplayP3");

    expect(screen.getByRole("button", { name: "P3" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("emits the chosen gamut when the other option is pressed", async () => {
    const user = userEvent.setup();
    const { onChange } = renderToggle("Srgb");

    await user.click(screen.getByRole("button", { name: "P3" }));

    expect(onChange).toHaveBeenCalledWith("DisplayP3");
  });

  it("ignores a press that would deselect the active option", async () => {
    const user = userEvent.setup();
    const { onChange } = renderToggle("Srgb");

    await user.click(screen.getByRole("button", { name: "sRGB" }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
