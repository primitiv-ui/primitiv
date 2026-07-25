import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NavigationMenu } from "../NavigationMenu";
import type { NavigationMenuRootProps } from "../types";

/** jsdom reports every offset as 0, so the geometry the Indicator reads has to
 * be planted on the element first. */
function plantGeometry(
  element: HTMLElement,
  box: { left: number; width: number; top: number; height: number },
) {
  Object.defineProperty(element, "offsetLeft", {
    value: box.left,
    configurable: true,
  });
  Object.defineProperty(element, "offsetWidth", {
    value: box.width,
    configurable: true,
  });
  Object.defineProperty(element, "offsetTop", {
    value: box.top,
    configurable: true,
  });
  Object.defineProperty(element, "offsetHeight", {
    value: box.height,
    configurable: true,
  });
}

function Nav(props: NavigationMenuRootProps) {
  return (
    <NavigationMenu.Root {...props}>
      <NavigationMenu.List>
        <NavigationMenu.Item value="concepts">
          <NavigationMenu.Trigger>Concepts</NavigationMenu.Trigger>
          <NavigationMenu.Content data-testid="concepts-panel" />
        </NavigationMenu.Item>
        <NavigationMenu.Item value="registry">
          <NavigationMenu.Trigger>Registry</NavigationMenu.Trigger>
          <NavigationMenu.Content data-testid="registry-panel" />
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <NavigationMenu.Indicator data-testid="indicator" />
    </NavigationMenu.Root>
  );
}

describe("NavigationMenu.Indicator", () => {
  it("stays hidden while nothing is open", () => {
    render(<Nav />);

    const indicator = screen.getByTestId("indicator");

    expect(indicator).toHaveAttribute("hidden");
    expect(indicator).toHaveAttribute("data-state", "closed");
  });

  it("publishes the open trigger's horizontal geometry", async () => {
    const user = userEvent.setup();
    render(<Nav />);

    plantGeometry(screen.getByRole("button", { name: "Registry" }), {
      left: 120,
      width: 80,
      top: 4,
      height: 32,
    });

    await user.click(screen.getByRole("button", { name: "Registry" }));

    const indicator = screen.getByTestId("indicator");

    expect(indicator).not.toHaveAttribute("hidden");
    expect(indicator).toHaveAttribute("data-state", "open");
    expect(indicator.style.getPropertyValue(
      "--primitiv-navigation-menu-indicator-position",
    )).toBe("120px");
    expect(indicator.style.getPropertyValue(
      "--primitiv-navigation-menu-indicator-size",
    )).toBe("80px");
  });

  it("measures the cross axis when vertical", async () => {
    const user = userEvent.setup();
    render(<Nav orientation="vertical" />);

    plantGeometry(screen.getByRole("button", { name: "Registry" }), {
      left: 120,
      width: 80,
      top: 48,
      height: 36,
    });

    await user.click(screen.getByRole("button", { name: "Registry" }));

    const indicator = screen.getByTestId("indicator");

    expect(indicator.style.getPropertyValue(
      "--primitiv-navigation-menu-indicator-position",
    )).toBe("48px");
    expect(indicator.style.getPropertyValue(
      "--primitiv-navigation-menu-indicator-size",
    )).toBe("36px");
  });

  it("re-measures when the window resizes", async () => {
    const user = userEvent.setup();
    render(<Nav />);

    const trigger = screen.getByRole("button", { name: "Concepts" });
    plantGeometry(trigger, { left: 0, width: 60, top: 0, height: 32 });
    await user.click(trigger);

    plantGeometry(trigger, { left: 10, width: 90, top: 0, height: 32 });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(
      screen
        .getByTestId("indicator")
        .style.getPropertyValue("--primitiv-navigation-menu-indicator-size"),
    ).toBe("90px");
  });

  it("clears the geometry when the panel closes", async () => {
    const user = userEvent.setup();
    render(<Nav />);

    const trigger = screen.getByRole("button", { name: "Concepts" });
    plantGeometry(trigger, { left: 8, width: 72, top: 0, height: 32 });

    await user.click(trigger);
    await user.click(trigger);

    const indicator = screen.getByTestId("indicator");

    // A marker left holding the last trigger's geometry would animate from the
    // wrong place on the next open.
    expect(
      indicator.style.getPropertyValue(
        "--primitiv-navigation-menu-indicator-position",
      ),
    ).toBe("");
    expect(
      indicator.style.getPropertyValue(
        "--primitiv-navigation-menu-indicator-size",
      ),
    ).toBe("");
  });

  it("removes its resize listener on unmount", () => {
    const addEventListener = vi.spyOn(window, "addEventListener");
    const removeEventListener = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(<Nav />);
    const measure = addEventListener.mock.calls.find(
      ([type]) => type === "resize",
    )?.[1];
    unmount();

    expect(measure).toBeTypeOf("function");
    expect(removeEventListener).toHaveBeenCalledWith("resize", measure);

    addEventListener.mockRestore();
    removeEventListener.mockRestore();
  });

  it("carries the open value and the orientation as styling hooks", async () => {
    const user = userEvent.setup();
    render(<Nav />);

    await user.click(screen.getByRole("button", { name: "Concepts" }));

    const indicator = screen.getByTestId("indicator");

    expect(indicator).toHaveAttribute("data-value", "concepts");
    expect(indicator).toHaveAttribute("data-orientation", "horizontal");
  });

  it("publishes no geometry when the open value has no rendered trigger", () => {
    render(<Nav value="ghost" onValueChange={() => {}} />);

    const indicator = screen.getByTestId("indicator");

    // Open by state, but there is nothing to measure — better a marker with no
    // geometry than one parked at 0.
    expect(indicator).toHaveAttribute("data-state", "open");
    expect(
      indicator.style.getPropertyValue(
        "--primitiv-navigation-menu-indicator-position",
      ),
    ).toBe("");
  });

  it("renders a consumer element instead of the div with asChild", async () => {
    const user = userEvent.setup();
    render(
      <NavigationMenu.Root>
        <NavigationMenu.List>
          <NavigationMenu.Item value="concepts">
            <NavigationMenu.Trigger>Concepts</NavigationMenu.Trigger>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <NavigationMenu.Indicator asChild>
          <svg data-testid="arrow" viewBox="0 0 10 10" aria-hidden>
            <polygon points="0,10 5,0 10,10" />
          </svg>
        </NavigationMenu.Indicator>
      </NavigationMenu.Root>,
    );

    const arrow = screen.getByTestId("arrow");
    plantGeometry(screen.getByRole("button", { name: "Concepts" }), {
      left: 24,
      width: 64,
      top: 0,
      height: 32,
    });

    expect(arrow.tagName).toBe("svg");
    expect(arrow).toHaveAttribute("data-state", "closed");

    await user.click(screen.getByRole("button", { name: "Concepts" }));

    expect(arrow).toHaveAttribute("data-state", "open");
    expect(
      arrow.style.getPropertyValue(
        "--primitiv-navigation-menu-indicator-position",
      ),
    ).toBe("24px");
  });

  it("keeps a force-mounted indicator unhidden so it can animate away", () => {
    render(<Nav />);
    const { container } = render(
      <NavigationMenu.Root>
        <NavigationMenu.List>
          <NavigationMenu.Item value="concepts">
            <NavigationMenu.Trigger>Concepts</NavigationMenu.Trigger>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <NavigationMenu.Indicator forceMount />
      </NavigationMenu.Root>,
    );

    const indicator = container.querySelector("nav > div");

    expect(indicator).not.toHaveAttribute("hidden");
  });
});
