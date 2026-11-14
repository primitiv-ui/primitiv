import {
  navigationMenuKeydown,
  navigationMenuOpenDelay,
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
