import { modalPointerOutside, modalTabKeydown } from "../policy";

describe("modalTabKeydown", () => {
  it("leaves any key but Tab alone", () => {
    // Arrange & Act
    const outcome = modalTabKeydown({ key: "Enter", shiftKey: false, active: 2, count: 3 });

    // Assert
    expect(outcome).toBeNull();
  });

  it("wraps Tab from the last focusable to the first", () => {
    // Arrange & Act
    const outcome = modalTabKeydown({ key: "Tab", shiftKey: false, active: 2, count: 3 });

    // Assert
    expect(outcome).toEqual({ focus: 0 });
  });

  it("wraps Shift+Tab from the first focusable to the last", () => {
    // Arrange & Act
    const outcome = modalTabKeydown({ key: "Tab", shiftKey: true, active: 0, count: 3 });

    // Assert
    expect(outcome).toEqual({ focus: 2 });
  });

  it("leaves an interior Tab to the browser", () => {
    // Arrange & Act
    const forward = modalTabKeydown({ key: "Tab", shiftKey: false, active: 0, count: 3 });
    const backward = modalTabKeydown({ key: "Tab", shiftKey: true, active: 2, count: 3 });

    // Assert
    expect(forward).toBeNull();
    expect(backward).toBeNull();
  });

  it("leaves Tab alone when focus is on none of the focusables", () => {
    // Arrange & Act
    const outcome = modalTabKeydown({ key: "Tab", shiftKey: true, active: -1, count: 3 });

    // Assert
    expect(outcome).toBeNull();
  });

  it("blocks Tab when nothing inside is focusable, so focus cannot leak out", () => {
    // Arrange & Act
    const outcome = modalTabKeydown({ key: "Tab", shiftKey: false, active: -1, count: 0 });

    // Assert
    expect(outcome).toEqual({ focus: null });
  });
});

describe("modalPointerOutside", () => {
  const rect = { left: 10, top: 20, right: 110, bottom: 220 };

  it("is false for a point inside the dialog's box", () => {
    // Arrange & Act & Assert
    expect(modalPointerOutside(rect, { x: 50, y: 100 })).toBe(false);
  });

  it("counts the box's edges as inside", () => {
    // Arrange & Act & Assert
    expect(modalPointerOutside(rect, { x: 10, y: 20 })).toBe(false);
    expect(modalPointerOutside(rect, { x: 110, y: 220 })).toBe(false);
  });

  it.each([
    ["left of", { x: 9, y: 100 }],
    ["right of", { x: 111, y: 100 }],
    ["above", { x: 50, y: 19 }],
    ["below", { x: 50, y: 221 }],
  ])("is true for a point %s the box", (_where, point) => {
    // Arrange & Act & Assert
    expect(modalPointerOutside(rect, point)).toBe(true);
  });
});
