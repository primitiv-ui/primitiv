import {
  toggleGroupKeydown,
  toggleGroupTabStop,
  toggleGroupToggle,
  type ToggleGroupState,
} from "../policy";

const state: ToggleGroupState = {
  values: ["left", "center", "right"],
  disabled: new Set(),
  pressed: [],
  multiple: false,
  orientation: "horizontal",
  dir: "ltr",
};

describe("toggleGroupToggle", () => {
  it("presses an item that is off", () => {
    // Arrange & Act
    const next = toggleGroupToggle(state, "center");

    // Assert
    expect(next).toEqual(["center"]);
  });

  it("lets go of a pressed item, leaving nothing pressed in single mode", () => {
    // Arrange & Act
    const next = toggleGroupToggle({ ...state, pressed: ["center"] }, "center");

    // Assert
    expect(next).toEqual([]);
  });

  it("replaces the pressed item in single mode", () => {
    // Arrange & Act
    const next = toggleGroupToggle({ ...state, pressed: ["left"] }, "right");

    // Assert
    expect(next).toEqual(["right"]);
  });

  it("adds to the pressed items in multiple mode", () => {
    // Arrange & Act
    const next = toggleGroupToggle({ ...state, multiple: true, pressed: ["left"] }, "right");

    // Assert
    expect(next).toEqual(["left", "right"]);
  });

  it("does nothing for a disabled item", () => {
    // Arrange & Act
    const next = toggleGroupToggle({ ...state, disabled: new Set(["right"]) }, "right");

    // Assert
    expect(next).toBeNull();
  });
});

describe("toggleGroupKeydown", () => {
  it("moves focus to the next item without pressing it", () => {
    // Arrange & Act
    const outcome = toggleGroupKeydown(state, "left", "ArrowRight");

    // Assert
    expect(outcome).toEqual({ focus: "center", toggle: null });
  });

  it("skips a disabled item", () => {
    // Arrange & Act
    const outcome = toggleGroupKeydown({ ...state, disabled: new Set(["center"]) }, "left", "ArrowRight");

    // Assert
    expect(outcome).toEqual({ focus: "right", toggle: null });
  });

  it("mirrors the horizontal arrows right to left", () => {
    // Arrange & Act
    const outcome = toggleGroupKeydown({ ...state, dir: "rtl" }, "left", "ArrowLeft");

    // Assert
    expect(outcome).toEqual({ focus: "center", toggle: null });
  });

  it("uses the vertical arrows in a vertical group", () => {
    // Arrange & Act
    const outcome = toggleGroupKeydown({ ...state, orientation: "vertical" }, "left", "ArrowDown");

    // Assert
    expect(outcome).toEqual({ focus: "center", toggle: null });
  });

  it("jumps to the last item on End", () => {
    // Arrange & Act
    const outcome = toggleGroupKeydown(state, "left", "End");

    // Assert
    expect(outcome).toEqual({ focus: "right", toggle: null });
  });

  it("toggles the focused item on Space", () => {
    // Arrange & Act
    const outcome = toggleGroupKeydown(state, "center", " ");

    // Assert
    expect(outcome).toEqual({ focus: null, toggle: "center" });
  });

  it("leaves a key it does not handle alone", () => {
    // Arrange & Act
    const outcome = toggleGroupKeydown(state, "center", "a");

    // Assert
    expect(outcome).toBeNull();
  });
});

describe("toggleGroupTabStop", () => {
  it("is the first enabled item while nothing is pressed or focused", () => {
    // Arrange & Act
    const stop = toggleGroupTabStop({ ...state, disabled: new Set(["left"]), focused: undefined });

    // Assert
    expect(stop).toBe("center");
  });

  it("is the first pressed item before any focus", () => {
    // Arrange & Act
    const stop = toggleGroupTabStop({ ...state, pressed: ["right", "center"], focused: undefined });

    // Assert
    expect(stop).toBe("right");
  });

  it("passes over a pressed item that is disabled", () => {
    // Arrange & Act
    const stop = toggleGroupTabStop({
      ...state,
      disabled: new Set(["right"]),
      pressed: ["right"],
      focused: undefined,
    });

    // Assert
    expect(stop).toBe("left");
  });

  it("follows the item focus last moved to", () => {
    // Arrange & Act
    const stop = toggleGroupTabStop({ ...state, pressed: ["right"], focused: "center" });

    // Assert
    expect(stop).toBe("center");
  });

  it("drops a focused item that has gone", () => {
    // Arrange & Act
    const stop = toggleGroupTabStop({ ...state, focused: "justify" });

    // Assert
    expect(stop).toBe("left");
  });

  it("drops a focused item that has become disabled", () => {
    // Arrange & Act
    const stop = toggleGroupTabStop({ ...state, disabled: new Set(["center"]), focused: "center" });

    // Assert
    expect(stop).toBe("left");
  });

  it("is nothing when every item is disabled", () => {
    // Arrange & Act
    const stop = toggleGroupTabStop({ ...state, disabled: new Set(state.values), focused: undefined });

    // Assert
    expect(stop).toBeUndefined();
  });
});
