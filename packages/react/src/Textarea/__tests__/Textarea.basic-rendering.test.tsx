import { render, screen } from "@testing-library/react";

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
});
