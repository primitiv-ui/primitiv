import { createRef } from "react";
import { render, screen } from "@testing-library/react";

import { Checkbox } from "../Checkbox";

describe("Checkbox basic rendering", () => {
  it("renders a real native <input type=checkbox> as the control", () => {
    // Arrange & Act
    render(<Checkbox.Root aria-label="Accept terms" />);
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });

    // Assert
    expect(checkbox.tagName).toBe("INPUT");
    expect(checkbox).toHaveAttribute("type", "checkbox");
  });

  it("wraps the input in a <label> so the visible box is clickable", () => {
    // Arrange & Act
    render(<Checkbox.Root aria-label="Accept terms" />);

    // Assert
    expect(
      screen.getByRole("checkbox", { name: "Accept terms" }).closest("label"),
    ).not.toBeNull();
  });

  it("is unchecked by default", () => {
    // Arrange & Act
    render(<Checkbox.Root aria-label="Accept terms" />);

    // Assert
    expect(screen.getByRole("checkbox", { name: "Accept terms" })).not.toBeChecked();
  });

  it("forwards native input attributes (name, value, id) to the input", () => {
    // Arrange & Act
    render(
      <Checkbox.Root id="c1" name="terms" value="accepted" aria-label="Accept terms" />,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });

    // Assert
    expect(checkbox).toHaveAttribute("id", "c1");
    expect(checkbox).toHaveAttribute("name", "terms");
    expect(checkbox).toHaveAttribute("value", "accepted");
  });

  it("applies className to the box, not the hidden input", () => {
    // Arrange & Act
    render(<Checkbox.Root className="box" aria-label="Accept terms" />);
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });

    // Assert
    expect(checkbox).not.toHaveClass("box");
    expect(checkbox.closest("label")).toHaveClass("box");
  });

  it("forwards a ref to the underlying input", () => {
    // Arrange
    const ref = createRef<HTMLInputElement>();

    // Act
    render(<Checkbox.Root ref={ref} aria-label="Accept terms" />);

    // Assert
    expect(ref.current).toBe(screen.getByRole("checkbox", { name: "Accept terms" }));
  });

  it('sets data-state="unchecked" on the box when unchecked', () => {
    // Arrange & Act
    const { container } = render(<Checkbox.Root aria-label="Accept terms" />);

    // Assert
    expect(container.querySelector("label")).toHaveAttribute(
      "data-state",
      "unchecked",
    );
  });

  it("sets a displayName on the compound and the Indicator", () => {
    // Assert — empty displayNames would render each as anonymous in DevTools.
    // Root aliases the compound (Object.assign), so its name is "Checkbox".
    expect(Checkbox.displayName).toBe("Checkbox");
    expect(Checkbox.Indicator.displayName).toBe("CheckboxIndicator");
  });

  it("throws a helpful error when a sub-component renders outside Checkbox.Root", () => {
    // Assert — the strict-context guard names the required parent.
    expect(() => render(<Checkbox.Indicator />)).toThrow(
      "Checkbox sub-components must be rendered inside a <Checkbox.Root>.",
    );
  });
});
