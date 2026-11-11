import {
  segmentedControlKeydown,
  segmentedControlSelect,
  segmentedControlTabStop,
  type SegmentedControlState,
} from "../policy";

const state: SegmentedControlState = {
  values: ["day", "week", "month"],
  disabled: new Set(),
  selected: undefined,
  orientation: "horizontal",
  dir: "ltr",
};

describe("segmentedControlSelect", () => {
  it("selects a segment that is not selected", () => {
    // Arrange & Act
    const next = segmentedControlSelect(state, "week");

    // Assert
    expect(next).toBe("week");
  });

  it("does nothing for the segment already selected, so the selection never clears", () => {
    // Arrange & Act
    const next = segmentedControlSelect({ ...state, selected: "week" }, "week");

    // Assert
    expect(next).toBeNull();
  });

  it("does nothing for a disabled segment", () => {
    // Arrange & Act
    const next = segmentedControlSelect({ ...state, disabled: new Set(["week"]) }, "week");

    // Assert
    expect(next).toBeNull();
  });
});

describe("segmentedControlKeydown", () => {
  it("moves focus and selection to the next segment", () => {
    // Arrange & Act
    const outcome = segmentedControlKeydown(state, "day", "ArrowRight");

    // Assert
    expect(outcome).toEqual({ focus: "week", select: "week" });
  });

  it("wraps from the first segment to the last", () => {
    // Arrange & Act
    const outcome = segmentedControlKeydown(state, "day", "ArrowLeft");

    // Assert
    expect(outcome).toEqual({ focus: "month", select: "month" });
  });

  it("skips a disabled segment", () => {
    // Arrange & Act
    const outcome = segmentedControlKeydown({ ...state, disabled: new Set(["week"]) }, "day", "ArrowRight");

    // Assert
    expect(outcome).toEqual({ focus: "month", select: "month" });
  });

  it("does nothing while focus sits on a disabled segment", () => {
    // Arrange & Act
    const outcome = segmentedControlKeydown({ ...state, disabled: new Set(["day"]) }, "day", "ArrowRight");

    // Assert
    expect(outcome).toBeNull();
  });

  it("mirrors the horizontal arrows right to left", () => {
    // Arrange & Act
    const outcome = segmentedControlKeydown({ ...state, dir: "rtl" }, "day", "ArrowLeft");

    // Assert
    expect(outcome).toEqual({ focus: "week", select: "week" });
  });

  it("uses the vertical arrows when vertical, and ignores the horizontal ones", () => {
    // Arrange
    const vertical = { ...state, orientation: "vertical" as const };

    // Act
    const down = segmentedControlKeydown(vertical, "day", "ArrowDown");
    const right = segmentedControlKeydown(vertical, "day", "ArrowRight");

    // Assert
    expect(down).toEqual({ focus: "week", select: "week" });
    expect(right).toBeNull();
  });

  it("focuses without re-selecting when the arrows land on the selected segment", () => {
    // Arrange & Act
    const outcome = segmentedControlKeydown(
      { ...state, values: ["day", "week"], disabled: new Set(["week"]), selected: "day" },
      "day",
      "ArrowRight",
    );

    // Assert
    expect(outcome).toEqual({ focus: "day", select: null });
  });

  it.each(["Home", "End", "Enter", " ", "a"])("leaves %j alone", (key) => {
    // Arrange & Act
    const outcome = segmentedControlKeydown(state, "week", key);

    // Assert
    expect(outcome).toBeNull();
  });
});

describe("segmentedControlTabStop", () => {
  it("is the selected segment", () => {
    // Arrange & Act
    const stop = segmentedControlTabStop({ ...state, selected: "month" });

    // Assert
    expect(stop).toBe("month");
  });

  it("is the first enabled segment while none is selected", () => {
    // Arrange & Act
    const stop = segmentedControlTabStop({ ...state, disabled: new Set(["day"]) });

    // Assert
    expect(stop).toBe("week");
  });

  it("is nothing while none is selected and every segment is disabled", () => {
    // Arrange & Act
    const stop = segmentedControlTabStop({ ...state, disabled: new Set(state.values) });

    // Assert
    expect(stop).toBeUndefined();
  });
});
