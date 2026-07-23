import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Accordion } from "../Accordion";

describe("Accordion asChild tests", () => {
  it("should render the child element instead of a <button> when asChild is true", () => {
    // Arrange
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger asChild>
              <a href="#section-1">Section 1</a>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );

    // Assert — an anchor is rendered, not a button
    const trigger = screen.getByRole("link", { name: "Section 1" });
    expect(trigger.tagName).toBe("A");
    expect(trigger).toHaveAttribute("href", "#section-1");
  });

  it("should merge ARIA attributes (aria-expanded, aria-controls, id) onto the child element when asChild is true", () => {
    // Arrange
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger asChild>
              <a href="#section-1">Section 1</a>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );

    const trigger = screen.getByRole("link", { name: "Section 1" });

    // Assert
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls");
    expect(trigger).toHaveAttribute("id");
  });

  it("should compose child onClick with accordion toggle when asChild is true", async () => {
    // Arrange
    const user = userEvent.setup();
    const childClick = vi.fn();
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger asChild>
              <button type="button" onClick={childClick}>
                Section 1
              </button>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content 1</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Section 1" });

    // Act
    await user.click(trigger);

    // Assert — child handler fires and panel toggles
    expect(childClick).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("should forward ref to the child DOM element when asChild is true", () => {
    // Arrange
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger asChild ref={ref}>
              <a href="#section-1">Section 1</a>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );

    // Assert
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe("A");
  });

  it("should forward ref to the underlying button element when asChild is false", () => {
    // Arrange
    const ref = createRef<HTMLButtonElement>();
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger ref={ref}>Section 1</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );

    // Assert
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe("BUTTON");
  });

  it("should toggle the accordion when Enter is pressed on an asChild anchor element", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger asChild>
              <a href="#section-1">Section 1</a>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content 1</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const trigger = screen.getByRole("link", { name: "Section 1" });

    // Act
    trigger.focus();
    await user.keyboard("[Enter]");

    // Assert
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("should toggle the accordion when Space is pressed on an asChild anchor element", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger asChild>
              <a href="#section-1">Section 1</a>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content 1</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const trigger = screen.getByRole("link", { name: "Section 1" });

    // Act
    trigger.focus();
    await user.keyboard(" ");

    // Assert
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("should not toggle the accordion when Enter is pressed on a disabled asChild anchor element", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger asChild disabled>
              <a href="#section-1">Section 1</a>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content 1</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    // disabled asChild gets role="button" injected, so query by button role
    const trigger = screen.getByRole("button", { name: "Section 1" });

    // Act
    trigger.focus();
    await user.keyboard("[Enter]");

    // Assert
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("should apply role='button' when asChild is true and disabled is true", () => {
    // Arrange
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger asChild disabled>
              <a href="#section-1">Section 1</a>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );

    // Assert — role="button" injected so aria-disabled is semantically valid on a non-button
    const trigger = screen.getByRole("button", { name: "Section 1" });
    expect(trigger.tagName).toBe("A");
    expect(trigger).toHaveAttribute("aria-disabled", "true");
  });

  it("should NOT apply role='button' when asChild is true and disabled is false", () => {
    // Arrange
    render(
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger asChild>
              <a href="#section-1">Section 1</a>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );

    const trigger = screen.getByRole("link", { name: "Section 1" });

    // Assert — no role="button" injected on enabled asChild elements
    expect(trigger).not.toHaveAttribute("role", "button");
  });

  // A plain <div> (no native button semantics, no role) fires no synthetic
  // click on Enter/Space, so these isolate the Trigger's own keydown handler —
  // a native <button> or anchor would toggle via click even if the handler did
  // nothing, masking mutations in it.
  it("toggles on Enter for a non-native asChild element", async () => {
    const user = userEvent.setup();
    render(
      <Accordion.Root>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger asChild>
              <div tabIndex={0} data-testid="trigger">
                Toggle
              </div>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content data-testid="content">Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    screen.getByTestId("trigger").focus();
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("content")).toBeVisible();
  });

  it("toggles on Space for a non-native asChild element", async () => {
    const user = userEvent.setup();
    render(
      <Accordion.Root>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger asChild>
              <div tabIndex={0} data-testid="trigger">
                Toggle
              </div>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content data-testid="content">Content</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>,
    );
    screen.getByTestId("trigger").focus();
    await user.keyboard(" ");
    expect(screen.getByTestId("content")).toBeVisible();
  });
});
