import { render, screen } from "@testing-library/react";

import { Fieldset } from "../Fieldset";

describe("Fieldset basic rendering", () => {
  it("renders a <fieldset> element with an implicit group role", () => {
    // Arrange & Act
    render(<Fieldset.Root />);

    // Assert
    expect(screen.getByRole("group").tagName).toBe("FIELDSET");
  });
});
