import {
  sliderClosestThumb,
  sliderEdge,
  sliderKeyValue,
  sliderPercent,
  sliderPointerValue,
  sliderRangeInsets,
  sliderSetThumb,
  sliderSnap,
  sliderThumbInset,
  type SliderAxis,
} from "../policy";

const ltr: SliderAxis = { orientation: "horizontal", dir: "ltr", inverted: false };
const scale = { min: 0, max: 100, step: 1 };

describe("sliderSnap", () => {
  it("rounds to the nearest step counted from min", () => {
    // Arrange & Act & Assert
    expect(sliderSnap(13, 0, 5)).toBe(15);
    expect(sliderSnap(12, 0, 5)).toBe(10);
    expect(sliderSnap(7, 2, 5)).toBe(7);
  });

  it("keeps a fractional step's precision without float noise", () => {
    // Arrange & Act & Assert
    expect(sliderSnap(0.30000000000000004, 0, 0.1)).toBe(0.3);
    expect(sliderSnap(0.35, 0, 0.25)).toBe(0.25);
  });
});

describe("sliderPercent", () => {
  it("places a value along the scale, clamped to 0–100", () => {
    // Arrange & Act & Assert
    expect(sliderPercent(25, 0, 50)).toBe(50);
    expect(sliderPercent(-10, 0, 50)).toBe(0);
    expect(sliderPercent(80, 0, 50)).toBe(100);
    expect(sliderPercent(30, 20, 60)).toBe(25);
  });
});

describe("sliderEdge", () => {
  it.each([
    [{ orientation: "horizontal", dir: "ltr", inverted: false }, "left"],
    [{ orientation: "horizontal", dir: "rtl", inverted: false }, "right"],
    [{ orientation: "horizontal", dir: "ltr", inverted: true }, "right"],
    [{ orientation: "horizontal", dir: "rtl", inverted: true }, "left"],
    [{ orientation: "vertical", dir: "ltr", inverted: false }, "bottom"],
    [{ orientation: "vertical", dir: "rtl", inverted: true }, "top"],
  ] as const)("measures %j from the %s edge", (axis, edge) => {
    // Arrange & Act & Assert
    expect(sliderEdge(axis)).toBe(edge);
  });
});

describe("sliderThumbInset", () => {
  it("is the value's percentage from the axis's start edge", () => {
    // Arrange & Act & Assert
    expect(sliderThumbInset(30, scale, ltr)).toEqual({ edge: "left", percent: 30 });
  });
});

describe("sliderRangeInsets", () => {
  it("runs from the start edge to a single thumb", () => {
    // Arrange & Act & Assert
    expect(sliderRangeInsets([30], scale, ltr)).toEqual({
      start: { edge: "left", percent: 0 },
      end: { edge: "right", percent: 70 },
    });
  });

  it("runs from the top of an inverted vertical track", () => {
    // Arrange & Act & Assert
    expect(sliderRangeInsets([30], scale, { ...ltr, orientation: "vertical", inverted: true })).toEqual({
      start: { edge: "top", percent: 0 },
      end: { edge: "bottom", percent: 70 },
    });
  });

  it("runs between the outermost of several thumbs", () => {
    // Arrange & Act & Assert
    expect(sliderRangeInsets([60, 20, 40], scale, { ...ltr, orientation: "vertical" })).toEqual({
      start: { edge: "bottom", percent: 20 },
      end: { edge: "top", percent: 40 },
    });
  });
});

describe("sliderPointerValue", () => {
  const rect = { left: 100, width: 200, bottom: 300, height: 100 };

  it("reads a horizontal pointer from the left in left-to-right", () => {
    // Arrange & Act & Assert
    expect(sliderPointerValue({ x: 150, y: 0 }, rect, { ...scale, ...ltr })).toBe(25);
  });

  it("reads it from the right in right-to-left, or inverted", () => {
    // Arrange & Act & Assert
    expect(sliderPointerValue({ x: 150, y: 0 }, rect, { ...scale, ...ltr, dir: "rtl" })).toBe(75);
    expect(sliderPointerValue({ x: 150, y: 0 }, rect, { ...scale, ...ltr, inverted: true })).toBe(75);
    expect(sliderPointerValue({ x: 150, y: 0 }, rect, { ...scale, ...ltr, dir: "rtl", inverted: true })).toBe(25);
  });

  it("reads a vertical pointer from the bottom, or the top when inverted", () => {
    // Arrange
    const vertical = { ...scale, ...ltr, orientation: "vertical" as const };

    // Act & Assert
    expect(sliderPointerValue({ x: 0, y: 270 }, rect, vertical)).toBe(30);
    expect(sliderPointerValue({ x: 0, y: 270 }, rect, { ...vertical, inverted: true })).toBe(70);
  });

  it("reads along a scale that does not start at zero", () => {
    // Arrange & Act & Assert
    expect(sliderPointerValue({ x: 150, y: 0 }, rect, { min: 20, max: 60, step: 1, ...ltr })).toBe(30);
  });

  it("clamps a pointer beyond either end, and snaps to the step", () => {
    // Arrange & Act & Assert
    expect(sliderPointerValue({ x: 0, y: 0 }, rect, { ...scale, ...ltr })).toBe(0);
    expect(sliderPointerValue({ x: 999, y: 0 }, rect, { ...scale, ...ltr })).toBe(100);
    expect(sliderPointerValue({ x: 157, y: 0 }, rect, { ...scale, ...ltr, step: 10 })).toBe(30);
  });

  it("never snaps past max when the steps do not divide the scale", () => {
    // Arrange & Act & Assert
    expect(sliderPointerValue({ x: 300, y: 0 }, rect, { min: 0, max: 10, step: 4, ...ltr })).toBe(10);
  });
});

describe("sliderKeyValue", () => {
  it.each([
    ["ArrowRight", 51],
    ["ArrowUp", 51],
    ["ArrowLeft", 49],
    ["ArrowDown", 49],
    ["PageUp", 60],
    ["PageDown", 40],
    ["Home", 0],
    ["End", 100],
  ])("%s moves 50 to %d", (key, expected) => {
    // Arrange & Act & Assert
    expect(sliderKeyValue(key, 50, { ...scale, ...ltr })).toBe(expected);
  });

  it("mirrors the horizontal arrows right to left, and when inverted", () => {
    // Arrange & Act & Assert
    expect(sliderKeyValue("ArrowRight", 50, { ...scale, ...ltr, dir: "rtl" })).toBe(49);
    expect(sliderKeyValue("ArrowRight", 50, { ...scale, ...ltr, inverted: true })).toBe(49);
    expect(sliderKeyValue("ArrowRight", 50, { ...scale, ...ltr, dir: "rtl", inverted: true })).toBe(51);
    expect(sliderKeyValue("ArrowUp", 50, { ...scale, ...ltr, inverted: true })).toBe(51);
  });

  it("flips the vertical arrows when a vertical slider is inverted, but not its horizontal ones", () => {
    // Arrange
    const vertical = { ...scale, ...ltr, orientation: "vertical" as const };

    // Act & Assert
    expect(sliderKeyValue("ArrowUp", 50, vertical)).toBe(51);
    expect(sliderKeyValue("ArrowUp", 50, { ...vertical, inverted: true })).toBe(49);
    expect(sliderKeyValue("ArrowDown", 50, { ...vertical, inverted: true })).toBe(51);
    expect(sliderKeyValue("ArrowRight", 50, { ...vertical, dir: "rtl", inverted: true })).toBe(51);
    expect(sliderKeyValue("ArrowRight", 50, { ...vertical, inverted: true })).toBe(51);
  });

  it("snaps an off-step value to the step it lands near", () => {
    // Arrange & Act & Assert
    expect(sliderKeyValue("ArrowRight", 52, { ...scale, ...ltr, step: 5 })).toBe(55);
    expect(sliderKeyValue("PageDown", 52, { ...scale, ...ltr, step: 5 })).toBe(0);
  });

  it("leaves any other key alone", () => {
    // Arrange & Act & Assert
    expect(sliderKeyValue("Enter", 50, { ...scale, ...ltr })).toBeNull();
  });
});

describe("sliderSetThumb", () => {
  const bounds = { min: 0, max: 100, step: 5, minStepsBetweenThumbs: 0 };

  it("moves one thumb, clamped to the scale", () => {
    // Arrange & Act & Assert
    expect(sliderSetThumb([20], 0, 35, bounds)).toEqual([35]);
    expect(sliderSetThumb([20], 0, 120, bounds)).toEqual([100]);
    expect(sliderSetThumb([20], 0, -5, bounds)).toEqual([0]);
  });

  it("keeps a thumb between its neighbours, the given steps apart", () => {
    // Arrange
    const gapped = { ...bounds, minStepsBetweenThumbs: 2 };

    // Act & Assert
    expect(sliderSetThumb([20, 50, 80], 1, 10, gapped)).toEqual([20, 30, 80]);
    expect(sliderSetThumb([20, 50, 80], 1, 95, gapped)).toEqual([20, 70, 80]);
  });

  it("is null when the thumb would not move", () => {
    // Arrange & Act & Assert
    expect(sliderSetThumb([20, 50], 0, 60, bounds)).toEqual([50, 50]);
    expect(sliderSetThumb([50, 50], 0, 60, bounds)).toBeNull();
  });
});

describe("sliderClosestThumb", () => {
  it("is the nearest thumb, the first on a tie", () => {
    // Arrange & Act & Assert
    expect(sliderClosestThumb(70, [10, 60, 90])).toBe(1);
    expect(sliderClosestThumb(75, [60, 90])).toBe(0);
    expect(sliderClosestThumb(5, [10])).toBe(0);
  });
});
