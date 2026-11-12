import {
  listboxKeydown,
  listboxSeed,
  listboxSelect,
  listboxTypeahead,
  type ListboxKey,
  type ListboxState,
} from "../policy";

const state: ListboxState = {
  values: ["apple", "banana", "cherry"],
  selected: [],
  active: undefined,
  multiple: false,
  selectionFollowsFocus: false,
  orientation: "vertical",
  dir: "ltr",
};

const press = (key: string, modifiers: Partial<ListboxKey> = {}): ListboxKey => ({
  key,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  ...modifiers,
});

describe("listboxSelect", () => {
  it("replaces the selection in single mode", () => {
    // Arrange & Act
    const next = listboxSelect({ selected: ["apple"], multiple: false }, "banana");

    // Assert
    expect(next).toEqual(["banana"]);
  });

  it("keeps a re-selected option selected in single mode rather than toggling it off", () => {
    // Arrange & Act
    const next = listboxSelect({ selected: ["apple"], multiple: false }, "apple");

    // Assert
    expect(next).toEqual(["apple"]);
  });

  it("adds an unselected option in multiple mode, keeping the rest", () => {
    // Arrange & Act
    const next = listboxSelect({ selected: ["apple"], multiple: true }, "cherry");

    // Assert
    expect(next).toEqual(["apple", "cherry"]);
  });

  it("removes a selected option in multiple mode, keeping the rest", () => {
    // Arrange & Act
    const next = listboxSelect({ selected: ["apple", "cherry"], multiple: true }, "apple");

    // Assert
    expect(next).toEqual(["cherry"]);
  });
});

describe("listboxSeed", () => {
  it("lands on the first selected option, in list order", () => {
    // Arrange & Act
    const seed = listboxSeed({ values: state.values, selected: ["cherry", "banana"] });

    // Assert
    expect(seed).toBe("banana");
  });

  it("lands on the first option when nothing is selected", () => {
    // Arrange & Act
    const seed = listboxSeed({ values: state.values, selected: [] });

    // Assert
    expect(seed).toBe("apple");
  });

  it("ignores a selected value that is not in the list (a disabled option)", () => {
    // Arrange & Act
    const seed = listboxSeed({ values: ["banana", "cherry"], selected: ["apple"] });

    // Assert
    expect(seed).toBe("banana");
  });

  it("has nowhere to land in an empty list", () => {
    // Arrange & Act
    const seed = listboxSeed({ values: [], selected: [] });

    // Assert
    expect(seed).toBeUndefined();
  });
});

describe("listboxKeydown — moving the cursor", () => {
  it("moves to the next option on ArrowDown", () => {
    // Arrange & Act
    const outcome = listboxKeydown({ ...state, active: "apple" }, press("ArrowDown"));

    // Assert
    expect(outcome).toEqual({ cursor: "banana", selected: null });
  });

  it("moves to the previous option on ArrowUp", () => {
    // Arrange & Act
    const outcome = listboxKeydown({ ...state, active: "banana" }, press("ArrowUp"));

    // Assert
    expect(outcome).toEqual({ cursor: "apple", selected: null });
  });

  it("wraps from the last option to the first", () => {
    // Arrange & Act
    const outcome = listboxKeydown({ ...state, active: "cherry" }, press("ArrowDown"));

    // Assert
    expect(outcome).toEqual({ cursor: "apple", selected: null });
  });

  it("wraps from the first option to the last", () => {
    // Arrange & Act
    const outcome = listboxKeydown({ ...state, active: "apple" }, press("ArrowUp"));

    // Assert
    expect(outcome).toEqual({ cursor: "cherry", selected: null });
  });

  it("jumps to the first option on Home and the last on End", () => {
    // Arrange & Act
    const home = listboxKeydown({ ...state, active: "cherry" }, press("Home"));
    const end = listboxKeydown({ ...state, active: "banana" }, press("End"));

    // Assert
    expect(home).toEqual({ cursor: "apple", selected: null });
    expect(end).toEqual({ cursor: "cherry", selected: null });
  });

  it("enters the list from the near end when there is no cursor yet", () => {
    // Arrange & Act
    const down = listboxKeydown(state, press("ArrowDown"));
    const up = listboxKeydown(state, press("ArrowUp"));

    // Assert
    expect(down).toEqual({ cursor: "apple", selected: null });
    expect(up).toEqual({ cursor: "cherry", selected: null });
  });

  it("enters from the near end when the cursor is on an option no longer in the list", () => {
    // Arrange & Act
    const outcome = listboxKeydown({ ...state, active: "durian" }, press("ArrowUp"));

    // Assert
    expect(outcome).toEqual({ cursor: "cherry", selected: null });
  });

  it("uses the horizontal arrows, mirrored under RTL, in a horizontal list", () => {
    // Arrange
    const horizontal: ListboxState = { ...state, active: "banana", orientation: "horizontal" };

    // Act
    const right = listboxKeydown(horizontal, press("ArrowRight"));
    const rtlRight = listboxKeydown({ ...horizontal, dir: "rtl" }, press("ArrowRight"));
    const down = listboxKeydown(horizontal, press("ArrowDown"));

    // Assert
    expect(right).toEqual({ cursor: "cherry", selected: null });
    expect(rtlRight).toEqual({ cursor: "apple", selected: null });
    expect(down).toBeNull();
  });

  it("selects the option it lands on when selection follows focus", () => {
    // Arrange & Act
    const outcome = listboxKeydown(
      { ...state, active: "apple", selected: ["apple"], selectionFollowsFocus: true },
      press("ArrowDown"),
    );

    // Assert
    expect(outcome).toEqual({ cursor: "banana", selected: ["banana"] });
  });

  it("leaves a key it does not handle alone", () => {
    // Arrange & Act
    const outcome = listboxKeydown({ ...state, active: "apple" }, press("Tab"));

    // Assert
    expect(outcome).toBeNull();
  });

  it("leaves the keys alone in an empty list", () => {
    // Arrange & Act
    const outcome = listboxKeydown({ ...state, values: [] }, press("ArrowDown"));

    // Assert
    expect(outcome).toBeNull();
  });
});

describe("listboxKeydown — choosing", () => {
  it("selects the option under the cursor on Enter and on Space", () => {
    // Arrange & Act
    const enter = listboxKeydown({ ...state, active: "banana" }, press("Enter"));
    const space = listboxKeydown({ ...state, active: "banana" }, press(" "));

    // Assert
    expect(enter).toEqual({ cursor: null, selected: ["banana"] });
    expect(space).toEqual({ cursor: null, selected: ["banana"] });
  });

  it("toggles the option under the cursor in multiple mode", () => {
    // Arrange & Act
    const outcome = listboxKeydown(
      { ...state, multiple: true, active: "banana", selected: ["apple", "banana"] },
      press("Enter"),
    );

    // Assert
    expect(outcome).toEqual({ cursor: null, selected: ["apple"] });
  });

  it("leaves Enter and Space alone while there is no cursor", () => {
    // Arrange & Act
    const outcome = listboxKeydown(state, press(" "));

    // Assert
    expect(outcome).toBeNull();
  });
});

describe("listboxKeydown — range selection (multiple mode)", () => {
  const multiple: ListboxState = { ...state, multiple: true };

  it("moves and adds the option it lands on with Shift+Arrow", () => {
    // Arrange & Act
    const outcome = listboxKeydown(
      { ...multiple, active: "apple", selected: ["apple"] },
      press("ArrowDown", { shiftKey: true }),
    );

    // Assert
    expect(outcome).toEqual({ cursor: "banana", selected: ["apple", "banana"] });
  });

  it("moves without reselecting an option that is already selected", () => {
    // Arrange & Act
    const outcome = listboxKeydown(
      { ...multiple, active: "banana", selected: ["apple"] },
      press("ArrowUp", { shiftKey: true }),
    );

    // Assert
    expect(outcome).toEqual({ cursor: "apple", selected: null });
  });

  it("takes Shift+Arrow but does not wrap off either end", () => {
    // Arrange & Act
    const pastEnd = listboxKeydown({ ...multiple, active: "cherry" }, press("ArrowDown", { shiftKey: true }));
    const pastStart = listboxKeydown({ ...multiple, active: "apple" }, press("ArrowUp", { shiftKey: true }));

    // Assert
    expect(pastEnd).toEqual({ cursor: null, selected: null });
    expect(pastStart).toEqual({ cursor: null, selected: null });
  });

  it("takes Shift+Arrow but changes nothing while there is no cursor", () => {
    // Arrange & Act
    const outcome = listboxKeydown(multiple, press("ArrowDown", { shiftKey: true }));

    // Assert
    expect(outcome).toEqual({ cursor: null, selected: null });
  });

  it("moves the cursor as a plain arrow does with Shift in single mode", () => {
    // Arrange & Act
    const outcome = listboxKeydown({ ...state, active: "apple" }, press("ArrowDown", { shiftKey: true }));

    // Assert
    expect(outcome).toEqual({ cursor: "banana", selected: null });
  });

  it("selects every option with Ctrl+A, and Cmd+A", () => {
    // Arrange & Act
    const ctrl = listboxKeydown({ ...multiple, selected: ["banana"] }, press("a", { ctrlKey: true }));
    const meta = listboxKeydown({ ...multiple, selected: [] }, press("A", { metaKey: true }));

    // Assert
    expect(ctrl).toEqual({ cursor: null, selected: ["apple", "banana", "cherry"] });
    expect(meta).toEqual({ cursor: null, selected: ["apple", "banana", "cherry"] });
  });

  it("deselects everything with Ctrl+A once everything is selected", () => {
    // Arrange & Act
    const outcome = listboxKeydown(
      { ...multiple, selected: ["cherry", "apple", "banana"] },
      press("a", { ctrlKey: true }),
    );

    // Assert
    expect(outcome).toEqual({ cursor: null, selected: [] });
  });

  it("selects nothing with Ctrl+A in an empty list", () => {
    // Arrange & Act
    const outcome = listboxKeydown({ ...multiple, values: [] }, press("a", { ctrlKey: true }));

    // Assert
    expect(outcome).toEqual({ cursor: null, selected: [] });
  });

  it("selects from the cursor to the first option with Ctrl+Shift+Home, keeping the rest", () => {
    // Arrange
    const values = ["a", "b", "c", "d"];

    // Act
    const outcome = listboxKeydown(
      { ...multiple, values, active: "c", selected: ["b"] },
      press("Home", { ctrlKey: true, shiftKey: true }),
    );

    // Assert
    expect(outcome).toEqual({ cursor: "a", selected: ["b", "a", "c"] });
  });

  it("selects from the cursor to the last option with Ctrl+Shift+End", () => {
    // Arrange
    const values = ["a", "b", "c", "d"];

    // Act
    const outcome = listboxKeydown(
      { ...multiple, values, active: "b", selected: [] },
      press("End", { metaKey: true, shiftKey: true }),
    );

    // Assert
    expect(outcome).toEqual({ cursor: "d", selected: ["b", "c", "d"] });
  });

  it("takes Ctrl+Shift+Home but changes nothing while there is no cursor", () => {
    // Arrange & Act
    const outcome = listboxKeydown(multiple, press("Home", { ctrlKey: true, shiftKey: true }));

    // Assert
    expect(outcome).toEqual({ cursor: null, selected: null });
  });

  it("leaves the range shortcuts to the browser in single mode", () => {
    // Arrange & Act
    const all = listboxKeydown({ ...state, active: "apple" }, press("a", { ctrlKey: true }));
    const edge = listboxKeydown({ ...state, active: "apple" }, press("End", { ctrlKey: true, shiftKey: true }));

    // Assert
    expect(all).toBeNull();
    expect(edge).toBeNull();
  });

  it("leaves every other chord, and Alt, to the browser and the page", () => {
    // Arrange & Act
    const ctrlArrow = listboxKeydown({ ...multiple, active: "apple" }, press("ArrowDown", { ctrlKey: true }));
    const altArrow = listboxKeydown({ ...multiple, active: "apple" }, press("ArrowDown", { altKey: true }));
    const ctrlShiftArrow = listboxKeydown(
      { ...multiple, active: "apple" },
      press("ArrowDown", { ctrlKey: true, shiftKey: true }),
    );
    const ctrlAltA = listboxKeydown({ ...multiple, active: "apple" }, press("a", { ctrlKey: true, altKey: true }));

    // Assert
    expect(ctrlArrow).toBeNull();
    expect(altArrow).toBeNull();
    expect(ctrlShiftArrow).toBeNull();
    expect(ctrlAltA).toBeNull();
  });

  it("leaves Shift with a key it does not handle to the rest of the keymap", () => {
    // Arrange & Act
    const outcome = listboxKeydown({ ...multiple, active: "banana" }, press("Home", { shiftKey: true }));

    // Assert
    expect(outcome).toEqual({ cursor: "apple", selected: null });
  });
});

describe("listboxTypeahead", () => {
  const labels = ["Apple", "Avocado", "Banana", "Blueberry", "Cherry"];

  it("moves to the first option starting with the letter when there is no cursor", () => {
    // Arrange & Act
    const outcome = listboxTypeahead({ query: "", key: "a", labels, active: -1 });

    // Assert
    expect(outcome).toEqual({ query: "a", focus: 0 });
  });

  it("starts after the cursor, so repeating a letter cycles through its matches", () => {
    // Arrange & Act
    const outcome = listboxTypeahead({ query: "", key: "a", labels, active: 0 });

    // Assert
    expect(outcome).toEqual({ query: "a", focus: 1 });
  });

  it("cycles on from a cursor partway down rather than from the top", () => {
    // Arrange & Act
    const outcome = listboxTypeahead({ query: "", key: "a", labels: ["Apple", "Avocado", "Avocet"], active: 1 });

    // Assert
    expect(outcome).toEqual({ query: "a", focus: 2 });
  });

  it("searches a longer query from the top when there is no cursor", () => {
    // Arrange & Act
    const outcome = listboxTypeahead({ query: "a", key: "v", labels, active: -1 });

    // Assert
    expect(outcome).toEqual({ query: "av", focus: 1 });
  });

  it("treats one letter typed again as a repeat of that letter", () => {
    // Arrange & Act
    const outcome = listboxTypeahead({ query: "b", key: "b", labels, active: 2 });

    // Assert
    expect(outcome).toEqual({ query: "bb", focus: 3 });
  });

  it("wraps round to the top", () => {
    // Arrange & Act
    const outcome = listboxTypeahead({ query: "", key: "a", labels, active: 1 });

    // Assert
    expect(outcome).toEqual({ query: "a", focus: 0 });
  });

  it("narrows a longer query in place, matching the option under the cursor", () => {
    // Arrange & Act
    const outcome = listboxTypeahead({ query: "a", key: "v", labels: ["Apple", "Avocado", "Avocet"], active: 1 });

    // Assert
    expect(outcome).toEqual({ query: "av", focus: 1 });
  });

  it("matches without regard to case or surrounding space", () => {
    // Arrange & Act
    const outcome = listboxTypeahead({ query: "", key: "C", labels: ["  apple", " cherry "], active: -1 });

    // Assert
    expect(outcome).toEqual({ query: "c", focus: 1 });
  });

  it("extends the query but focuses nothing when no option matches", () => {
    // Arrange & Act
    const outcome = listboxTypeahead({ query: "", key: "z", labels, active: 0 });

    // Assert
    expect(outcome).toEqual({ query: "z", focus: null });
  });

  it("ignores a key that is not one character", () => {
    // Arrange & Act
    const outcome = listboxTypeahead({ query: "a", key: "Shift", labels, active: 0 });

    // Assert
    expect(outcome).toBeNull();
  });

  it("ignores every key in an empty list", () => {
    // Arrange & Act
    const outcome = listboxTypeahead({ query: "", key: "a", labels: [], active: -1 });

    // Assert
    expect(outcome).toBeNull();
  });
});
