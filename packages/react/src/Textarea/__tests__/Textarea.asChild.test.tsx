import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Textarea } from "../Textarea";

describe("Textarea asChild composition", () => {
  it("renders the consumer's element instead of its own <textarea>", () => {
    // Arrange & Act
    render(
      <Textarea asChild aria-label="Bio">
        <textarea data-testid="autosize" />
      </Textarea>,
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Bio" })).toHaveAttribute(
      "data-testid",
      "autosize",
    );
  });

  it("renders exactly one textarea — the child, not an extra wrapper", () => {
    // Arrange & Act
    render(
      <Textarea asChild aria-label="Bio">
        <textarea />
      </Textarea>,
    );

    // Assert
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
  });

  it("merges aria-* props onto the child element", () => {
    // Arrange & Act
    render(
      <Textarea asChild aria-label="Bio" aria-invalid>
        <textarea />
      </Textarea>,
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Bio" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("composes onChange — child handler fires first, then Textarea's", async () => {
    // Arrange
    const user = userEvent.setup();
    const order: string[] = [];
    render(
      <Textarea
        asChild
        aria-label="Bio"
        onChange={() => order.push("textarea")}
      >
        <textarea onChange={() => order.push("child")} />
      </Textarea>,
    );

    // Act
    await user.type(screen.getByRole("textbox", { name: "Bio" }), "x");

    // Assert
    expect(order).toEqual(["child", "textarea"]);
  });

  it("forwards a ref to the child element", () => {
    // Arrange
    const ref = createRef<HTMLTextAreaElement>();

    // Act
    render(
      <Textarea asChild aria-label="Bio" ref={ref}>
        <textarea />
      </Textarea>,
    );

    // Assert
    expect(ref.current).toBe(screen.getByRole("textbox", { name: "Bio" }));
  });
});
