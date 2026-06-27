import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { InputGroup } from "../InputGroup";

describe("InputGroup asChild composition", () => {
  it("Root asChild renders the consumer element with data-input-group merged on", () => {
    // Arrange & Act
    render(
      <InputGroup.Root asChild data-testid="group">
        <label />
      </InputGroup.Root>,
    );
    const root = screen.getByTestId("group");

    // Assert
    expect(root.tagName).toBe("LABEL");
    expect(root).toHaveAttribute("data-input-group", "");
  });

  it("LeadingAdornment asChild renders the consumer element with the leading data attribute", () => {
    // Arrange & Act
    render(
      <InputGroup.Root>
        <InputGroup.LeadingAdornment asChild data-testid="lead">
          <button type="button">Search</button>
        </InputGroup.LeadingAdornment>
      </InputGroup.Root>,
    );
    const lead = screen.getByTestId("lead");

    // Assert
    expect(lead.tagName).toBe("BUTTON");
    expect(lead).toHaveAttribute("data-input-group-adornment", "leading");
  });

  it("TrailingAdornment asChild renders the consumer element with the trailing data attribute", () => {
    // Arrange & Act
    render(
      <InputGroup.Root>
        <InputGroup.TrailingAdornment asChild data-testid="trail">
          <button type="button">Clear</button>
        </InputGroup.TrailingAdornment>
      </InputGroup.Root>,
    );
    const trail = screen.getByTestId("trail");

    // Assert
    expect(trail.tagName).toBe("BUTTON");
    expect(trail).toHaveAttribute("data-input-group-adornment", "trailing");
  });

  it("composes onClick when an adornment wraps a button via asChild", async () => {
    // Arrange
    const user = userEvent.setup();
    const order: string[] = [];
    render(
      <InputGroup.Root>
        <InputGroup.TrailingAdornment
          asChild
          onClick={() => order.push("adornment")}
        >
          <button type="button" onClick={() => order.push("child")}>
            Clear
          </button>
        </InputGroup.TrailingAdornment>
      </InputGroup.Root>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Clear" }));

    // Assert
    expect(order).toEqual(["child", "adornment"]);
  });

  it("forwards a ref through Slot on the Root", () => {
    // Arrange: Root types its ref as HTMLDivElement (its default element); the
    // asChild <label> still receives it, which the identity assertion confirms.
    const ref = createRef<HTMLDivElement>();

    // Act
    render(
      <InputGroup.Root asChild data-testid="group" ref={ref}>
        <label />
      </InputGroup.Root>,
    );

    // Assert
    expect(ref.current).toBe(screen.getByTestId("group"));
  });

  it("forwards a ref through Slot on an Adornment", () => {
    // Arrange
    const ref = createRef<HTMLButtonElement>();

    // Act
    render(
      <InputGroup.Root>
        <InputGroup.TrailingAdornment asChild ref={ref}>
          <button type="button">Clear</button>
        </InputGroup.TrailingAdornment>
      </InputGroup.Root>,
    );

    // Assert
    expect(ref.current).toBe(screen.getByRole("button", { name: "Clear" }));
  });
});
