import { render, screen } from "@testing-library/react";

import { Fieldset } from "../Fieldset";

describe("Fieldset basic rendering", () => {
  it("renders a <fieldset> element with an implicit group role", () => {
    // Arrange & Act
    render(<Fieldset.Root />);

    // Assert
    expect(screen.getByRole("group").tagName).toBe("FIELDSET");
  });

  it("Fieldset is callable as an alias of Fieldset.Root", () => {
    // Arrange & Act
    render(<Fieldset />);

    // Assert
    expect(screen.getByRole("group").tagName).toBe("FIELDSET");
  });

  it("renders Fieldset.Legend as a <legend> element", () => {
    // Arrange & Act
    render(
      <Fieldset.Root>
        <Fieldset.Legend>Shipping address</Fieldset.Legend>
      </Fieldset.Root>,
    );

    // Assert
    expect(screen.getByText("Shipping address").tagName).toBe("LEGEND");
  });

  it("uses the legend as the group's accessible name", () => {
    // Arrange & Act
    render(
      <Fieldset.Root>
        <Fieldset.Legend>Contact details</Fieldset.Legend>
      </Fieldset.Root>,
    );

    // Assert
    expect(
      screen.getByRole("group", { name: "Contact details" }),
    ).toBeInTheDocument();
  });

  it("renders children inside the fieldset", () => {
    // Arrange & Act
    render(
      <Fieldset.Root>
        <input data-testid="field" />
      </Fieldset.Root>,
    );

    // Assert
    expect(screen.getByRole("group")).toContainElement(
      screen.getByTestId("field"),
    );
  });

  it("passes through className and data-* attributes on the root", () => {
    // Arrange & Act
    render(<Fieldset.Root className="group" data-testid="fs" />);

    // Assert
    expect(screen.getByTestId("fs")).toHaveClass("group");
  });

  it("passes through props on the legend", () => {
    // Arrange & Act
    render(
      <Fieldset.Root>
        <Fieldset.Legend className="group__legend">Billing</Fieldset.Legend>
      </Fieldset.Root>,
    );

    // Assert
    expect(screen.getByText("Billing")).toHaveClass("group__legend");
  });

  it("sets a displayName on the compound and Legend", () => {
    // Assert — empty displayNames would render each as anonymous in DevTools.
    // `Fieldset`, `Fieldset.Root`, and the underlying function are one object
    // (Object.assign compound), so the compound's "Fieldset" alias is the
    // observable Root displayName; Legend is a distinct object.
    expect(Fieldset.displayName).toBe("Fieldset");
    expect(Fieldset.Legend.displayName).toBe("FieldsetLegend");
  });
});
