import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";

import { NavigationMenu } from "../NavigationMenu";
import { getPanelMotion } from "../utils";

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
  const entryKeys = ["one", "two", "three"];

  it("gives an entering panel the side it travelled from", () => {
    // one -> two moves toward the end, so two arrives from the end.
    expect(
      getPanelMotion({
        value: "two",
        openValue: "two",
        previousValue: "one",
        entryKeys,
      }),
    ).toBe("from-end");
    expect(
      getPanelMotion({
        value: "two",
        openValue: "two",
        previousValue: "three",
        entryKeys,
      }),
    ).toBe("from-start");
  });

  it("gives a leaving panel the side it travelled toward", () => {
    expect(
      getPanelMotion({
        value: "one",
        openValue: "two",
        previousValue: "one",
        entryKeys,
      }),
    ).toBe("to-start");
    expect(
      getPanelMotion({
        value: "three",
        openValue: "two",
        previousValue: "three",
        entryKeys,
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
        entryKeys,
      }),
    ).toBeUndefined();
    // Nothing to travel to.
    expect(
      getPanelMotion({
        value: "two",
        openValue: "",
        previousValue: "two",
        entryKeys,
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
        entryKeys,
      }),
    ).toBeUndefined();
    // A value with no registered trigger has no position to derive from.
    expect(
      getPanelMotion({
        value: "ghost",
        openValue: "ghost",
        previousValue: "one",
        entryKeys,
      }),
    ).toBeUndefined();
    expect(
      getPanelMotion({
        value: "two",
        openValue: "two",
        previousValue: "ghost",
        entryKeys,
      }),
    ).toBeUndefined();
    expect(
      getPanelMotion({
        value: "two",
        openValue: "ghost",
        previousValue: "two",
        entryKeys,
      }),
    ).toBeUndefined();
  });

  it("treats an empty value as no panel at all", () => {
    expect(
      getPanelMotion({
        value: "",
        openValue: "",
        previousValue: "",
        entryKeys,
      }),
    ).toBeUndefined();
  });
});

describe("NavigationMenu.Content motion", () => {
  it("publishes the travel direction on both panels when switching", async () => {
    const user = userEvent.setup();
    render(<MotionNav />);

    await user.click(screen.getByRole("button", { name: "One" }));
    // First open: no direction to travel from.
    expect(screen.getByTestId("panel-one")).not.toHaveAttribute("data-motion");

    await user.click(screen.getByRole("button", { name: "Three" }));
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
    await user.click(screen.getByRole("button", { name: "One" }));

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
  it("publishes the open panel's size as custom properties", async () => {
    const user = userEvent.setup();
    render(<MotionNav />);

    const viewport = screen.getByTestId("viewport");
    // Nothing has ever been open, so there is nothing to publish.
    expect(
      viewport.style.getPropertyValue(
        "--primitiv-navigation-menu-viewport-width",
      ),
    ).toBe("");

    await user.click(screen.getByRole("button", { name: "Two" }));

    await waitFor(() =>
      expect(
        viewport.style.getPropertyValue(
          "--primitiv-navigation-menu-viewport-width",
        ),
      ).not.toBe(""),
    );
    expect(
      viewport.style.getPropertyValue(
        "--primitiv-navigation-menu-viewport-height",
      ),
    ).not.toBe("");
  });

  it("keeps the last measurement through the close so the exit has a size", async () => {
    const user = userEvent.setup();
    render(<MotionNav />);

    const viewport = screen.getByTestId("viewport");
    await user.click(screen.getByRole("button", { name: "Two" }));
    await waitFor(() =>
      expect(
        viewport.style.getPropertyValue(
          "--primitiv-navigation-menu-viewport-width",
        ),
      ).not.toBe(""),
    );

    await user.click(screen.getByRole("button", { name: "Two" }));

    expect(
      viewport.style.getPropertyValue(
        "--primitiv-navigation-menu-viewport-width",
      ),
    ).not.toBe("");
  });

  it("re-measures when the window resizes", async () => {
    const user = userEvent.setup();
    render(<MotionNav />);

    await user.click(screen.getByRole("button", { name: "Two" }));
    const viewport = screen.getByTestId("viewport");
    await waitFor(() =>
      expect(
        viewport.style.getPropertyValue(
          "--primitiv-navigation-menu-viewport-width",
        ),
      ).not.toBe(""),
    );

    // The measurement is layout-derived, so a reflow has to invalidate it.
    window.dispatchEvent(new Event("resize"));

    expect(
      viewport.style.getPropertyValue(
        "--primitiv-navigation-menu-viewport-width",
      ),
    ).not.toBe("");
  });

  it("lets a consumer style override the published size", async () => {
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
