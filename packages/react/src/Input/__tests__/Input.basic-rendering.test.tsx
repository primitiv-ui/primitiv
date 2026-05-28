import { render, screen } from "@testing-library/react";

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
});
