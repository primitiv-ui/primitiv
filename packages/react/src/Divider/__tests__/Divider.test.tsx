import { Divider } from "../index.ts";
import { render, screen } from "@testing-library/react";

describe("Divider component", () => {
  it("should render a horizontal divider by default", () => {
    // Arrange
    render(<Divider />);

    // Assert
    const divider = screen.getByRole("separator");
    expect(divider).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("should accept a vertical orientation prop", () => {
    // Arrange
    render(<Divider orientation="vertical" />);

    // Assert
    const divider = screen.getByRole("separator");
    expect(divider).toHaveAttribute("aria-orientation", "vertical");
  });

  it("should accept a className prop", () => {
    // Arrange
    const testClassName = "test-class";
    render(<Divider className={testClassName} />);

    // Assert
    const divider = screen.getByRole("separator");
    expect(divider).toHaveAttribute("class", testClassName);
  });

  it("should have a default className of empty string", () => {
    // Arrange
    render(<Divider />);

    // Assert
    const divider = screen.getByRole("separator");
    expect(divider).toHaveAttribute("class", "");
  });

  it('sets displayName to "Divider" for React DevTools and stack traces', () => {
    // Assert — an empty displayName would render it as an anonymous component.
    expect(Divider.displayName).toBe("Divider");
  });
});
