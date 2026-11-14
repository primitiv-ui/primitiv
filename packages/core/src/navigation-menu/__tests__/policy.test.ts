import {
  NAVIGATION_MENU_PANEL_FOCUSABLE,
  navigationMenuEntersPanel,
  navigationMenuIds,
  navigationMenuIndicatorGeometry,
  navigationMenuKeydown,
  navigationMenuOpenDelay,
  navigationMenuPanelMotion,
  navigationMenuToggle,
  type NavigationMenuTravelState,
} from "../policy";

describe("navigationMenuToggle", () => {
  it("opens a closed entry", () => {
    // Arrange & Act
    const next = navigationMenuToggle({ open: "", arrival: undefined }, "docs");

    // Assert
    expect(next).toBe("docs");
  });

  it("closes the open entry", () => {
    // Arrange & Act
    const next = navigationMenuToggle({ open: "docs", arrival: undefined }, "docs");

    // Assert
    expect(next).toBe("");
  });

  it("switches from another open entry", () => {
    // Arrange & Act
    const next = navigationMenuToggle({ open: "blog", arrival: undefined }, "docs");

    // Assert
    expect(next).toBe("docs");
  });

  it("toggles against what was open when the pointer arrived, not what hover opened", () => {
    // Arrange & Act
    const next = navigationMenuToggle({ open: "docs", arrival: false }, "docs");

    // Assert
    expect(next).toBe("docs");
  });

  it("closes when the entry was already open as the pointer arrived", () => {
    // Arrange & Act
    const next = navigationMenuToggle({ open: "docs", arrival: true }, "docs");

    // Assert
    expect(next).toBe("");
  });
});

describe("navigationMenuOpenDelay", () => {
  it("waits the delay for the first open", () => {
    // Arrange & Act
    const delay = navigationMenuOpenDelay({ open: "", delay: 200 });

    // Assert
    expect(delay).toBe(200);
  });

  it("swaps at once while another panel is already open", () => {
    // Arrange & Act
    const delay = navigationMenuOpenDelay({ open: "blog", delay: 200 });

    // Assert
    expect(delay).toBe(0);
  });
});

describe("navigationMenuKeydown", () => {
  const bar: NavigationMenuTravelState<string> = {
    entries: ["docs", "blog", "pricing"],
    orientation: "horizontal",
    dir: "ltr",
  };

  it.each([
    ["ArrowRight", "docs", "blog"],
    ["ArrowLeft", "docs", "pricing"],
    ["ArrowRight", "pricing", "docs"],
    ["Home", "blog", "docs"],
    ["End", "docs", "pricing"],
  ])("moves %s from %s to %s along a horizontal bar", (key, focused, target) => {
    // Arrange & Act
    const outcome = navigationMenuKeydown(bar, focused, key);

    // Assert
    expect(outcome).toEqual({ focus: target });
  });

  it("mirrors the horizontal arrows under RTL", () => {
    // Arrange & Act
    const outcome = navigationMenuKeydown({ ...bar, dir: "rtl" }, "docs", "ArrowLeft");

    // Assert
    expect(outcome).toEqual({ focus: "blog" });
  });

  it("travels with the vertical arrows on a vertical rail", () => {
    // Arrange & Act
    const outcome = navigationMenuKeydown({ ...bar, orientation: "vertical" }, "docs", "ArrowDown");

    // Assert
    expect(outcome).toEqual({ focus: "blog" });
  });

  it.each(["Enter", " ", "ArrowDown", "Escape", "a"])("leaves %j to the browser on a horizontal bar", (key) => {
    // Arrange & Act
    const outcome = navigationMenuKeydown(bar, "docs", key);

    // Assert
    expect(outcome).toBeNull();
  });
});

describe("navigationMenuEntersPanel", () => {
  it.each([
    ["horizontal", "ltr", "ArrowDown", true],
    ["horizontal", "rtl", "ArrowDown", true],
    ["horizontal", "ltr", "ArrowRight", false],
    ["vertical", "ltr", "ArrowRight", true],
    ["vertical", "ltr", "ArrowLeft", false],
    ["vertical", "rtl", "ArrowLeft", true],
    ["vertical", "rtl", "ArrowRight", false],
    ["vertical", "ltr", "ArrowDown", false],
  ] as const)("on a %s %s menu, %s enters the panel: %s", (orientation, dir, key, enters) => {
    // Arrange & Act
    const outcome = navigationMenuEntersPanel({ orientation, dir }, key);

    // Assert
    expect(outcome).toBe(enters);
  });
});

describe("navigationMenuIds", () => {
  it("pairs an entry's trigger and panel ids under the root's", () => {
    // Arrange & Act
    const ids = navigationMenuIds("nav", "docs");

    // Assert
    expect(ids).toEqual({ triggerId: "nav-trigger-docs", panelId: "nav-panel-docs" });
  });
});

describe("navigationMenuPanelMotion", () => {
  const values = ["docs", "blog", "pricing"];
  const motion = (value: string, openValue: string, previousValue: string) =>
    navigationMenuPanelMotion({ value, openValue, previousValue, values });

  it.each([
    ["blog", "blog", "docs", "from-end"],
    ["docs", "docs", "blog", "from-start"],
    ["docs", "blog", "docs", "to-start"],
    ["blog", "docs", "blog", "to-end"],
  ])("gives %s (open %s, was %s) the motion %s", (value, openValue, previousValue, expected) => {
    // Arrange & Act & Assert
    expect(motion(value, openValue, previousValue)).toBe(expected);
  });

  it.each([
    ["a bystander", "pricing", "blog", "docs"],
    ["the first open", "docs", "docs", ""],
    ["the full close", "docs", "", "docs"],
    ["an unregistered entry", "faq", "faq", "docs"],
  ])("has no direction for %s", (_case, value, openValue, previousValue) => {
    // Arrange & Act & Assert
    expect(motion(value, openValue, previousValue)).toBeUndefined();
  });
});

describe("navigationMenuIndicatorGeometry", () => {
  const box = { offsetLeft: 10, offsetTop: 20, offsetWidth: 30, offsetHeight: 40 };

  it("measures along the inline axis of a horizontal bar", () => {
    // Arrange & Act & Assert
    expect(navigationMenuIndicatorGeometry("horizontal", box)).toEqual({ position: 10, size: 30 });
  });

  it("measures along the block axis of a vertical rail", () => {
    // Arrange & Act & Assert
    expect(navigationMenuIndicatorGeometry("vertical", box)).toEqual({ position: 20, size: 40 });
  });
});

describe("NAVIGATION_MENU_PANEL_FOCUSABLE", () => {
  it("lands on a panel's links, enabled buttons and tabbable elements", () => {
    // Arrange & Act
    const selectors = NAVIGATION_MENU_PANEL_FOCUSABLE.split(", ");

    // Assert
    expect(selectors).toEqual(["a[href]", "button:not([disabled])", '[tabindex]:not([tabindex="-1"])']);
  });
});
