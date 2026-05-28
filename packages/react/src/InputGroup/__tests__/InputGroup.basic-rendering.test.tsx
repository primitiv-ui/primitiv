import { createRef } from "react";
import { render, screen } from "@testing-library/react";

import { InputGroup } from "../InputGroup";

describe("InputGroup basic rendering", () => {
  it("renders a <div> wrapper element", () => {
    // Arrange & Act
    render(<InputGroup.Root data-testid="group" />);

    // Assert
    expect(screen.getByTestId("group").tagName).toBe("DIV");
  });

  it("sets data-input-group on the root as a CSS styling hook", () => {
    // Arrange & Act
    render(<InputGroup.Root data-testid="group" />);

    // Assert
    expect(screen.getByTestId("group")).toHaveAttribute(
      "data-input-group",
      "",
    );
  });

  it("InputGroup is callable as an alias of InputGroup.Root", () => {
    // Arrange & Act
    render(<InputGroup data-testid="group" />);

    // Assert
    expect(screen.getByTestId("group").tagName).toBe("DIV");
  });

  it("forwards a ref to the root element", () => {
    // Arrange
    const ref = createRef<HTMLDivElement>();

    // Act
    render(<InputGroup.Root data-testid="group" ref={ref} />);

    // Assert
    expect(ref.current).toBe(screen.getByTestId("group"));
  });

  it("renders LeadingAdornment as a <span> with data-input-group-adornment='leading'", () => {
    // Arrange & Act
    render(
      <InputGroup.Root>
        <InputGroup.LeadingAdornment data-testid="lead" />
      </InputGroup.Root>,
    );
    const span = screen.getByTestId("lead");

    // Assert
    expect(span.tagName).toBe("SPAN");
    expect(span).toHaveAttribute("data-input-group-adornment", "leading");
  });

  it("renders TrailingAdornment as a <span> with data-input-group-adornment='trailing'", () => {
    // Arrange & Act
    render(
      <InputGroup.Root>
        <InputGroup.TrailingAdornment data-testid="trail" />
      </InputGroup.Root>,
    );
    const span = screen.getByTestId("trail");

    // Assert
    expect(span.tagName).toBe("SPAN");
    expect(span).toHaveAttribute("data-input-group-adornment", "trailing");
  });

  it("renders children inside the wrapper", () => {
    // Arrange & Act
    render(
      <InputGroup.Root>
        <input aria-label="Search" />
      </InputGroup.Root>,
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Search" })).toBeInTheDocument();
  });

  it("passes through className on the root", () => {
    // Arrange & Act
    render(<InputGroup.Root className="frame" data-testid="g" />);

    // Assert
    expect(screen.getByTestId("g")).toHaveClass("frame");
  });

  it("passes through className on adornments", () => {
    // Arrange & Act
    render(
      <InputGroup.Root>
        <InputGroup.LeadingAdornment className="lead" data-testid="lead" />
        <InputGroup.TrailingAdornment className="trail" data-testid="trail" />
      </InputGroup.Root>,
    );

    // Assert
    expect(screen.getByTestId("lead")).toHaveClass("lead");
    expect(screen.getByTestId("trail")).toHaveClass("trail");
  });
});
