import { radioGroupKeydown, radioGroupSelect, radioGroupTabStop, type RadioGroupState } from "../policy";

const state: RadioGroupState = {
  values: ["basic", "pro", "team"],
  disabled: new Set(),
  selected: undefined,
  orientation: "both",
  dir: "ltr",
};

describe("radioGroupSelect", () => {
  it("selects an item that is not selected", () => {
    // Arrange & Act
    const next = radioGroupSelect(state, "pro");

    // Assert
    expect(next).toBe("pro");
  });

  it("does nothing for the selected item or a disabled one", () => {
    // Arrange & Act
    const selected = radioGroupSelect({ ...state, selected: "pro" }, "pro");
    const disabled = radioGroupSelect({ ...state, disabled: new Set(["team"]) }, "team");

    // Assert
    expect(selected).toBeNull();
    expect(disabled).toBeNull();
  });
});

describe("radioGroupKeydown", () => {
  it.each([
    ["ArrowRight", "pro"],
    ["ArrowDown", "pro"],
    ["ArrowLeft", "team"],
    ["ArrowUp", "team"],
  ])("moves focus and selection with %s when both axes are live", (key, target) => {
    // Arrange & Act
    const outcome = radioGroupKeydown(state, "basic", key);

    // Assert
    expect(outcome).toEqual({ focus: target, select: target });
  });

  it("keeps to one axis when oriented", () => {
    // Arrange
    const horizontal = { ...state, orientation: "horizontal" as const };

    // Act
    const down = radioGroupKeydown(horizontal, "basic", "ArrowDown");
    const right = radioGroupKeydown(horizontal, "basic", "ArrowRight");

    // Assert
    expect(down).toBeNull();
    expect(right).toEqual({ focus: "pro", select: "pro" });
  });

  it("skips a disabled item, and does nothing while focus sits on one", () => {
    // Arrange
    const disabled = { ...state, disabled: new Set(["pro"]) };

    // Act
    const skipped = radioGroupKeydown(disabled, "basic", "ArrowRight");
    const stuck = radioGroupKeydown(disabled, "pro", "ArrowRight");

    // Assert
    expect(skipped).toEqual({ focus: "team", select: "team" });
    expect(stuck).toBeNull();
  });

  it("mirrors the horizontal arrows right to left, but not the vertical ones", () => {
    // Arrange
    const rtl = { ...state, dir: "rtl" as const };

    // Act
    const left = radioGroupKeydown(rtl, "basic", "ArrowLeft");
    const down = radioGroupKeydown(rtl, "basic", "ArrowDown");

    // Assert
    expect(left).toEqual({ focus: "pro", select: "pro" });
    expect(down).toEqual({ focus: "pro", select: "pro" });
  });

  it("focuses without re-selecting when the arrows land on the selected item", () => {
    // Arrange & Act
    const outcome = radioGroupKeydown(
      { ...state, values: ["basic", "pro"], disabled: new Set(["pro"]), selected: "basic" },
      "basic",
      "ArrowRight",
    );

    // Assert
    expect(outcome).toEqual({ focus: "basic", select: null });
  });

  it.each(["Home", "End", "Enter", " "])("leaves %j alone", (key) => {
    // Arrange & Act & Assert
    expect(radioGroupKeydown(state, "pro", key)).toBeNull();
  });
});

describe("radioGroupTabStop", () => {
  it("is the selected item, else the first enabled one, else nothing", () => {
    // Arrange & Act
    const selected = radioGroupTabStop({ ...state, selected: "team" });
    const firstEnabled = radioGroupTabStop({ ...state, disabled: new Set(["basic"]) });
    const none = radioGroupTabStop({ ...state, disabled: new Set(state.values) });

    // Assert
    expect(selected).toBe("team");
    expect(firstEnabled).toBe("pro");
    expect(none).toBeUndefined();
  });
});
