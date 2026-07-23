import { render, screen } from "@testing-library/react";

import { RadioGroup } from "../RadioGroup";

describe("RadioGroup basic rendering", () => {
  it('renders a container with role="radiogroup"', () => {
    // Arrange & Act
    render(
      <RadioGroup.Root aria-label="Colour">
        <RadioGroup.Item value="red">Red</RadioGroup.Item>
      </RadioGroup.Root>,
    );

    // Assert
    expect(
      screen.getByRole("radiogroup", { name: "Colour" }),
    ).toBeInTheDocument();
  });

  it('renders each item as a <button role="radio"> with aria-checked="false" by default', () => {
    // Arrange & Act
    render(
      <RadioGroup.Root aria-label="Colour">
        <RadioGroup.Item value="red">Red</RadioGroup.Item>
        <RadioGroup.Item value="blue">Blue</RadioGroup.Item>
      </RadioGroup.Root>,
    );
    const red = screen.getByRole("radio", { name: "Red" });
    const blue = screen.getByRole("radio", { name: "Blue" });

    // Assert
    expect(red.tagName).toBe("BUTTON");
    expect(red).toHaveAttribute("aria-checked", "false");
    expect(blue.tagName).toBe("BUTTON");
    expect(blue).toHaveAttribute("aria-checked", "false");
  });

  it('defaults type="button" on items so they never submit an enclosing form', () => {
    // Arrange & Act
    render(
      <RadioGroup.Root aria-label="Colour">
        <RadioGroup.Item value="red">Red</RadioGroup.Item>
      </RadioGroup.Root>,
    );

    // Assert
    expect(screen.getByRole("radio", { name: "Red" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it('sets data-state="unchecked" on each item when nothing is selected', () => {
    // Arrange & Act
    render(
      <RadioGroup.Root aria-label="Colour">
        <RadioGroup.Item value="red">Red</RadioGroup.Item>
        <RadioGroup.Item value="blue">Blue</RadioGroup.Item>
      </RadioGroup.Root>,
    );

    // Assert
    expect(screen.getByRole("radio", { name: "Red" })).toHaveAttribute(
      "data-state",
      "unchecked",
    );
    expect(screen.getByRole("radio", { name: "Blue" })).toHaveAttribute(
      "data-state",
      "unchecked",
    );
  });

  it("sets a displayName on the compound, Item, and Indicator", () => {
    // Assert — empty displayNames would render each as anonymous in DevTools.
    // Root aliases the compound (Object.assign), so its name is "RadioGroup".
    expect(RadioGroup.displayName).toBe("RadioGroup");
    expect(RadioGroup.Item.displayName).toBe("RadioGroupItem");
    expect(RadioGroup.Indicator.displayName).toBe("RadioGroupIndicator");
  });
});
