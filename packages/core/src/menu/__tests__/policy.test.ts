import { menuKeydown } from "../policy";

describe("menuKeydown", () => {
  it("moves down to the next item, wrapping from the last to the first", () => {
    // Arrange & Act & Assert
    expect(menuKeydown({ key: "ArrowDown", active: 0, count: 3 })).toEqual({ focus: 1 });
    expect(menuKeydown({ key: "ArrowDown", active: 2, count: 3 })).toEqual({ focus: 0 });
  });

  it("moves down to the first item when none has focus", () => {
    // Arrange & Act & Assert
    expect(menuKeydown({ key: "ArrowDown", active: -1, count: 3 })).toEqual({ focus: 0 });
  });

  it("moves up to the previous item, wrapping from the first (or none) to the last", () => {
    // Arrange & Act & Assert
    expect(menuKeydown({ key: "ArrowUp", active: 2, count: 3 })).toEqual({ focus: 1 });
    expect(menuKeydown({ key: "ArrowUp", active: 0, count: 3 })).toEqual({ focus: 2 });
    expect(menuKeydown({ key: "ArrowUp", active: -1, count: 3 })).toEqual({ focus: 2 });
  });

  it("jumps to the first item on Home and the last on End", () => {
    // Arrange & Act & Assert
    expect(menuKeydown({ key: "Home", active: 1, count: 3 })).toEqual({ focus: 0 });
    expect(menuKeydown({ key: "End", active: 1, count: 3 })).toEqual({ focus: 2 });
  });

  it.each(["Enter", " "])("activates the focused item on %j", (key) => {
    // Arrange & Act & Assert
    expect(menuKeydown({ key, active: 1, count: 3 })).toEqual({ activate: 1 });
  });

  it.each(["Enter", " "])("leaves %j alone when no item has focus", (key) => {
    // Arrange & Act & Assert
    expect(menuKeydown({ key, active: -1, count: 3 })).toBeNull();
  });

  it("closes on Escape", () => {
    // Arrange & Act & Assert
    expect(menuKeydown({ key: "Escape", active: 1, count: 3 })).toEqual({ open: false });
  });

  it.each(["ArrowDown", "Enter", "Escape"])("leaves %j alone in a menu with no items", (key) => {
    // Arrange & Act & Assert
    expect(menuKeydown({ key, active: -1, count: 0 })).toBeNull();
  });

  it.each(["Tab", "ArrowRight", "a"])("leaves %j alone", (key) => {
    // Arrange & Act & Assert
    expect(menuKeydown({ key, active: 1, count: 3 })).toBeNull();
  });
});
