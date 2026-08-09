import { render, screen } from "@testing-library/react";

import { Tooltip } from "../Tooltip";
import { TooltipContext, TooltipProviderContext } from "../TooltipContext";

describe("Tooltip displayNames", () => {
  it("sets a displayName on the compound, each sub-component, and both contexts", () => {
    // Assert — empty displayNames would render each as anonymous in DevTools.
    // Tooltip.Root is the same object as the compound (Object.assign), so its
    // own "TooltipRoot" assignment is overwritten and has no observable
    // Root displayName; the sub-components are distinct objects.
    expect(Tooltip.displayName).toBe("Tooltip");
    expect(Tooltip.Provider.displayName).toBe("TooltipProvider");
    expect(Tooltip.Trigger.displayName).toBe("TooltipTrigger");
    expect(Tooltip.Portal.displayName).toBe("TooltipPortal");
    expect(Tooltip.Content.displayName).toBe("TooltipContent");
    expect(Tooltip.Arrow.displayName).toBe("TooltipArrow");
    expect(TooltipProviderContext.displayName).toBe("TooltipProviderContext");
    expect(TooltipContext.displayName).toBe("TooltipContext");
  });
});

describe("Tooltip — basic rendering", () => {
  it("renders Tooltip.Trigger as a button with type='button'", () => {
    render(
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    const trigger = screen.getByRole("button", { name: "Hover me" });
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger).toHaveAttribute("type", "button");
  });

  it("does not render Tooltip.Content when closed by default", () => {
    render(
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content>Tooltip text</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("renders Tooltip.Content with role='tooltip' when open", () => {
    render(
      <Tooltip.Provider>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content>Tooltip text</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Tooltip text");
  });

  it("wires aria-describedby on Trigger to the id of Content", () => {
    render(
      <Tooltip.Provider>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content>Tooltip text</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    const trigger = screen.getByRole("button", { name: "Hover me" });
    const tooltip = screen.getByRole("tooltip");
    expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
    expect(tooltip.id).not.toBe("");
  });

  it("sets data-state='closed' on Content when closed (forceMount)", () => {
    render(
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content forceMount>Tooltip text</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    expect(screen.getByRole("tooltip")).toHaveAttribute("data-state", "closed");
  });

  it("sets data-state='open' on Content when open", () => {
    render(
      <Tooltip.Provider>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content>Tooltip text</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    expect(screen.getByRole("tooltip")).toHaveAttribute("data-state", "open");
  });

  it("sets data-state='open' | 'closed' on Trigger to reflect state", () => {
    render(
      <Tooltip.Provider>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    expect(screen.getByRole("button", { name: "Hover me" })).toHaveAttribute(
      "data-state",
      "open",
    );
  });

  it("Tooltip.Portal renders children into document.body when open", () => {
    render(
      <section data-testid="tree-root">
        <Tooltip.Provider>
          <Tooltip.Root defaultOpen>
            <Tooltip.Trigger>Hover me</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content>Tooltip text</Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </section>,
    );

    const tooltip = screen.getByRole("tooltip");
    expect(document.body).toContainElement(tooltip);
    expect(screen.getByTestId("tree-root")).not.toContainElement(tooltip);
  });

  it("Tooltip.Portal does not render children when closed", () => {
    render(
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content>Tooltip text</Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("Tooltip.Portal does not render arbitrary children when closed, independent of Content's own guard", () => {
    // Content has its own open guard, so wrapping it can't tell Portal's
    // guard apart from Content's. Wrap a plain element instead.
    render(
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Portal>
            <div data-testid="portal-child">child</div>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    expect(screen.queryByTestId("portal-child")).toBeNull();
  });

  it("Tooltip.Portal renders arbitrary children via forceMount even when closed", () => {
    render(
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Portal forceMount>
            <div data-testid="portal-child">child</div>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    expect(screen.getByTestId("portal-child")).toBeInTheDocument();
  });

  it("Tooltip.Arrow renders a span inside the content", () => {
    render(
      <Tooltip.Provider>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content>
            Tooltip text
            <Tooltip.Arrow data-testid="arrow" />
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    expect(screen.getByTestId("arrow")).toBeInTheDocument();
  });

  it("forwards arbitrary attributes to Trigger", () => {
    render(
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger className="my-trigger" data-testid="trigger">
            Hover me
          </Tooltip.Trigger>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    expect(screen.getByTestId("trigger")).toHaveClass("my-trigger");
  });

  it("forwards arbitrary attributes to Content", () => {
    render(
      <Tooltip.Provider>
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger>Hover me</Tooltip.Trigger>
          <Tooltip.Content className="my-content">Tooltip text</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    );

    expect(screen.getByRole("tooltip")).toHaveClass("my-content");
  });
});
