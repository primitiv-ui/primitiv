import { render, screen } from "@testing-library/react";
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
});
