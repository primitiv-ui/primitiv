import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Breadcrumb } from "../Breadcrumb";
import { Dropdown } from "../../Dropdown/Dropdown";

describe("Breadcrumb ellipsis", () => {
  it("renders the Ellipsis as a decorative <span> with a default glyph", () => {
    // Arrange & Act
    render(<Breadcrumb.Ellipsis data-testid="ellipsis" />);
    const ellipsis = screen.getByTestId("ellipsis");

    // Assert — presentation + aria-hidden keep it out of the accessibility
    // tree entirely, matching Breadcrumb.Separator's own convention: it is
    // the interactive element composed AROUND it that must carry the
    // accessible name, not this glyph.
    expect(ellipsis.tagName).toBe("SPAN");
    expect(ellipsis).toHaveAttribute("role", "presentation");
    expect(ellipsis).toHaveAttribute("aria-hidden", "true");
    expect(ellipsis).toHaveTextContent("…");
  });

  it("lets the consumer override the Ellipsis glyph", () => {
    // Arrange & Act
    render(
      <Breadcrumb.Ellipsis data-testid="ellipsis">···</Breadcrumb.Ellipsis>,
    );

    // Assert
    expect(screen.getByTestId("ellipsis")).toHaveTextContent("···");
  });

  it("renders Breadcrumb.Ellipsis as the consumer element via asChild, with no wrapping <span>", () => {
    // Arrange & Act
    render(
      <Breadcrumb.Ellipsis asChild>
        <i data-testid="custom-ellipsis" />
      </Breadcrumb.Ellipsis>,
    );
    const ellipsis = screen.getByTestId("custom-ellipsis");

    // Assert — the native <span> is dropped entirely
    expect(ellipsis.tagName).toBe("I");
    expect(ellipsis.closest("span")).toBeNull();
  });

  it("merges Breadcrumb.Ellipsis props onto the asChild element", () => {
    // Arrange & Act
    render(
      <Breadcrumb.Ellipsis asChild className="crumb-ellipsis">
        <i data-testid="custom-ellipsis" />
      </Breadcrumb.Ellipsis>,
    );

    // Assert — role/aria-hidden still land on the consumer's element
    const ellipsis = screen.getByTestId("custom-ellipsis");
    expect(ellipsis).toHaveClass("crumb-ellipsis");
    expect(ellipsis).toHaveAttribute("role", "presentation");
    expect(ellipsis).toHaveAttribute("aria-hidden", "true");
  });

  it("sets a displayName on Ellipsis", () => {
    // Assert — an empty displayName would render it as anonymous in DevTools.
    expect(Breadcrumb.Ellipsis.displayName).toBe("BreadcrumbEllipsis");
  });

  it("composes cleanly as Dropdown.Trigger's asChild child — the trigger owns the interactive element and accessible name, the Ellipsis is purely decorative inside it", async () => {
    // Arrange — the documented composition pattern: the actual <button> is
    // a sibling of the aria-hidden Ellipsis glyph, not the Ellipsis itself,
    // so the button's accessible name comes from the visible text rather
    // than being swallowed by the glyph's own aria-hidden.
    const user = userEvent.setup();
    render(
      <Breadcrumb.Item>
        <Dropdown.Root>
          <Dropdown.Trigger asChild>
            <button type="button" data-testid="overflow-trigger">
              <Breadcrumb.Ellipsis />
              <span>More</span>
            </button>
          </Dropdown.Trigger>
          <Dropdown.Content>
            <Dropdown.Item>Products</Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Root>
      </Breadcrumb.Item>,
    );
    const trigger = screen.getByTestId("overflow-trigger");

    // Assert — ARIA wiring from Dropdown lands on the real button, and its
    // accessible name is the visible "More" text, not swallowed by the
    // aria-hidden ellipsis glyph.
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("button", { name: "More" }),
    ).toBe(trigger);

    // Act
    await user.click(trigger);

    // Assert — the menu opens with the hidden crumb as a real menu item.
    // `hidden: true` because jsdom does not compute Popover-API visibility —
    // the same convention every Dropdown test in this repo already uses.
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("menuitem", { name: "Products", hidden: true }),
    ).toBeInTheDocument();
  });
});
