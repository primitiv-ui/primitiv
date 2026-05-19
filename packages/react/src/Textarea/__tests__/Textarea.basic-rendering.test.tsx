import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Textarea } from "../Textarea";

describe("Textarea basic rendering", () => {
  it("renders a <textarea> element", () => {
    // Arrange & Act
    render(<Textarea aria-label="Notes" />);

    // Assert
    expect(screen.getByRole("textbox", { name: "Notes" }).tagName).toBe(
      "TEXTAREA",
    );
  });

  it("forwards a ref to the underlying textarea element (object ref)", () => {
    // Arrange
    const ref = createRef<HTMLTextAreaElement>();

    // Act
    render(<Textarea aria-label="Notes" ref={ref} />);

    // Assert
    expect(ref.current).toBe(screen.getByRole("textbox", { name: "Notes" }));
  });

  it("forwards a ref to the underlying textarea element (function ref)", () => {
    // Arrange
    const received: (HTMLTextAreaElement | null)[] = [];
    const functionRef = (node: HTMLTextAreaElement | null) => {
      received.push(node);
    };

    // Act
    render(<Textarea aria-label="Notes" ref={functionRef} />);

    // Assert
    expect(received).toContain(
      screen.getByRole("textbox", { name: "Notes" }),
    );
  });

  it("reflects a defaultValue", () => {
    // Arrange & Act
    render(<Textarea aria-label="Notes" defaultValue="hello" />);

    // Assert
    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveValue(
      "hello",
    );
  });

  it("passes through textarea attributes (rows, placeholder)", () => {
    // Arrange & Act
    render(<Textarea aria-label="Notes" rows={6} placeholder="Type here" />);
    const textarea = screen.getByRole("textbox", { name: "Notes" });

    // Assert
    expect(textarea).toHaveAttribute("rows", "6");
    expect(textarea).toHaveAttribute("placeholder", "Type here");
  });

  it("passes through aria-* attributes", () => {
    // Arrange & Act
    render(<Textarea aria-label="Notes" aria-invalid />);

    // Assert
    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("passes through data-* attributes", () => {
    // Arrange & Act
    render(<Textarea aria-label="Notes" data-testid="bio" />);

    // Assert
    expect(screen.getByTestId("bio")).toBeInTheDocument();
  });

  it("passes through className", () => {
    // Arrange & Act
    render(<Textarea aria-label="Notes" className="field" />);

    // Assert
    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveAttribute(
      "class",
      "field",
    );
  });

  it("passes through event handlers (onChange)", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea aria-label="Notes" onChange={onChange} />);

    // Act
    await user.type(screen.getByRole("textbox", { name: "Notes" }), "hi");

    // Assert
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
