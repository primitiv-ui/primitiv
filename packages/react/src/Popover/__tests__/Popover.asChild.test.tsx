import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Popover } from "../Popover";

describe("Popover asChild composition", () => {
  it("renders the Trigger as a custom element with the trigger ARIA merged in", () => {
    // Arrange
    render(
      <Popover.Root>
        <Popover.Trigger<HTMLAnchorElement> asChild>
          <a href="#open">Open</a>
        </Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover.Root>,
    );
    const trigger = screen.getByRole("link", { name: "Open" });

    // Assert
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles the popover when the asChild Trigger is clicked and composes the child onClick", async () => {
    // Arrange
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Popover.Root>
        <Popover.Trigger<HTMLAnchorElement> asChild>
          <a href="#open" onClick={onClick}>
            Open
          </a>
        </Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover.Root>,
    );
    const trigger = screen.getByRole("link", { name: "Open" });

    // Act
    await user.click(trigger);

    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("renders the Content as a custom element with the dialog props merged in", () => {
    // Arrange
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content asChild>
          <section data-testid="content">Content</section>
        </Popover.Content>
      </Popover.Root>,
    );
    const content = screen.getByTestId("content");

    // Assert
    expect(content.tagName).toBe("SECTION");
    expect(content).toHaveAttribute("role", "dialog");
    expect(content).toHaveAttribute("popover", "auto");
  });

  it("renders the Close as a custom element that still closes the popover", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content data-testid="content">
          <Popover.Close asChild>
            <a href="#close">Dismiss</a>
          </Popover.Close>
        </Popover.Content>
      </Popover.Root>,
    );

    // Act
    await user.click(screen.getByRole("link", { name: "Dismiss", hidden: true }));

    // Assert
    expect(screen.getByTestId("content")).toHaveAttribute("data-state", "closed");
  });

  it("renders the Anchor as a custom element", () => {
    // Arrange
    render(
      <Popover.Root>
        <Popover.Anchor asChild>
          <label data-testid="anchor">Email</label>
        </Popover.Anchor>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover.Root>,
    );
    const anchor = screen.getByTestId("anchor");

    // Assert
    expect(anchor.tagName).toBe("LABEL");
  });

  it("renders the Title and Description as custom elements with ids still wired", () => {
    // Arrange
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content data-testid="content">
          <Popover.Title asChild>
            <h3>Filters</h3>
          </Popover.Title>
          <Popover.Description asChild>
            <div>Refine below.</div>
          </Popover.Description>
        </Popover.Content>
      </Popover.Root>,
    );
    const content = screen.getByTestId("content");
    const title = screen.getByRole("heading", { name: "Filters", hidden: true });
    const description = screen.getByText("Refine below.");

    // Assert
    expect(title.tagName).toBe("H3");
    expect(content).toHaveAttribute("aria-labelledby", title.id);
    expect(content).toHaveAttribute("aria-describedby", description.id);
  });

  it("forwards a ref to the underlying Trigger element", () => {
    // Arrange
    const ref = createRef<HTMLButtonElement>();
    render(
      <Popover.Root>
        <Popover.Trigger ref={ref}>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover.Root>,
    );

    // Assert
    expect(ref.current).toBe(screen.getByRole("button", { name: "Open" }));
  });

  it("forwards a ref to the underlying Content element without breaking open state", () => {
    // Arrange
    const ref = createRef<HTMLDivElement>();
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content ref={ref} data-testid="content">Content</Popover.Content>
      </Popover.Root>,
    );
    const content = screen.getByTestId("content");

    // Assert
    expect(ref.current).toBe(content);
    expect(content).toHaveAttribute("data-state", "open");
    expect(content).toHaveAttribute("data-popover-open");
  });
});
