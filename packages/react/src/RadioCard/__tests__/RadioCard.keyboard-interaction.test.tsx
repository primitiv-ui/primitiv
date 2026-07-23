import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RadioCard } from "../RadioCard";

describe("RadioCard roving tab stop", () => {
  it("makes the selected item the tab stop even when it is not first", () => {
    // Arrange & Act — Pro is selected but not the first item.
    render(
      <RadioCard.Root aria-label="Plan" defaultValue="pro">
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
        <RadioCard.Item value="pro">Pro</RadioCard.Item>
      </RadioCard.Root>,
    );

    // Assert — selection drives the tab stop; falling back to the first item
    // would strand it on Starter.
    expect(screen.getByRole("radio", { name: "Pro" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByRole("radio", { name: "Starter" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it("unregisters an unmounted item so the home-base tab stop moves", () => {
    // Arrange — nothing selected, so the first item is the home base.
    function Fixture({ items }: { items: string[] }) {
      return (
        <RadioCard.Root aria-label="Plan">
          {items.map((v) => (
            <RadioCard.Item key={v} value={v}>
              {v}
            </RadioCard.Item>
          ))}
        </RadioCard.Root>
      );
    }
    const { rerender } = render(<Fixture items={["starter", "pro"]} />);
    expect(screen.getByRole("radio", { name: "starter" })).toHaveAttribute(
      "tabindex",
      "0",
    );

    // Act — remove "starter"; its effect cleanup must unregister it.
    rerender(<Fixture items={["pro"]} />);

    // Assert — "pro" becomes the home base. A no-op cleanup would leave
    // "starter" registered ahead of it, leaving "pro" at tabindex -1.
    expect(screen.getByRole("radio", { name: "pro" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });
});

describe("RadioCard keyboard interaction", () => {
  it("selects and focuses the next item on ArrowDown", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <RadioCard.Root aria-label="Plan" defaultValue="starter">
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
        <RadioCard.Item value="pro">Pro</RadioCard.Item>
        <RadioCard.Item value="enterprise">Enterprise</RadioCard.Item>
      </RadioCard.Root>,
    );
    const starter = screen.getByRole("radio", { name: "Starter" });
    const pro = screen.getByRole("radio", { name: "Pro" });
    starter.focus();

    // Act
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(pro).toHaveFocus();
    expect(pro).toHaveAttribute("aria-checked", "true");
    expect(starter).toHaveAttribute("aria-checked", "false");
  });

  it("selects and focuses the next item on ArrowRight", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <RadioCard.Root aria-label="Plan" defaultValue="starter">
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
        <RadioCard.Item value="pro">Pro</RadioCard.Item>
      </RadioCard.Root>,
    );
    const starter = screen.getByRole("radio", { name: "Starter" });
    const pro = screen.getByRole("radio", { name: "Pro" });
    starter.focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(pro).toHaveFocus();
    expect(pro).toHaveAttribute("aria-checked", "true");
  });

  it("selects and focuses the previous item on ArrowUp", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <RadioCard.Root aria-label="Plan" defaultValue="pro">
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
        <RadioCard.Item value="pro">Pro</RadioCard.Item>
      </RadioCard.Root>,
    );
    const starter = screen.getByRole("radio", { name: "Starter" });
    const pro = screen.getByRole("radio", { name: "Pro" });
    pro.focus();

    // Act
    await user.keyboard("{ArrowUp}");

    // Assert
    expect(starter).toHaveFocus();
    expect(starter).toHaveAttribute("aria-checked", "true");
  });

  it("selects and focuses the previous item on ArrowLeft", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <RadioCard.Root aria-label="Plan" defaultValue="pro">
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
        <RadioCard.Item value="pro">Pro</RadioCard.Item>
      </RadioCard.Root>,
    );
    const starter = screen.getByRole("radio", { name: "Starter" });
    const pro = screen.getByRole("radio", { name: "Pro" });
    pro.focus();

    // Act
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(starter).toHaveFocus();
    expect(starter).toHaveAttribute("aria-checked", "true");
  });

  it("wraps from last to first on ArrowDown", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <RadioCard.Root aria-label="Plan" defaultValue="pro">
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
        <RadioCard.Item value="pro">Pro</RadioCard.Item>
      </RadioCard.Root>,
    );
    const starter = screen.getByRole("radio", { name: "Starter" });
    const pro = screen.getByRole("radio", { name: "Pro" });
    pro.focus();

    // Act
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(starter).toHaveFocus();
    expect(starter).toHaveAttribute("aria-checked", "true");
  });

  it("wraps from first to last on ArrowUp", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <RadioCard.Root aria-label="Plan" defaultValue="starter">
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
        <RadioCard.Item value="pro">Pro</RadioCard.Item>
      </RadioCard.Root>,
    );
    const starter = screen.getByRole("radio", { name: "Starter" });
    const pro = screen.getByRole("radio", { name: "Pro" });
    starter.focus();

    // Act
    await user.keyboard("{ArrowUp}");

    // Assert
    expect(pro).toHaveFocus();
    expect(pro).toHaveAttribute("aria-checked", "true");
  });

  it("skips disabled items during arrow-key navigation", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <RadioCard.Root aria-label="Plan" defaultValue="starter">
        <RadioCard.Item value="starter">Starter</RadioCard.Item>
        <RadioCard.Item value="pro" disabled>
          Pro
        </RadioCard.Item>
        <RadioCard.Item value="enterprise">Enterprise</RadioCard.Item>
      </RadioCard.Root>,
    );
    const starter = screen.getByRole("radio", { name: "Starter" });
    const enterprise = screen.getByRole("radio", { name: "Enterprise" });
    starter.focus();

    // Act
    await user.keyboard("{ArrowDown}");

    // Assert — skips disabled "pro", lands on "enterprise"
    expect(enterprise).toHaveFocus();
    expect(enterprise).toHaveAttribute("aria-checked", "true");
  });
});
