import { createRef } from "react";
import { render, screen } from "@testing-library/react";

import { Button } from "../Button";

describe("Button basic rendering", () => {
  it("renders a <button> element", () => {
    // Arrange & Act
    render(<Button>Save</Button>);

    // Assert
    expect(screen.getByRole("button", { name: "Save" }).tagName).toBe("BUTTON");
  });

  it('defaults to type="button" to prevent accidental form submission', () => {
    // Arrange & Act
    render(<Button>Save</Button>);

    // Assert
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it('allows type="submit" to be set by the consumer', () => {
    // Arrange & Act
    render(<Button type="submit">Send</Button>);

    // Assert
    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it('allows type="reset" to be set by the consumer', () => {
    // Arrange & Act
    render(<Button type="reset">Clear</Button>);

    // Assert
    expect(screen.getByRole("button", { name: "Clear" })).toHaveAttribute(
      "type",
      "reset",
    );
  });

  it("renders arbitrary children", () => {
    // Arrange & Act
    render(
      <Button>
        <span data-testid="icon" aria-hidden="true">★</span>
        Save
      </Button>,
    );

    // Assert
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save/ })).toBeInTheDocument();
  });

  it("forwards a ref to the underlying button element (object ref)", () => {
    // Arrange
    const ref = createRef<HTMLButtonElement>();

    // Act
    render(<Button ref={ref}>Save</Button>);

    // Assert
    expect(ref.current).toBe(screen.getByRole("button", { name: "Save" }));
  });

  it("forwards a ref to the underlying button element (function ref)", () => {
    // Arrange
    const received: (HTMLButtonElement | null)[] = [];
    const functionRef = (node: HTMLButtonElement | null) => {
      received.push(node);
    };

    // Act
    render(<Button ref={functionRef}>Save</Button>);

    // Assert
    expect(received).toContain(screen.getByRole("button", { name: "Save" }));
  });

  it("passes through aria-* attributes", () => {
    // Arrange & Act
    render(<Button aria-label="Close dialog" aria-pressed={false}>✕</Button>);
    const button = screen.getByRole("button", { name: "Close dialog" });

    // Assert
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("passes through data-* attributes", () => {
    // Arrange & Act
    render(<Button data-testid="submit-btn">Save</Button>);

    // Assert
    expect(screen.getByTestId("submit-btn")).toBeInTheDocument();
  });

  it("passes through className", () => {
    // Arrange & Act
    render(<Button className="btn-primary">Save</Button>);

    // Assert
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "class",
      "btn-primary",
    );
  });

  it("passes through event handlers (onClick)", () => {
    // Arrange
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    // Act
    screen.getByRole("button", { name: "Save" }).click();

    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('sets displayName to "Button" for React DevTools and stack traces', () => {
    // Assert — the component's identity is observable in DevTools and error
    // output; an empty displayName would render it as an anonymous component.
    expect(Button.displayName).toBe("Button");
  });
});
