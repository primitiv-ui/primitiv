import { collapsibleKeydown, collapsibleToggle, type CollapsibleState } from "../policy";

const closed: CollapsibleState = { open: false, disabled: false };
const open: CollapsibleState = { open: true, disabled: false };

describe("collapsibleToggle", () => {
  it("opens a closed collapsible", () => {
    // Arrange & Act
    const next = collapsibleToggle(closed);

    // Assert
    expect(next).toBe(true);
  });

  it("closes an open collapsible", () => {
    // Arrange & Act
    const next = collapsibleToggle(open);

    // Assert
    expect(next).toBe(false);
  });

  it("does nothing while disabled", () => {
    // Arrange & Act
    const next = collapsibleToggle({ ...open, disabled: true });

    // Assert
    expect(next).toBeNull();
  });
});

describe("collapsibleKeydown", () => {
  it.each(["Enter", " "])("toggles on %j", (key) => {
    // Arrange & Act
    const outcome = collapsibleKeydown(closed, key);

    // Assert
    expect(outcome).toEqual({ open: true });
  });

  it("closes an open collapsible from the keyboard", () => {
    // Arrange & Act
    const outcome = collapsibleKeydown(open, "Enter");

    // Assert
    expect(outcome).toEqual({ open: false });
  });

  it.each(["ArrowDown", "Home", "Escape", "a"])("leaves %j alone", (key) => {
    // Arrange & Act
    const outcome = collapsibleKeydown(closed, key);

    // Assert
    expect(outcome).toBeNull();
  });

  it("leaves Enter alone while disabled", () => {
    // Arrange & Act
    const outcome = collapsibleKeydown({ ...closed, disabled: true }, "Enter");

    // Assert
    expect(outcome).toBeNull();
  });
});
