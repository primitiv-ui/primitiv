import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tooltip } from "../Tooltip";

describe("Tooltip — escape hatches", () => {
  it("closes when pointer is pressed outside the content", async () => {
    const user = userEvent.setup();

    render(
      <div>
        <Tooltip.Provider>
          <Tooltip.Root defaultOpen>
            <Tooltip.Trigger>Hover me</Tooltip.Trigger>
            <Tooltip.Content>Tooltip text</Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
        <button>Outside</button>
      </div>,
    );

    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("does not close when pointer is pressed inside the content", async () => {
    const user = userEvent.setup();

    render(
      <Tooltip.Provider>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content>
            <button>Inside</button>
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Inside" }));

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("does not close when onPointerDownOutside calls preventDefault()", async () => {
    const user = userEvent.setup();

    render(
      <div>
        <Tooltip.Provider>
          <Tooltip.Root defaultOpen>
            <Tooltip.Trigger>Hover me</Tooltip.Trigger>
            <Tooltip.Content
              onPointerDownOutside={(e) => e.preventDefault()}
            >
              Tooltip text
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
        <button>Outside</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("does not respond to an outside pointer-down while closed, even when Content is forceMounted", async () => {
    const user = userEvent.setup();
    const onPointerDownOutside = vi.fn();

    render(
      <div>
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger>Hover me</Tooltip.Trigger>
            <Tooltip.Content
              forceMount
              onPointerDownOutside={onPointerDownOutside}
            >
              Tooltip text
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
        <button>Outside</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(onPointerDownOutside).not.toHaveBeenCalled();
  });

  it("removes its document pointerdown listener on unmount", () => {
    const addEventListener = vi.spyOn(document, "addEventListener");
    const removeEventListener = vi.spyOn(document, "removeEventListener");

    const { unmount } = render(
      <Tooltip.Provider>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content>Tooltip text</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );
    const handler = addEventListener.mock.calls.find(
      ([type]) => type === "pointerdown",
    )?.[1];
    unmount();

    expect(handler).toBeTypeOf("function");
    expect(removeEventListener).toHaveBeenCalledWith("pointerdown", handler);

    addEventListener.mockRestore();
    removeEventListener.mockRestore();
  });

  it("closes on an outside pointer-down after opening via hover (the listener effect must re-run once open flips)", async () => {
    const user = userEvent.setup();

    render(
      <div>
        <Tooltip.Provider delayDuration={0}>
          <Tooltip.Root>
            <Tooltip.Trigger>Hover me</Tooltip.Trigger>
            <Tooltip.Content>Tooltip text</Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
        <button>Outside</button>
      </div>,
    );

    await user.hover(screen.getByRole("button", { name: "Hover me" }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});
