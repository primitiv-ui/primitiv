import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tooltip } from "../Tooltip";

describe("Tooltip — keyboard interaction", () => {
  it("closes when Escape is pressed while the tooltip is open", async () => {
    const user = userEvent.setup();

    render(
      <Tooltip.Provider>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger>Focusable</Tooltip.Trigger>
          <Tooltip.Content>Tooltip text</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("fires onEscapeKeyDown when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onEscapeKeyDown = vi.fn();

    render(
      <Tooltip.Provider>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger>Focusable</Tooltip.Trigger>
          <Tooltip.Content onEscapeKeyDown={onEscapeKeyDown}>
            Tooltip text
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    await user.keyboard("{Escape}");

    expect(onEscapeKeyDown).toHaveBeenCalledTimes(1);
  });

  it("keeps the tooltip open when onEscapeKeyDown calls preventDefault()", async () => {
    const user = userEvent.setup();

    render(
      <Tooltip.Provider>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger>Focusable</Tooltip.Trigger>
          <Tooltip.Content
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            Tooltip text
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    await user.keyboard("{Escape}");

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("closes when Escape is pressed on the trigger while open via focus", async () => {
    const user = userEvent.setup();

    render(
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger>Focusable</Tooltip.Trigger>
          <Tooltip.Content>Tooltip text</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    await user.tab();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("ignores keys other than Escape pressed while the tooltip is open", async () => {
    const user = userEvent.setup();
    const onEscapeKeyDown = vi.fn();

    render(
      <Tooltip.Provider delayDuration={0}>
        <Tooltip.Root>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content onEscapeKeyDown={onEscapeKeyDown}>
            Tooltip text
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    await user.hover(screen.getByRole("button", { name: "Hover me" }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await user.keyboard("{Enter}");

    expect(onEscapeKeyDown).not.toHaveBeenCalled();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("does not respond to Escape while closed, even when Content is forceMounted", async () => {
    const user = userEvent.setup();
    const onEscapeKeyDown = vi.fn();

    render(
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content forceMount onEscapeKeyDown={onEscapeKeyDown}>
            Tooltip text
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    await user.keyboard("{Escape}");

    expect(onEscapeKeyDown).not.toHaveBeenCalled();
  });

  it("removes its document Escape listener on unmount", () => {
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
      ([type]) => type === "keydown",
    )?.[1];
    unmount();

    expect(handler).toBeTypeOf("function");
    expect(removeEventListener).toHaveBeenCalledWith("keydown", handler);

    addEventListener.mockRestore();
    removeEventListener.mockRestore();
  });

  it("responds to Escape after opening via hover (the listener effect must re-run once open flips)", async () => {
    const user = userEvent.setup();

    render(
      <Tooltip.Provider delayDuration={0}>
        <Tooltip.Root>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content>Tooltip text</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    await user.hover(screen.getByRole("button", { name: "Hover me" }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("closes via the trigger's own Escape handler even when no Tooltip.Content is rendered", async () => {
    const user = userEvent.setup();

    render(
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger>Focusable</Tooltip.Trigger>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    await user.tab();
    expect(
      screen.getByRole("button", { name: "Focusable" }),
    ).toHaveAttribute("data-state", "open");

    await user.keyboard("{Escape}");

    expect(
      screen.getByRole("button", { name: "Focusable" }),
    ).toHaveAttribute("data-state", "closed");
  });

  it("ignores non-Escape keys on the trigger when no Tooltip.Content is rendered", async () => {
    const user = userEvent.setup();

    render(
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger>Focusable</Tooltip.Trigger>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    await user.tab();
    expect(
      screen.getByRole("button", { name: "Focusable" }),
    ).toHaveAttribute("data-state", "open");

    await user.keyboard("{Enter}");

    expect(
      screen.getByRole("button", { name: "Focusable" }),
    ).toHaveAttribute("data-state", "open");
  });
});
