import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Input } from "../Input";

describe("Input asChild composition", () => {
  it("renders the consumer's element instead of its own <input>", () => {
    // Arrange & Act
    render(
      <Input asChild aria-label="Email">
        <input data-testid="custom" />
      </Input>,
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "data-testid",
      "custom",
    );
  });

  it("renders exactly one input — the child, not an extra wrapper", () => {
    // Arrange & Act
    render(
      <Input asChild aria-label="Email">
        <input />
      </Input>,
    );

    // Assert
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
  });

  it("merges aria-* props onto the child element", () => {
    // Arrange & Act
    render(
      <Input asChild aria-label="Email" aria-invalid>
        <input />
      </Input>,
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("composes onChange — child handler fires first, then Input's", async () => {
    // Arrange
    const user = userEvent.setup();
    const order: string[] = [];
    render(
      <Input
        asChild
        aria-label="Email"
        onChange={() => order.push("input")}
      >
        <input onChange={() => order.push("child")} />
      </Input>,
    );

    // Act
    await user.type(screen.getByRole("textbox", { name: "Email" }), "x");

    // Assert
    expect(order).toEqual(["child", "input"]);
  });

  it("forwards a ref to the child element", () => {
    // Arrange
    const ref = createRef<HTMLInputElement>();

    // Act
    render(
      <Input asChild aria-label="Email" ref={ref}>
        <input />
      </Input>,
    );

    // Assert
    expect(ref.current).toBe(screen.getByRole("textbox", { name: "Email" }));
  });
});
