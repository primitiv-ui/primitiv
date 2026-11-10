import { menuKeydown, menuTypeahead } from "../policy";

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
    expect(menuKeydown({ key, active: 0, count: 3 })).toEqual({ activate: 0 });
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

describe("menuTypeahead", () => {
  const labels = ["  Copy ", "Cut", "Paste", "Print", "Preview", "Delete"];

  it("moves to the next item after the focused one that starts with the letter, ignoring case and spaces", () => {
    // Arrange & Act & Assert
    expect(menuTypeahead({ query: "", key: "P", labels, active: 0 })).toEqual({ query: "p", focus: 2 });
  });

  it("cycles through the items starting with a repeated letter", () => {
    // Arrange & Act & Assert
    expect(menuTypeahead({ query: "p", key: "p", labels, active: 2 })).toEqual({ query: "pp", focus: 3 });
    expect(menuTypeahead({ query: "pp", key: "p", labels, active: 4 })).toEqual({ query: "ppp", focus: 2 });
  });

  it("matches a longer query from the focused item itself", () => {
    // Arrange & Act & Assert
    expect(menuTypeahead({ query: "p", key: "r", labels, active: 3 })).toEqual({ query: "pr", focus: 3 });
    expect(menuTypeahead({ query: "c", key: "o", labels, active: 0 })).toEqual({ query: "co", focus: 0 });
  });

  it("searches from the first item when none has focus", () => {
    // Arrange & Act & Assert
    expect(menuTypeahead({ query: "", key: "d", labels, active: -1 })).toEqual({ query: "d", focus: 5 });
  });

  it("keeps the query but moves nowhere when nothing matches", () => {
    // Arrange & Act & Assert
    expect(menuTypeahead({ query: "", key: "z", labels, active: 0 })).toEqual({ query: "z", focus: null });
  });

  it("moves nowhere in a menu with no items", () => {
    // Arrange & Act & Assert
    expect(menuTypeahead({ query: "", key: "a", labels: [], active: -1 })).toEqual({ query: "a", focus: null });
  });

  it.each([" ", "ArrowDown", "Enter"])("leaves %j alone", (key) => {
    // Arrange & Act & Assert
    expect(menuTypeahead({ query: "p", key, labels, active: 0 })).toBeNull();
  });
});
