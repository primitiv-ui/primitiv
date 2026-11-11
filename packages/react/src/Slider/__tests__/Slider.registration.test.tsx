import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";

import { Slider } from "../Slider";
import { SliderContext } from "../SliderContext";

describe("Slider thumb registration", () => {
  it("places each thumb by its value before any effect runs, as a server render does", () => {
    // Arrange & Act
    const html = renderToString(
      <Slider.Root defaultValue={[20]}>
        <Slider.Thumb aria-label="Volume" />
      </Slider.Root>,
    );

    // Assert
    expect(html).toContain('aria-valuenow="20"');
    expect(html).toContain("left:20%");
  });

  it("re-indexes the remaining thumbs once one is removed, keys included", async () => {
    // Arrange
    const user = userEvent.setup();
    const slider = (both: boolean) => (
      <Slider.Root defaultValue={[20, 80]}>
        {both && <Slider.Thumb aria-label="Low" />}
        <Slider.Thumb aria-label="High" />
      </Slider.Root>
    );
    const { rerender } = render(slider(true));

    // Act
    rerender(slider(false));
    const shown = screen.getByRole("slider", { name: "High" }).getAttribute("aria-valuenow");
    screen.getByRole("slider", { name: "High" }).focus();
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(shown).toBe("20");
    expect(screen.getByRole("slider", { name: "High" })).toHaveAttribute("aria-valuenow", "21");
  });

  it("leaves aria-disabled off an enabled thumb", () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[50]}>
        <Slider.Thumb aria-label="Volume" />
      </Slider.Root>,
    );

    // Assert
    expect(screen.getByRole("slider")).not.toHaveAttribute("aria-disabled");
  });

  it("names its context and parts for React DevTools", () => {
    // Arrange & Act & Assert
    expect(SliderContext.displayName).toBe("SliderContext");
    expect(Slider.displayName).toBe("Slider");
    expect(Slider.Track.displayName).toBe("SliderTrack");
    expect(Slider.Range.displayName).toBe("SliderRange");
    expect(Slider.Thumb.displayName).toBe("SliderThumb");
  });
});
