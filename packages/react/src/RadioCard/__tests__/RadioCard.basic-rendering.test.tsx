import { render, screen } from "@testing-library/react";

import { RadioCard } from "../RadioCard";

describe("RadioCard basic rendering", () => {
  it('renders a container with role="radiogroup"', () => {
    // Arrange & Act
    render(
      <RadioCard.Root aria-label="Plan">
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
      </RadioCard.Root>,
    );

    // Assert
    expect(
      screen.getByRole("radiogroup", { name: "Plan" }),
    ).toBeInTheDocument();
  });

  it('renders each item as a <button role="radio"> with aria-checked="false" by default', () => {
    // Arrange & Act
    render(
      <RadioCard.Root aria-label="Plan">
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
        <RadioCard.Item value="pro">Pro</RadioCard.Item>
      </RadioCard.Root>,
    );
    const starter = screen.getByRole("radio", { name: "Starter" });
    const pro = screen.getByRole("radio", { name: "Pro" });

    // Assert
    expect(starter.tagName).toBe("BUTTON");
    expect(starter).toHaveAttribute("aria-checked", "false");
    expect(pro.tagName).toBe("BUTTON");
    expect(pro).toHaveAttribute("aria-checked", "false");
  });

  it('defaults type="button" on items so they never submit an enclosing form', () => {
    // Arrange & Act
    render(
      <RadioCard.Root aria-label="Plan">
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
      </RadioCard.Root>,
    );

    // Assert
    expect(screen.getByRole("radio", { name: "Starter" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it('sets data-state="unchecked" on each item when nothing is selected', () => {
    // Arrange & Act
    render(
      <RadioCard.Root aria-label="Plan">
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
        <RadioCard.Item value="pro">Pro</RadioCard.Item>
      </RadioCard.Root>,
    );

    // Assert
    expect(screen.getByRole("radio", { name: "Starter" })).toHaveAttribute(
      "data-state",
      "unchecked",
    );
    expect(screen.getByRole("radio", { name: "Pro" })).toHaveAttribute(
      "data-state",
      "unchecked",
    );
  });

  it("renders children inside the card item", () => {
    // Arrange & Act
    render(
      <RadioCard.Root aria-label="Plan">
        <RadioCard.Item value="pro">
          <span data-testid="icon">icon</span>
          Pro plan
        </RadioCard.Item>
      </RadioCard.Root>,
    );

    // Assert
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("sets a displayName on the compound, Item, and Indicator", () => {
    // Assert — empty displayNames would render each as anonymous in DevTools.
    // Root aliases the compound (Object.assign), so its name is "RadioCard".
    expect(RadioCard.displayName).toBe("RadioCard");
    expect(RadioCard.Item.displayName).toBe("RadioCardItem");
    expect(RadioCard.Indicator.displayName).toBe("RadioCardIndicator");
  });
});
