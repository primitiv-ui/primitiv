import { createRef } from "react";
import { render, screen } from "@testing-library/react";

import { Switch } from "../Switch";

describe("Switch basic rendering", () => {
  it('renders a native <input type="checkbox" role="switch">', () => {
    // Arrange & Act
    render(<Switch.Root aria-label="Enable notifications" />);
    const sw = screen.getByRole("switch", { name: "Enable notifications" });

    // Assert
    expect(sw.tagName).toBe("INPUT");
    expect(sw).toHaveAttribute("type", "checkbox");
  });

  it("wraps the input in a <label> so the visible track is clickable", () => {
    // Arrange & Act
    render(<Switch.Root aria-label="Enable notifications" />);

    // Assert
    expect(
      screen.getByRole("switch", { name: "Enable notifications" }).closest("label"),
    ).not.toBeNull();
  });

  it("is unchecked by default", () => {
    // Arrange & Act
    render(<Switch.Root aria-label="Enable notifications" />);

    // Assert
    expect(
      screen.getByRole("switch", { name: "Enable notifications" }),
    ).not.toBeChecked();
  });

  it("forwards native input attributes (name, value) to the input", () => {
    // Arrange & Act
    render(<Switch.Root name="notify" value="on" aria-label="Enable notifications" />);
    const sw = screen.getByRole("switch", { name: "Enable notifications" });

    // Assert
    expect(sw).toHaveAttribute("name", "notify");
    expect(sw).toHaveAttribute("value", "on");
  });

  it("applies className to the track, not the hidden input", () => {
    // Arrange & Act
    render(<Switch.Root className="track" aria-label="Enable notifications" />);
    const sw = screen.getByRole("switch", { name: "Enable notifications" });

    // Assert
    expect(sw).not.toHaveClass("track");
    expect(sw.closest("label")).toHaveClass("track");
  });

  it("forwards a ref to the underlying input", () => {
    // Arrange
    const ref = createRef<HTMLInputElement>();

    // Act
    render(<Switch.Root ref={ref} aria-label="Enable notifications" />);

    // Assert
    expect(ref.current).toBe(
      screen.getByRole("switch", { name: "Enable notifications" }),
    );
  });

  it('defaults data-state="unchecked" on the track on mount', () => {
    // Arrange & Act
    const { container } = render(<Switch.Root aria-label="Enable notifications" />);

    // Assert
    expect(container.querySelector("label")).toHaveAttribute(
      "data-state",
      "unchecked",
    );
  });

  it("renders Switch.Thumb as an aria-hidden <span> inside the track", () => {
    // Arrange & Act
    render(
      <Switch.Root aria-label="Enable notifications">
        <Switch.Thumb data-testid="thumb" />
      </Switch.Root>,
    );
    const thumb = screen.getByTestId("thumb");

    // Assert
    expect(thumb.tagName).toBe("SPAN");
    expect(thumb).toHaveAttribute("aria-hidden", "true");
    expect(thumb).toHaveAttribute("data-state", "unchecked");
  });
});
