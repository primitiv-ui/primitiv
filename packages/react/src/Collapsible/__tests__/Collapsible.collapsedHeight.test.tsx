import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Collapsible } from "../Collapsible";

const VAR = "--primitiv-collapsible-collapsed-height";

describe("Collapsible collapsedHeight (clamped preview)", () => {
  it("keeps the closed panel mounted and un-hidden (a visible preview)", () => {
    // Arrange & Act
    render(
      <Collapsible.Root>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content collapsedHeight={64} data-testid="content">
          Content
        </Collapsible.Content>
      </Collapsible.Root>,
    );
    const content = screen.getByTestId("content");

    // Assert — visible preview, not hidden, not aria-hidden
    expect(content).toBeInTheDocument();
    expect(content).not.toHaveAttribute("hidden");
    expect(content).not.toHaveAttribute("aria-hidden");
    expect(content).toHaveAttribute("data-state", "closed");
  });

  it("publishes a numeric collapsedHeight as a pixel custom property", () => {
    // Arrange & Act
    render(
      <Collapsible.Root>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content collapsedHeight={64} data-testid="content">
          Content
        </Collapsible.Content>
      </Collapsible.Root>,
    );

    // Assert
    expect(
      screen.getByTestId("content").style.getPropertyValue(VAR),
    ).toBe("64px");
  });

  it("uses a string collapsedHeight verbatim as a CSS length", () => {
    // Arrange & Act
    render(
      <Collapsible.Root>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content collapsedHeight="4rem" data-testid="content">
          Content
        </Collapsible.Content>
      </Collapsible.Root>,
    );

    // Assert
    expect(
      screen.getByTestId("content").style.getPropertyValue(VAR),
    ).toBe("4rem");
  });

  it("toggles data-state open/closed while staying mounted", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Collapsible.Root>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content collapsedHeight={64} data-testid="content">
          Content
        </Collapsible.Content>
      </Collapsible.Root>,
    );
    const content = screen.getByTestId("content");

    // Act
    await user.click(screen.getByRole("button", { name: "Toggle" }));

    // Assert — opened, still no hidden/aria-hidden, var still present
    expect(content).toHaveAttribute("data-state", "open");
    expect(content).not.toHaveAttribute("hidden");
    expect(content).not.toHaveAttribute("aria-hidden");
    expect(content.style.getPropertyValue(VAR)).toBe("64px");
  });

  it("merges the custom property with a consumer style", () => {
    // Arrange & Act
    render(
      <Collapsible.Root>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content
          collapsedHeight={64}
          style={{ color: "rgb(1, 2, 3)" }}
          data-testid="content"
        >
          Content
        </Collapsible.Content>
      </Collapsible.Root>,
    );
    const content = screen.getByTestId("content");

    // Assert — both the private var and the consumer's declaration survive
    expect(content.style.getPropertyValue(VAR)).toBe("64px");
    expect(content.style.color).toBe("rgb(1, 2, 3)");
  });

  it("does not aria-hide a clamped panel even when forceMount is also set", () => {
    // Arrange & Act — clamped wins: the preview stays readable, so no
    // aria-hidden despite forceMount being present.
    render(
      <Collapsible.Root>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content
          forceMount
          collapsedHeight={64}
          data-testid="content"
        >
          Content
        </Collapsible.Content>
      </Collapsible.Root>,
    );

    // Assert
    expect(screen.getByTestId("content")).not.toHaveAttribute("aria-hidden");
  });

  it("does not set the custom property when collapsedHeight is omitted", () => {
    // Arrange & Act
    render(
      <Collapsible.Root>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content data-testid="content">Content</Collapsible.Content>
      </Collapsible.Root>,
    );
    const content = screen.getByTestId("content");

    // Assert — default fully-hidden behaviour is untouched
    expect(content.style.getPropertyValue(VAR)).toBe("");
    expect(content).toHaveAttribute("hidden");
  });
});
