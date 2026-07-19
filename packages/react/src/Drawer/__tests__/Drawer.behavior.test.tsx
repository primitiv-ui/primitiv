import "./dialog-polyfill";

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";

import { Drawer } from "../Drawer";
import type { DrawerImperativeApi } from "../types";

describe("Drawer — behaviour (delegated to Modal)", () => {
  it("opens on trigger click and closes on Close click", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Drawer.Root>
        <Drawer.Trigger>Open</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Content data-testid="drawer">
            <Drawer.Close>Done</Drawer.Close>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    // closed → the portal renders nothing
    expect(screen.queryByTestId("drawer")).toBeNull();

    // Act — open
    await user.click(screen.getByRole("button", { name: "Open" }));
    // Assert
    expect(screen.getByTestId("drawer")).toHaveAttribute("open");

    // Act — close
    await user.click(screen.getByRole("button", { name: "Done" }));
    // Assert
    expect(screen.queryByTestId("drawer")).toBeNull();
  });

  it("defers to onOpenChange in controlled mode", async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Drawer.Root open={false} onOpenChange={onOpenChange}>
        <Drawer.Trigger>Open</Drawer.Trigger>
      </Drawer.Root>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Open" }));

    // Assert
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("exposes an imperative open/close handle on Root", () => {
    // Arrange
    const ref = createRef<DrawerImperativeApi>();
    render(
      <Drawer.Root ref={ref}>
        <Drawer.Content data-testid="drawer">body</Drawer.Content>
      </Drawer.Root>,
    );
    expect(screen.getByTestId("drawer")).not.toHaveAttribute("open");

    // Act — open
    act(() => ref.current?.open());
    // Assert
    expect(screen.getByTestId("drawer")).toHaveAttribute("open");

    // Act — close
    act(() => ref.current?.close());
    // Assert
    expect(screen.getByTestId("drawer")).not.toHaveAttribute("open");
  });

  it("forwards a ref to the <dialog> and keeps forceMount mounted while closed", () => {
    // Arrange
    const ref = createRef<HTMLDialogElement>();

    // Act
    render(
      <Drawer.Root>
        <Drawer.Portal forceMount>
          <Drawer.Overlay forceMount data-testid="overlay" />
          <Drawer.Content ref={ref} data-testid="drawer">
            body
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>,
    );

    // Assert — forceMount keeps the subtree in the DOM even though closed
    expect(ref.current).toBe(screen.getByTestId("drawer"));
    expect(ref.current?.tagName).toBe("DIALOG");
    expect(screen.getByTestId("overlay")).toHaveAttribute(
      "data-state",
      "closed",
    );
  });
});
