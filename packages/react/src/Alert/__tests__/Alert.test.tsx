import { Alert } from "../index.ts";
import { render, screen } from "@testing-library/react";

describe("Alert component", () => {
  it("should render a div with role alert containing its children", () => {
    // Arrange
    render(<Alert>Your changes could not be saved</Alert>);

    // Assert
    const alert = screen.getByRole("alert");
    expect(alert.tagName).toBe("DIV");
    expect(alert).toHaveTextContent("Your changes could not be saved");
  });

  it("should render the consumer element with asChild, keeping role alert", () => {
    // Arrange
    render(
      <Alert asChild>
        <section>Upload failed</section>
      </Alert>,
    );

    // Assert
    const alert = screen.getByRole("alert");
    expect(alert.tagName).toBe("SECTION");
    expect(alert).toHaveTextContent("Upload failed");
  });

  it('sets displayName to "Alert" for React DevTools and stack traces', () => {
    // Assert — an empty displayName would render it as an anonymous component.
    expect(Alert.displayName).toBe("Alert");
  });
});
