import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";

import { NavigationMenu } from "../NavigationMenu";
import { getPanelMotion } from "../utils";

/** jsdom reports every offset as 0, so the size the Viewport reads has to be
 * planted on the panel first — the same approach the Indicator tests take. */
function plantSize(
  element: HTMLElement,
  box: { width: number; height: number },
) {
  Object.defineProperty(element, "offsetWidth", {
    value: box.width,
    configurable: true,
  });
  Object.defineProperty(element, "offsetHeight", {
    value: box.height,
    configurable: true,
  });
}

const widthOf = (el: HTMLElement) =>
  el.style.getPropertyValue("--primitiv-navigation-menu-viewport-width");
const heightOf = (el: HTMLElement) =>
  el.style.getPropertyValue("--primitiv-navigation-menu-viewport-height");

/** Three disclosure entries plus a plain bar link, all force-mounted so a closing
 * panel stays in the DOM long enough to report the direction it left in. */
function MotionNav(): ReactElement {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item value="one">
          <NavigationMenu.Trigger>One</NavigationMenu.Trigger>
          <NavigationMenu.Content forceMount data-testid="panel-one" />
        </NavigationMenu.Item>
        <NavigationMenu.Item value="two">
          <NavigationMenu.Trigger>Two</NavigationMenu.Trigger>
          <NavigationMenu.Content forceMount data-testid="panel-two" />
        </NavigationMenu.Item>
        <NavigationMenu.Item value="three">
          <NavigationMenu.Trigger>Three</NavigationMenu.Trigger>
          <NavigationMenu.Content forceMount data-testid="panel-three" />
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <NavigationMenu.Viewport forceMount data-testid="viewport" />
    </NavigationMenu.Root>
  );
}

describe("getPanelMotion", () => {
  const itemValues = ["one", "two", "three"];

  it("gives an entering panel the side it travelled from", () => {
    // one -> two moves toward the end, so two arrives from the end.
    expect(
      getPanelMotion({
        value: "two",
        openValue: "two",
        previousValue: "one",
        itemValues,
      }),
    ).toBe("from-end");
    expect(
      getPanelMotion({
        value: "two",
        openValue: "two",
        previousValue: "three",
        itemValues,
      }),
    ).toBe("from-start");
  });

  it("gives a leaving panel the side it travelled toward", () => {
    expect(
      getPanelMotion({
        value: "one",
        openValue: "two",
        previousValue: "one",
        itemValues,
      }),
    ).toBe("to-start");
    expect(
      getPanelMotion({
        value: "three",
        openValue: "two",
        previousValue: "three",
        itemValues,
      }),
    ).toBe("to-end");
  });

  it("has no direction for the first open or the full close", () => {
    // Nothing to travel from.
    expect(
      getPanelMotion({
        value: "two",
        openValue: "two",
        previousValue: "",
        itemValues,
      }),
    ).toBeUndefined();
    // Nothing to travel to.
    expect(
      getPanelMotion({
        value: "two",
        openValue: "",
        previousValue: "two",
        itemValues,
      }),
    ).toBeUndefined();
  });

  it("leaves bystanders and unregistered entries alone", () => {
    // Neither opening nor closing.
    expect(
      getPanelMotion({
        value: "three",
        openValue: "two",
        previousValue: "one",
        itemValues,
      }),
    ).toBeUndefined();
    // A value with no registered trigger has no position to derive from.
    expect(
      getPanelMotion({
        value: "ghost",
        openValue: "ghost",
        previousValue: "one",
        itemValues,
      }),
    ).toBeUndefined();
    expect(
      getPanelMotion({
        value: "two",
        openValue: "two",
        previousValue: "ghost",
        itemValues,
      }),
    ).toBeUndefined();
    expect(
      getPanelMotion({
        value: "two",
        openValue: "ghost",
        previousValue: "two",
        itemValues,
      }),
    ).toBeUndefined();
  });

  it("treats an empty value as no panel at all", () => {
    expect(
      getPanelMotion({
        value: "",
        openValue: "",
        previousValue: "",
        itemValues,
      }),
    ).toBeUndefined();
  });
});

describe("NavigationMenu.Content motion", () => {
  // Switching is driven by hover, not a second click: once a panel is open,
  // crossing to a sibling trigger swaps instantly, whereas a click would toggle
  // against whatever the arriving pointer had already opened (see the hover-intent
  // notes on Trigger) and close the menu instead of switching it.
  it("publishes the travel direction on both panels when switching", async () => {
    const user = userEvent.setup();
    render(<MotionNav />);

    await user.click(screen.getByRole("button", { name: "One" }));
    // First open: no direction to travel from.
    expect(screen.getByTestId("panel-one")).not.toHaveAttribute("data-motion");

    await user.hover(screen.getByRole("button", { name: "Three" }));
    await waitFor(() =>
      expect(screen.getByTestId("panel-three")).toHaveAttribute(
        "data-motion",
        "from-end",
      ),
    );
    expect(screen.getByTestId("panel-one")).toHaveAttribute(
      "data-motion",
      "to-start",
    );
  });

  it("mirrors the direction when travelling back toward the start", async () => {
    const user = userEvent.setup();
    render(<MotionNav />);

    await user.click(screen.getByRole("button", { name: "Three" }));
    await user.hover(screen.getByRole("button", { name: "One" }));

    await waitFor(() =>
      expect(screen.getByTestId("panel-one")).toHaveAttribute(
        "data-motion",
        "from-start",
      ),
    );
    expect(screen.getByTestId("panel-three")).toHaveAttribute(
      "data-motion",
      "to-end",
    );
  });

  it("re-registers an entry whose value changes, so the order stays true", async () => {
    // The order comes from a value-keyed registry, so a value that changes has to
    // unregister the old key and register the new one. Leaving the stale key behind
    // (or never re-registering) puts the entries in the wrong order and the panels
    // slide the wrong way.
    function RenamableNav({ firstValue }: { firstValue: string }): ReactElement {
      return (
        <NavigationMenu.Root>
          <NavigationMenu.List>
            <NavigationMenu.Item value={firstValue}>
              <NavigationMenu.Trigger>First</NavigationMenu.Trigger>
              <NavigationMenu.Content forceMount data-testid="panel-first" />
            </NavigationMenu.Item>
            <NavigationMenu.Item value="second">
              <NavigationMenu.Trigger>Second</NavigationMenu.Trigger>
              <NavigationMenu.Content forceMount data-testid="panel-second" />
            </NavigationMenu.Item>
          </NavigationMenu.List>
          <NavigationMenu.Viewport forceMount data-testid="viewport" />
        </NavigationMenu.Root>
      );
    }

    const user = userEvent.setup();
    const { rerender } = render(<RenamableNav firstValue="alpha" />);
    rerender(<RenamableNav firstValue="renamed" />);

    await user.click(screen.getByRole("button", { name: "First" }));
    await user.hover(screen.getByRole("button", { name: "Second" }));

    await waitFor(() =>
      expect(screen.getByTestId("panel-second")).toHaveAttribute(
        "data-motion",
        "from-end",
      ),
    );
    expect(screen.getByTestId("panel-first")).toHaveAttribute(
      "data-motion",
      "to-start",
    );
  });

  it("drops the direction once the menu closes completely", async () => {
    const user = userEvent.setup();
    render(<MotionNav />);

    await user.click(screen.getByRole("button", { name: "Two" }));
    await user.click(screen.getByRole("button", { name: "Two" }));

    await waitFor(() =>
      expect(screen.getByTestId("panel-two")).not.toHaveAttribute(
        "data-motion",
      ),
    );
  });
});

describe("NavigationMenu.Viewport measurement", () => {
  it("publishes the open panel's measured size", async () => {
    const user = userEvent.setup();
    render(<MotionNav />);

    const viewport = screen.getByTestId("viewport");
    // Nothing has ever been open, so there is nothing to publish.
    expect(widthOf(viewport)).toBe("");

    plantSize(screen.getByTestId("panel-two"), { width: 240, height: 96 });
    await user.click(screen.getByRole("button", { name: "Two" }));

    await waitFor(() => expect(widthOf(viewport)).toBe("240px"));
    expect(heightOf(viewport)).toBe("96px");
  });

  it("keeps the last measurement through the close so the exit has a size", async () => {
    const user = userEvent.setup();
    render(<MotionNav />);

    const viewport = screen.getByTestId("viewport");
    plantSize(screen.getByTestId("panel-two"), { width: 240, height: 96 });
    await user.click(screen.getByRole("button", { name: "Two" }));
    await waitFor(() => expect(widthOf(viewport)).toBe("240px"));

    await user.click(screen.getByRole("button", { name: "Two" }));

    // Clearing it here would collapse the box at the moment the exit needs its size.
    expect(widthOf(viewport)).toBe("240px");
    expect(heightOf(viewport)).toBe("96px");
  });

  it("re-measures the open panel when the window resizes", async () => {
    const user = userEvent.setup();
    render(<MotionNav />);

    const viewport = screen.getByTestId("viewport");
    const panel = screen.getByTestId("panel-two");
    plantSize(panel, { width: 240, height: 96 });
    await user.click(screen.getByRole("button", { name: "Two" }));
    await waitFor(() => expect(widthOf(viewport)).toBe("240px"));

    // Size is layout-derived, so a reflow has to invalidate it.
    plantSize(panel, { width: 320, height: 128 });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(widthOf(viewport)).toBe("320px");
    expect(heightOf(viewport)).toBe("128px");
  });

  it("removes its resize listener on unmount", () => {
    const addEventListener = vi.spyOn(window, "addEventListener");
    const removeEventListener = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(<MotionNav />);
    const measure = addEventListener.mock.calls.find(
      ([type]) => type === "resize",
    )?.[1];
    unmount();

    expect(measure).toBeTypeOf("function");
    expect(removeEventListener).toHaveBeenCalledWith("resize", measure);

    addEventListener.mockRestore();
    removeEventListener.mockRestore();
  });

  it("publishes nothing when the open value has no panel to measure", () => {
    // Mirrors the Indicator's no-rendered-trigger case: better an unsized box than
    // one reporting a size that belongs to nothing.
    render(
      <NavigationMenu.Root defaultValue="ghost">
        <NavigationMenu.List>
          <NavigationMenu.Item value="one">
            <NavigationMenu.Trigger>One</NavigationMenu.Trigger>
            <NavigationMenu.Content forceMount />
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <NavigationMenu.Viewport forceMount data-testid="viewport" />
      </NavigationMenu.Root>,
    );

    const viewport = screen.getByTestId("viewport");
    expect(widthOf(viewport)).toBe("");
    expect(heightOf(viewport)).toBe("");
  });

  it("lets a consumer style override the published size", () => {
    render(
      <NavigationMenu.Root defaultValue="one">
        <NavigationMenu.List>
          <NavigationMenu.Item value="one">
            <NavigationMenu.Trigger>One</NavigationMenu.Trigger>
            <NavigationMenu.Content forceMount />
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <NavigationMenu.Viewport
          data-testid="viewport"
          style={{ outline: "1px solid red" }}
        />
      </NavigationMenu.Root>,
    );

    expect(screen.getByTestId("viewport")).toHaveStyle({
      outline: "1px solid red",
    });
  });
});

describe("NavigationMenu.Link hover", () => {
  function BarLinkNav(props: { openOnHover?: boolean }): ReactElement {
    return (
      <NavigationMenu.Root {...props}>
        <NavigationMenu.List>
          <NavigationMenu.Item value="one">
            <NavigationMenu.Trigger>One</NavigationMenu.Trigger>
            <NavigationMenu.Content forceMount data-testid="panel-one">
              <NavigationMenu.Link href="/row">Row</NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Link href="/changelog">
              Changelog
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <NavigationMenu.Viewport forceMount data-testid="viewport" />
      </NavigationMenu.Root>
    );
  }

  it("closes the open panel when the pointer reaches a top-level link", async () => {
    const user = userEvent.setup();
    render(<BarLinkNav />);

    await user.click(screen.getByRole("button", { name: "One" }));
    expect(screen.getByTestId("viewport")).toHaveAttribute(
      "data-state",
      "open",
    );

    await user.hover(screen.getByRole("link", { name: "Changelog" }));

    await waitFor(() =>
      expect(screen.getByTestId("viewport")).toHaveAttribute(
        "data-state",
        "closed",
      ),
    );
  });

  it("does not close when the pointer reaches a link inside the panel", async () => {
    const user = userEvent.setup();
    render(<BarLinkNav />);

    await user.click(screen.getByRole("button", { name: "One" }));
    await user.hover(screen.getByRole("link", { name: "Row" }));

    expect(screen.getByTestId("viewport")).toHaveAttribute(
      "data-state",
      "open",
    );
  });

  it("leaves a click-only nav click-only", async () => {
    const user = userEvent.setup();
    render(<BarLinkNav openOnHover={false} />);

    await user.click(screen.getByRole("button", { name: "One" }));
    await user.hover(screen.getByRole("link", { name: "Changelog" }));

    expect(screen.getByTestId("viewport")).toHaveAttribute(
      "data-state",
      "open",
    );
  });

  it("still runs a consumer's own pointer-enter handler", async () => {
    const user = userEvent.setup();
    const onPointerEnter = vi.fn();
    render(
      <NavigationMenu.Root>
        <NavigationMenu.List>
          <NavigationMenu.Item>
            <NavigationMenu.Link href="/x" onPointerEnter={onPointerEnter}>
              Changelog
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu.Root>,
    );

    await user.hover(screen.getByRole("link", { name: "Changelog" }));

    expect(onPointerEnter).toHaveBeenCalledTimes(1);
  });
});
