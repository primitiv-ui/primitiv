import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Input } from "../Input";

describe("Input basic rendering", () => {
  it("renders an <input> element", () => {
    // Arrange & Act
    render(<Input aria-label="Email" />);

    // Assert
    expect(screen.getByRole("textbox", { name: "Email" }).tagName).toBe(
      "INPUT",
    );
  });

  it("defaults to type='text'", () => {
    // Arrange & Act
    render(<Input aria-label="Email" />);

    // Assert
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "type",
      "text",
    );
  });

  it("forwards a ref to the underlying input element (object ref)", () => {
    // Arrange
    const ref = createRef<HTMLInputElement>();

    // Act
    render(<Input aria-label="Email" ref={ref} />);

    // Assert
    expect(ref.current).toBe(screen.getByRole("textbox", { name: "Email" }));
  });

  it("forwards a ref to the underlying input element (function ref)", () => {
    // Arrange
    const received: (HTMLInputElement | null)[] = [];
    const functionRef = (node: HTMLInputElement | null) => {
      received.push(node);
    };

    // Act
    render(<Input aria-label="Email" ref={functionRef} />);

    // Assert
    expect(received).toContain(screen.getByRole("textbox", { name: "Email" }));
  });

  it("reflects a defaultValue", () => {
    // Arrange & Act
    render(<Input aria-label="Email" defaultValue="hi@example.com" />);

    // Assert
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue(
      "hi@example.com",
    );
  });

  it("passes through input attributes (placeholder, name)", () => {
    // Arrange & Act
    render(
      <Input aria-label="Email" placeholder="you@example.com" name="email" />,
    );
    const input = screen.getByRole("textbox", { name: "Email" });

    // Assert
    expect(input).toHaveAttribute("placeholder", "you@example.com");
    expect(input).toHaveAttribute("name", "email");
  });

  it("passes through aria-* attributes", () => {
    // Arrange & Act
    render(<Input aria-label="Email" aria-invalid />);

    // Assert
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("passes through data-* attributes", () => {
    // Arrange & Act
    render(<Input aria-label="Email" data-testid="email" />);

    // Assert
    expect(screen.getByTestId("email")).toBeInTheDocument();
  });

  it("passes through className", () => {
    // Arrange & Act
    render(<Input aria-label="Email" className="field" />);

    // Assert
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "class",
      "field",
    );
  });

  it("passes through event handlers (onChange)", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input aria-label="Email" onChange={onChange} />);

    // Act
    await user.type(screen.getByRole("textbox", { name: "Email" }), "hi");

    // Assert
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
