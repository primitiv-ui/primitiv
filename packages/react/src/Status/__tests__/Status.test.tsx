import { Status } from "../index.ts";
import { render, screen } from "@testing-library/react";

describe("Status component", () => {
  it("should render a div with role status containing its children", () => {
    // Arrange
    render(<Status>3 items added to your cart</Status>);

    // Assert
    const status = screen.getByRole("status");
    expect(status.tagName).toBe("DIV");
    expect(status).toHaveTextContent("3 items added to your cart");
  });

  it("should render the consumer element with asChild, keeping role status", () => {
    // Arrange
    render(
      <Status asChild>
        <section>Saved</section>
      </Status>,
    );

    // Assert
    const status = screen.getByRole("status");
    expect(status.tagName).toBe("SECTION");
    expect(status).toHaveTextContent("Saved");
  });
});
