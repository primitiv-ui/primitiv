import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ContextMenu } from "../ContextMenu";

describe("ContextMenu.Sub", () => {
  it("renders SubTrigger as role=menuitem with aria-haspopup=menu and aria-expanded=false when the sub is closed", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>More</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Nested</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Assert
    const subTrigger = screen.getByRole("menuitem", {
      name: "More",
      hidden: true,
    });
    expect(subTrigger).toHaveAttribute("aria-haspopup", "menu");
    expect(subTrigger).toHaveAttribute("aria-expanded", "false");
    expect(subTrigger).toHaveAttribute("aria-controls");
  });

  it("wires aria-controls on the SubTrigger to the SubContent's id", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Sub defaultOpen>
            <ContextMenu.SubTrigger>More</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Nested</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Assert
    const subTrigger = screen.getByRole("menuitem", {
      name: "More",
      hidden: true,
    });
    const [, subMenu] = screen.getAllByRole("menu", { hidden: true });
    expect(subMenu.id).toBeTruthy();
    expect(subTrigger).toHaveAttribute("aria-controls", subMenu.id);
    expect(subTrigger).toHaveAttribute("aria-expanded", "true");
  });

  it("opens the sub-menu on ArrowRight from the SubTrigger", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>More</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Nested</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: "More",
      hidden: true,
    });
    expect(subTrigger).toHaveAttribute("aria-expanded", "false");

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(subTrigger).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the sub-menu on ArrowLeft and returns focus to the SubTrigger", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Sub defaultOpen>
            <ContextMenu.SubTrigger>More</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Nested</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: "More",
      hidden: true,
    });

    // Act
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(subTrigger).toHaveAttribute("aria-expanded", "false");
    expect(subTrigger).toHaveFocus();
  });

  it("opens the sub-menu when the pointer enters the SubTrigger", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>More</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Nested</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: "More",
      hidden: true,
    });

    // Act
    await user.hover(subTrigger);

    // Assert
    expect(subTrigger).toHaveAttribute("aria-expanded", "true");
  });

  it("throws when SubTrigger is rendered outside a Sub", () => {
    // Arrange
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act + Assert
    expect(() =>
      render(
        <ContextMenu.Root defaultOpen>
          <ContextMenu.Trigger>Area</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.SubTrigger>More</ContextMenu.SubTrigger>
          </ContextMenu.Content>
        </ContextMenu.Root>,
      ),
    ).toThrow(/SubTrigger.*<ContextMenu\.Sub>/);

    spy.mockRestore();
  });

  it("disables ArrowRight, click, and hover when SubTrigger is disabled", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger disabled>More</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Nested</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: "More",
      hidden: true,
    });

    // Act
    await user.hover(subTrigger);

    // Assert
    expect(subTrigger).toHaveAttribute("aria-disabled", "true");
    expect(subTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the nested Sub when an item inside the SubContent is activated, so the sub state does not leak to the next open", async () => {
    // Repro: open menu, hover into the sub, click an item inside. The whole
    // menu closes. If the sub's own state were left stale, re-opening the
    // menu would briefly render the sub popover before anything else closed
    // it — a real-browser flash in the top-left corner.
    const user = userEvent.setup();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>Share</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Email</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: "Share",
      hidden: true,
    });

    // Act — hover opens the sub, then activate a nested item
    await user.hover(subTrigger);
    expect(subTrigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(
      screen.getByRole("menuitem", { name: "Email", hidden: true }),
    );

    // Assert — the sub's open must have collapsed alongside the root close
    expect(subTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes a stale nested Sub when the parent menu closes via outside click", async () => {
    // Same leak shape via a different close path: outside-click dismisses
    // the menu while a sub is open. The sub must collapse with it.
    const user = userEvent.setup();
    render(
      <div>
        <ContextMenu.Root defaultOpen>
          <ContextMenu.Trigger>Area</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger>Share</ContextMenu.SubTrigger>
              <ContextMenu.SubContent>
                <ContextMenu.Item>Email</ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Sub>
          </ContextMenu.Content>
        </ContextMenu.Root>
        <button type="button">Outside</button>
      </div>,
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: "Share",
      hidden: true,
    });
    await user.hover(subTrigger);
    expect(subTrigger).toHaveAttribute("aria-expanded", "true");

    // Act
    await user.click(screen.getByText("Outside"));

    // Assert
    expect(subTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the sub-menu when the SubTrigger is clicked", () => {
    // Arrange
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>More</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Nested</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: "More",
      hidden: true,
    });

    // Act
    fireEvent.click(subTrigger);

    // Assert
    expect(subTrigger).toHaveAttribute("aria-expanded", "true");
  });

  it("does not open on click when the SubTrigger is disabled", () => {
    // Arrange
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger disabled>More</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Nested</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: "More",
      hidden: true,
    });

    // Act
    fireEvent.click(subTrigger);

    // Assert
    expect(subTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("ignores the open arrow key when the SubTrigger is disabled", () => {
    // Arrange
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger disabled>More</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Nested</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: "More",
      hidden: true,
    });

    // Act
    fireEvent.keyDown(subTrigger, { key: "ArrowRight" });

    // Assert
    expect(subTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes an already-open sibling sub when a second sub opens via click", () => {
    // The hover path closes the prior sub up front via closeSiblingSub; opening
    // by click skips that, so the sub's own registration effect must supplant
    // the previously registered sibling instead.
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>Share</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Email</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>Move to</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Trash</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const a = screen.getByRole("menuitem", { name: "Share", hidden: true });
    const b = screen.getByRole("menuitem", { name: "Move to", hidden: true });

    // Act — click opens A, then clicking B must supplant A.
    fireEvent.click(a);
    expect(a).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(b);

    // Assert
    expect(a).toHaveAttribute("aria-expanded", "false");
    expect(b).toHaveAttribute("aria-expanded", "true");
  });

  it("leaves the sub-menu open when a non-close key is pressed inside the SubContent", () => {
    // Arrange
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Sub defaultOpen>
            <ContextMenu.SubTrigger>More</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Nested</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: "More",
      hidden: true,
    });
    const [, subMenu] = screen.getAllByRole("menu", { hidden: true });

    // Act — a key other than the close (inline-backward) key must be ignored.
    fireEvent.keyDown(subMenu, { key: "ArrowDown" });

    // Assert
    expect(subTrigger).toHaveAttribute("aria-expanded", "true");
  });
});
