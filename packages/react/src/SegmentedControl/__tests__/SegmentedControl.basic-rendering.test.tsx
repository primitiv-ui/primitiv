import { render, screen } from "@testing-library/react";

import { SegmentedControl } from "../SegmentedControl";

describe("SegmentedControl basic rendering", () => {
  it('renders a container with role="radiogroup"', () => {
    // Arrange & Act
    render(
      <SegmentedControl.Root aria-label="Mode">
        <SegmentedControl.Item value="headless">Headless</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );

    // Assert
    expect(screen.getByRole("radiogroup", { name: "Mode" })).toBeInTheDocument();
  });

  it('renders each item as a <button role="radio"> with aria-checked="false" by default', () => {
    // Arrange & Act
    render(
      <SegmentedControl.Root aria-label="Mode">
        <SegmentedControl.Item value="headless">Headless</SegmentedControl.Item>
        <SegmentedControl.Item value="styled">Styled</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    const headless = screen.getByRole("radio", { name: "Headless" });
    const styled = screen.getByRole("radio", { name: "Styled" });

    // Assert
    expect(headless.tagName).toBe("BUTTON");
    expect(headless).toHaveAttribute("aria-checked", "false");
    expect(headless).toHaveAttribute("data-state", "unchecked");
    expect(styled.tagName).toBe("BUTTON");
    expect(styled).toHaveAttribute("aria-checked", "false");
  });

  it('defaults type="button" on items so they never submit an enclosing form', () => {
    // Arrange & Act
    render(
      <SegmentedControl.Root aria-label="Mode">
        <SegmentedControl.Item value="headless">Headless</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );

    // Assert
    expect(screen.getByRole("radio", { name: "Headless" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it('defaults to horizontal orientation on the root (aria + data)', () => {
    // Arrange & Act
    render(
      <SegmentedControl.Root aria-label="Mode">
        <SegmentedControl.Item value="headless">Headless</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    const root = screen.getByRole("radiogroup", { name: "Mode" });

    // Assert
    expect(root).toHaveAttribute("aria-orientation", "horizontal");
    expect(root).toHaveAttribute("data-orientation", "horizontal");
  });

  it("reflects vertical orientation on the root when requested", () => {
    // Arrange & Act
    render(
      <SegmentedControl.Root aria-label="Mode" orientation="vertical">
        <SegmentedControl.Item value="headless">Headless</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    const root = screen.getByRole("radiogroup", { name: "Mode" });

    // Assert
    expect(root).toHaveAttribute("aria-orientation", "vertical");
    expect(root).toHaveAttribute("data-orientation", "vertical");
  });

  it("does not set data-disabled on the root by default", () => {
    // Arrange & Act
    render(
      <SegmentedControl.Root aria-label="Mode">
        <SegmentedControl.Item value="headless">Headless</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );

    // Assert
    expect(
      screen.getByRole("radiogroup", { name: "Mode" }),
    ).not.toHaveAttribute("data-disabled");
  });

  it("sets a displayName on the compound and Item", () => {
    // Assert — empty displayNames would render each as anonymous in DevTools.
    // Root aliases the compound (Object.assign), so its name is "SegmentedControl".
    expect(SegmentedControl.displayName).toBe("SegmentedControl");
    expect(SegmentedControl.Item.displayName).toBe("SegmentedControlItem");
  });
});
