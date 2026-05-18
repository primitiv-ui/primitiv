import { fireEvent, render, screen } from "@testing-library/react";

import { Avatar } from "../Avatar";

describe("Avatar asChild", () => {
  it("renders the Root as the consumer element when asChild is set", () => {
    // Arrange & Act
    render(
      <Avatar.Root asChild data-testid="root">
        <section />
      </Avatar.Root>,
    );
    const root = screen.getByTestId("root");

    // Assert — section rendered, not span; data-* hook merged onto it
    expect(root.tagName).toBe("SECTION");
    expect(root).toHaveAttribute("data-status", "idle");
  });

  it("renders the Image as the consumer element when asChild is set", () => {
    // Arrange & Act
    render(
      <Avatar.Root>
        <Avatar.Image asChild src="/ada.png" alt="Ada">
          <img data-testid="img" />
        </Avatar.Image>
      </Avatar.Root>,
    );
    const img = screen.getByTestId("img");

    fireEvent.load(img);

    // Assert — consumer's img kept; src and the load lifecycle merged onto it
    expect(img).toHaveAttribute("src", "/ada.png");
    expect(img).toHaveAttribute("data-status", "loaded");
  });

  it("renders the Fallback as the consumer element when asChild is set", () => {
    // Arrange & Act
    render(
      <Avatar.Root>
        <Avatar.Fallback asChild>
          <div data-testid="fb">AL</div>
        </Avatar.Fallback>
      </Avatar.Root>,
    );
    const fb = screen.getByTestId("fb");

    // Assert
    expect(fb.tagName).toBe("DIV");
    expect(fb).toHaveAttribute("data-status", "idle");
  });
});
