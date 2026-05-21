import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DirectionProvider } from "../../DirectionProvider";
import { ContextMenu } from "../ContextMenu";

describe("ContextMenu reading direction", () => {
  it("opens a sub-menu on ArrowLeft when dir=rtl", async () => {
    // Arrange — in RTL the inline-forward arrow is ArrowLeft.
    const user = userEvent.setup();
    render(
      <ContextMenu.Root defaultOpen dir="rtl">
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

    // Act
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(subTrigger).toHaveAttribute("aria-expanded", "true");
  });

  it("does not open the sub-menu on ArrowRight when dir=rtl", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <ContextMenu.Root defaultOpen dir="rtl">
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

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(subTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the sub-menu on ArrowRight when dir=rtl", async () => {
    // Arrange — focus auto-lands inside the open sub-content.
    const user = userEvent.setup();
    render(
      <ContextMenu.Root defaultOpen dir="rtl">
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Sub defaultOpen>
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

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(subTrigger).toHaveAttribute("aria-expanded", "false");
    expect(subTrigger).toHaveFocus();
  });

  it("inherits dir=rtl from a DirectionProvider when no dir prop is passed on Root", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DirectionProvider dir="rtl">
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
      </DirectionProvider>,
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: "Share",
      hidden: true,
    });

    // Act
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(subTrigger).toHaveAttribute("aria-expanded", "true");
  });

  it("lets an explicit dir prop on Root override the inherited DirectionProvider value", async () => {
    // Arrange — provider says ltr but Root says rtl; rtl wins.
    const user = userEvent.setup();
    render(
      <DirectionProvider dir="ltr">
        <ContextMenu.Root defaultOpen dir="rtl">
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
      </DirectionProvider>,
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: "Share",
      hidden: true,
    });

    // Act
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(subTrigger).toHaveAttribute("aria-expanded", "true");
  });
});
