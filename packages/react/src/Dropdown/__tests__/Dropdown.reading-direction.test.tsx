import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DirectionProvider } from "../../DirectionProvider";
import { Dropdown } from "../Dropdown";

describe("Dropdown reading direction", () => {
  it("opens a sub-menu on ArrowLeft when dir=rtl", async () => {
    // Arrange — in RTL, "forward" on the inline axis is ArrowLeft, so it
    // should open the submenu in place of ArrowRight.
    const user = userEvent.setup();
    render(
      <Dropdown.Root defaultOpen dir="rtl">
        <Dropdown.Trigger>File</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Sub>
            <Dropdown.SubTrigger>Open Recent</Dropdown.SubTrigger>
            <Dropdown.SubContent>
              <Dropdown.Item>Project A</Dropdown.Item>
            </Dropdown.SubContent>
          </Dropdown.Sub>
        </Dropdown.Content>
      </Dropdown.Root>,
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: "Open Recent",
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
      <Dropdown.Root defaultOpen dir="rtl">
        <Dropdown.Trigger>File</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Sub>
            <Dropdown.SubTrigger>Open Recent</Dropdown.SubTrigger>
            <Dropdown.SubContent>
              <Dropdown.Item>Project A</Dropdown.Item>
            </Dropdown.SubContent>
          </Dropdown.Sub>
        </Dropdown.Content>
      </Dropdown.Root>,
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: "Open Recent",
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
      <Dropdown.Root defaultOpen dir="rtl">
        <Dropdown.Trigger>File</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Sub defaultOpen>
            <Dropdown.SubTrigger>Open Recent</Dropdown.SubTrigger>
            <Dropdown.SubContent>
              <Dropdown.Item>Project A</Dropdown.Item>
            </Dropdown.SubContent>
          </Dropdown.Sub>
        </Dropdown.Content>
      </Dropdown.Root>,
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: "Open Recent",
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
        <Dropdown.Root defaultOpen>
          <Dropdown.Trigger>File</Dropdown.Trigger>
          <Dropdown.Content>
            <Dropdown.Sub>
              <Dropdown.SubTrigger>Open Recent</Dropdown.SubTrigger>
              <Dropdown.SubContent>
                <Dropdown.Item>Project A</Dropdown.Item>
              </Dropdown.SubContent>
            </Dropdown.Sub>
          </Dropdown.Content>
        </Dropdown.Root>
      </DirectionProvider>,
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: "Open Recent",
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
        <Dropdown.Root defaultOpen dir="rtl">
          <Dropdown.Trigger>File</Dropdown.Trigger>
          <Dropdown.Content>
            <Dropdown.Sub>
              <Dropdown.SubTrigger>Open Recent</Dropdown.SubTrigger>
              <Dropdown.SubContent>
                <Dropdown.Item>Project A</Dropdown.Item>
              </Dropdown.SubContent>
            </Dropdown.Sub>
          </Dropdown.Content>
        </Dropdown.Root>
      </DirectionProvider>,
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: "Open Recent",
      hidden: true,
    });

    // Act
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(subTrigger).toHaveAttribute("aria-expanded", "true");
  });
});
